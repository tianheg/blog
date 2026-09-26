---
title: ESP32-S3 在 Win11 上搭建 ESP-IDF 开发环境
status: draft
date: 2026-09-16T00:43:58+08:00
---

ESP32-S3-DevKitC-1 的环境搭建记录。没用 Arduino 起步，直接上 ESP-IDF —— Arduino core 底层就是 IDF，而 S3 的差异化能力（USB OTG、TinyML、双核 FreeRTOS）在 IDF 里才是第一手的。

## 三个组件的关系

搞清这个能省一半排障时间：

```
EIM（ESP-IDF Installation Manager）  ← 唯一的管理器
  └─ 装/删/切换 IDF 版本、装工具链、建 Python venv
  └─ 产出 C:\Espressif\tools\eim_idf.json（真相来源）

VS Code ESP-IDF 扩展                ← 消费者，不是第二个安装器
  └─ 读 eim_idf.json 发现所有 IDF 安装
  └─ 管环境变量，提供 Build/Flash/Monitor/Menuconfig 按钮

idf.py / esptool / openocd          ← 实际干活的命令行工具
```

EIM 是独立的跨平台工具，不管从 GUI、CLI 还是别的 IDE 触发的安装，任何读 `eim_idf.json` 的工具都能自动发现。**所以 EIM 装了不用删** —— 它和 VS Code 扩展共用同一份安装，不冲突，而且 `eim list` / `eim select` / `eim fix` 在排障时比点按钮直接。

VS Code 扩展内部也能拉起 EIM，所以 `winget install Espressif.EIM` 和扩展里点按钮两条路都行，选一条即可。

## 安装

```powershell
winget install Microsoft.VisualStudioCode
# 关掉终端重开，让 code 进 PATH
code --install-extension espressif.esp-idf-extension

winget install Espressif.EIM
eim install -i v6.1
```

装完在 VS Code 里：

```
F1 → ESP-IDF: Select Current ESP-IDF Version
F1 → ESP-IDF: Doctor Command      ← 验证，问题项直接标红
```

IDF 和 IDF_TOOLS_PATH 的路径里不能有空格，别选 `Program Files`。默认 `C:\Espressif` 就对。EIM 装到非默认位置时扩展认不出来，要设 `idf.eimIdfJsonPath`。

## 工程路径不能放在 WSL 文件系统里

踩得最久的一个坑。在 VS Code 里打开 WSL 目录、跑 Windows 版 `idf.py`，报：

```
CMakeLists.txt not found in project directory \\wsl.localhost\archlinux\home\<user>
Failed to set target esp32s3: non zero exit code 2
Your environment is not configured to handle Unicode characters
```

根因不是编码。`\\wsl.localhost\` 是 Windows 通过 9P 协议访问 WSL 文件系统的 UNC 路径，Windows 版的 idf.py / cmake / ninja 在上面问题极多，不是配置能修的。第二条报错只是顺带吐出来的警告，真正的死因是那句话里根本没有工程目录。

修法是换到本地盘：

```powershell
mkdir C:\esp -Force
cd C:\esp
```

顺带治编码：

```powershell
setx PYTHONUTF8 1     # 用户级永久，新终端生效
```

比开系统那个 "Beta: Use Unicode UTF-8" 好 —— 那个会让一些老中文程序乱码，`PYTHONUTF8` 只影响 Python，范围可控。

## 两个 USB 口功能完全不同

DevKitC-1 板子上有两个 USB 口，名字很像但接的是两套硬件：

| | `UART` 口 | `USB` 口（原生） |
|---|---|---|
| 芯片 | 板载 CP2102N 桥 | ESP32-S3 内置 USB Serial/JTAG |
| 驱动 | Silicon Labs CP210x | 系统自带 `usbser.sys`，无需装 |
| 设备管理器名称 | `CP210x USB to UART Bridge (COMx)` | `USB Serial Device (COMx)` |
| IDF 默认 console | UART0，开箱即用 | 需改 menuconfig |
| 早期启动日志 | 能看到 | 头几百毫秒丢失（USB 枚举慢） |
| JTAG 调试 | 不支持 | 唯一选择 |

设备管理器里的名称是最快的区分方法。

**只插一个口** —— 双插合法（双路供电），但会冒出两个 COM 口，容易选错。换口之后 COM 号会变，扩展里要重选。

### 走原生 USB 口的额外配置

IDF 默认把 console 输出指向 UART0。接原生 USB 口而不改配置的话，monitor 一片空白 —— 输出跑到没有物理连接的 UART0 上去了。

```
Component config → ESP System Settings → Channel for console output
  → USB Serial/JTAG Controller
```

对应 `CONFIG_ESP_CONSOLE_USB_SERIAL_JTAG`。

这里有个反直觉的点：**`idf.flashType` 仍然是 `UART`**。原生 USB 口的 CDC 部分对 esptool 就是个普通串口，USB Serial/JTAG 控制器能自动进下载模式，走 esptool 串口协议烧写就行，不需要 OpenOCD。

## 烧写方式被带偏到 JTAG

报错：

```
Can't perform JTAG flash, because OpenOCD server is not running!
```

原因是不需要 JTAG 却选了 JTAG。触发点在 `ESP-IDF: Set Espressif device target` 时选了 "onboard USB" —— 那个选项是给调试用的，不是给烧写用的。

改回来：`Ctrl+,` 搜 `idf.flashType` 选 `UART`。

### 真要用 JTAG 时

S3 内置 USB JTAG，不用买 ESP-Prog 就能下断点。但三件事缺一不可：

1. 线插原生 `USB` 口
2. 那个口在设备管理器里是复合设备，**Interface 2 必须绑 WinUSB**（Interface 0 是 CDC 串口）。Win10+ 联网自动装，装不上用 Zadig —— 关键坑是按钮下拉里选 **"Install Driver"** 而不是 "Install WCID Driver"，选错则 `DeviceInterfaceGUIDs` 写不进注册表，OpenOCD 报 `libusb_open() failed with LIBUSB_ERROR_NOT_FOUND`（看着像没接设备，其实是驱动没配对）
3. 先启动 OpenOCD server，board config 选 `board/esp32s3-builtin.cfg`

不想折腾驱动也有替代：`idf.py monitor` 自带 GDBStub，menuconfig 开 `CONFIG_ESP_SYSTEM_GDBSTUB_RUNTIME`，程序 panic 时直接掉进 GDB 看调用栈。不打硬件断点的话够用。

## 板载 RGB LED 是 WS2812

不是普通 LED。写 `gpio_set_level(38, 1)` 不会有任何反应，要走 RMT 外设 + 编码器。

引脚按板子版本区分：v1.0 是 **GPIO48**，v1.1 是 **GPIO38**。引脚表里的标注是 `GPIO38, FSPIWP, SUBSPIWP, RGB LED`。

例子路径：`ESP-IDF: Show Examples Projects` → `peripherals/rmt/led_strip`。

注意 **GPIO 号是源码里的宏，不在 menuconfig 里**：

```c
// main/led_strip_example_main.c
#define RMT_LED_STRIP_GPIO_NUM 0    // 改成 38（v1.1）或 48（v1.0）
```

同文件的 `EXAMPLE_LED_NUMBERS` 默认 8，板载只有 1 颗，改成 `1`。

跑通这个例子等于摸到了 RMT 外设 + 编码器模型，是驱动 WS2812、红外、DAC 的通用路子。

## 型号差异

| 订货码 | Flash | PSRAM | SPI 电压 |
|---|---|---|---|
| N8 | 8MB QD | — | 3.3V |
| N8R2 | 8MB QD | 2MB QD | 3.3V |
| N8R8 | 8MB QD | 8MB OT | 3.3V |
| N16R8V | 16MB OT | 8MB OT | 1.8V |
| N32R8V | 32MB OT | 8MB OT | 1.8V |

- N8R8 需要在 menuconfig 里把 Flash size 改成 8MB、PSRAM 开 Octal，否则按 4MB/无 PSRAM 跑
- Octa 型号的 GPIO35/36/37 被 flash/PSRAM 占用，接外设避开
- GPIO19/20 是 USB D-/D+，插了原生 USB 就不能当 GPIO 用

## 速查

```
Ctrl + ]                    退出 monitor
idf.py set-target esp32s3   设目标芯片
idf.py -p COMx flash monitor
idf.py menuconfig           配置
idf.py create-project NAME  建新工程

eim list / select / remove / fix / shell / run
```

烧不进去时：按住 BOOT → 点 RESET → 松 BOOT 进下载模式。烧成功一次之后通常不用再按。

报端口占用 = 上一个 monitor 没退出。

扩展面板的 Build/Flash/Monitor 按钮由扩展自己管环境变量，绕开终端 PATH 和编码问题，比命令行省事。

## 当天完成

两个例子跑通：`hello_world` 串口输出正常；`led_strip` 点亮板载 WS2812。

## 参考

- [Installation of ESP-IDF and Tools on Windows](https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/get-started/windows-setup.html)
- [ESP32-S3-DevKitC-1 v1.1 用户指南](http://web.archive.org/web/20241121065509/https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/hw-reference/esp32s3/user-guide-devkitc-1.html)
- [ESP-IDF Extension for VS Code 安装文档](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/installation.html)
- [ESP-IDF Installation Manager 文档](https://docs.espressif.com/projects/idf-im-ui/en/latest/general_info.html)
- [USB-Serial-JTAG Peripheral Introduction](https://docs.espressif.com/projects/esp-iot-solution/en/latest/usb/usb_overview/usb_serial_jtag.html)
- [JTAG Debugging - ESP32-S3](https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/api-guides/jtag-debugging/)
- [RMT Transmit Example -- LED Strip](https://github.com/espressif/esp-idf/tree/master/examples/peripherals/rmt/led_strip)
