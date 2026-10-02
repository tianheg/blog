---
title: Firefox
status: draft
date: 2025-06-15T19:22:54+08:00
header: Tools
---

日常主力：Windows 11 + Firefox Developer Edition。**只适用于 Linux 的内容统一放在文末「Linux 专属」一节，Android 专属内容放在「Firefox for Android」一节**，正文默认按 Windows 口径写。

### Configuration (about:config)
#### Useful about:config Settings
- `browser.tabs.splitView.enabled` - 像 Edge 分屏
- `xpinstall.signatures.required = false` - 允许本地安装未认证扩展文件
- `network.captive-portal-service.enabled = false` - 不尝试寻找 captive portals
- `network.notify.checkForProxies = false` - 不尝试寻找代理
- `browser.cache.disk.capacity = 8192000` - 增加磁盘缓存到 8GB
- `browser.cache.memory.capacity = 2097152` - 固定最大 2GB 内存缓存
- `browser.quitShortcut.disabled = true` - 防止意外关闭
- `browser.search.region = US`
- `doh-rollout.home-region = US`
- `gfx.webrender.all = true` - 启用 WebRender
- `layers.gpu-process.enabled = true` - GPU 进程加速
- `media.hardware-video-decoding.force-enabled = true` - 强制硬件解码
- `network.dnsCacheEntries = 20000` - DNS 缓存条目
- `network.dnsCacheExpiration = 3600` - DNS 缓存过期时间
- `network.ssl_tokens_cache_capacity = 32768` - TLS 令牌缓存
- `fission.autostart = false` - 禁用增强进程隔离（省内存）
- `dom.ipc.processCount = 1` - 减少进程数量
- `webgl.force-enabled = true`
- `toolkit.legacyUserProfileCustomizations.stylesheets = true` - 启用 userChrome.css
- `dom.security.sanitizer.enabled = true` - 启用 setHTML 支持
- `reader.parse-on-load.enabled = false` - 关闭阅读器视图自动加载
- `media.peerconnection.enabled = false` - 禁用 WebRTC（隐私）
- `extensions.webextensions.restrictedDomains` - 限制扩展运行的域名

注意 `gfx.webrender.enabled` 这个开关**已不存在**——它在 Firefox 117 被移除（Bugzilla 1842345），现在生效的是 `gfx.webrender.all`。

参考：
- https://github.com/arkenfox/user.js
- https://kb.mozillazine.org/About:config_entries
- http://web.archive.org/web/20260917122656/https://wiki.archlinux.org/title/Firefox
- http://web.archive.org/web/20260917122656/https://wiki.archlinux.org/title/FirefoxTweaks

#### DNS over HTTPS (DoH)
如果在 DoH 选择提供者的时候只有一个 custom，没有默认备选，可以尝试：
- 通过 UI 界面修改无线网的 DNS 为 `8.8.8.8,8.8.4.4`
- 设置 `network.trr.default_provider_uri = https://mozilla.cloudflare-dns.com/dns-query`
- 重启电脑后会出现 Cloudflare、NextDNS 等备选项

### 地址栏：内网域名直连（不当作搜索词）
在地址栏敲 `nas.lan` 这类内网域名，如果后缀既不在 Public Suffix List 里、又没被显式放行，Firefox 会把它当关键词丢给搜索引擎——内网机器名再多也搜不出来。这是地址栏的域名修复（fixup）逻辑，**不需要装扩展**（AMO 上搜不到做这件事的扩展，命中的都是别的用途），两条 pref 就够。

放行一个后缀：

```text
browser.fixup.domainsuffixwhitelist.lan = true
```

- 这**不是**已存在的 pref，要在 `about:config` 点右侧 **+** 新建，类型选 **Boolean**，值 `true`；不需要重启，立即生效
- pref 名是动态的：`browser.fixup.domainsuffixwhitelist.<后缀>`，`<后缀>` 不带前导的点。多一个内网后缀就再建一条
- 覆盖该后缀及其所有子域（`router.lan`、`nas.lan`、`a.b.lan` 全部直连）

默认已放行的后缀（`all.js` 里写死的）：`.test`、`.example`、`.invalid`、`.localhost`、`.internal`（2025-03 加）、`.local`。**`.lan` 不在里面**，必须自己加。

精确放行单个域名（只放一个名字，不涉及后缀）：

```text
browser.fixup.domainwhitelist.<完整域名> = true
```

单标签主机名（直接敲 `nas`、`router` 这种没有点的）：

```text
browser.fixup.dns_first_for_single_words = true
```

默认 `false`——单标签词一律先搜索；改成 `true` 后先试 DNS。

兜底提示（万一还是被搜了）：

```text
browser.urlbar.dnsResolveSingleWordsAfterSearch = 1
```

默认 `0`。设为 `1` 后，单标签搜索前先做一次 DNS 探测，内网能应答就弹「是否改为访问 xxx」；点 yes 会自动把对应的 `browser.fixup.domainwhitelist.*` 写上。代价是每次单词搜索都多一次 DNS 查询。

一刀切（地址栏永不搜索，输入什么都按 URL 处理）：

```text
keyword.enabled = false
```

不建议——打错一个字母就只剩报错页，不给自己留退路。

消费端在 `docshell/base/URIFixup.sys.mjs`，读 `browser.fixup.domainwhitelist.` 与 `browser.fixup.domainsuffixwhitelist.` 两个 pref 分支；早年那套 C++ 实现所在的 `docshell/base/nsDefaultURIFixup.cpp` 在当前版本已经不存在（逻辑整体迁到 JS 侧）。以上 pref 于 2026-10 在源码 tag `FIREFOX_158_0b2_RELEASE`（即 Dev Edition 158.0b2）逐条核对过，默认值同 `all.js` / `firefox.js`。

### Privacy & Security
#### Disable WebRTC
https://mullvad.net/en/help/webrtc

在 about:config 中设置 `media.peerconnection.enabled = false`。

#### Restrict Web Extensions on Domains
https://u.sb/firefox-no-webextensions/

打开 `about:config`，输入 `extensions.webextensions.restrictedDomains`，在后面加 `,example.com` 即可限制扩展在指定域运行。

默认限制域名：
```text
accounts-static.cdn.mozilla.net,accounts.firefox.com,addons.cdn.mozilla.net,addons.mozilla.org,api.accounts.firefox.com,content.cdn.mozilla.net,discovery.addons.mozilla.org,install.mozilla.org,oauth.accounts.firefox.com,profile.accounts.firefox.com,support.mozilla.org,sync.services.mozilla.com
```

### Extensions & Add-ons
#### Manifest v3
https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/

同一件事的两种写法：

```json
// Manifest v2
{
  "background": { "scripts": ["background.js"] },
  "browser_action": { "default_icon": "48.png" }
}

// Manifest v3
{
  "background": { "service_worker": "background.js" },
  "action": { "default_icon": "48.png" }
}
```

Firefox **同时支持 MV2 和 MV3**（不像 Chrome 那样停用 MV2），老扩展不必急着迁；新写扩展直接上 MV3。

#### Build Extensions
如何打开一个新标签：https://github.com/tianheg/all-my-sites

Firefox 56 以后，扩展会自动获得自己 origin 的权限，不需要 tabs 权限。（https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions#host_permissions）

参考：
1. [Browser Extensions - Mozilla | MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
2. [Getting started with web-ext | Firefox Extension Workshop](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/)

#### TabMixPlus
https://github.com/onemen/TabMixPlus

### Web Apps —— 把网站钉到任务栏（Taskbar Tabs）
Firefox 内置的 PWA 支持，源码里叫 Taskbar Tabs。地址栏右侧的「Add tab to taskbar」按钮（带下箭头的方块图标）：点一下就把当前网站装成一个独立窗口，并提示钉到 Windows 任务栏。

作用：
- **独立无壳窗口**：没有地址栏、标签栏、书签栏，只剩标题栏，看着像个原生桌面应用
- **任务栏独立图标**：用网站 favicon 当图标，和 Firefox 主图标分开展示
- **扩展照常生效**：这点强于 Chromium 系的 PWA——装的 addons 在这个瘦窗口里仍然工作
- **容器保留**：从容器标签创建的 Web App，启动后仍留在同一个容器里
- **数据落地**：`<profile>/taskbartabs/taskbartabs.json` 记 URL，图标在同目录 `icons/`（可以直接替换 .ico）
- **可从开始菜单卸载**：装出来的是独立 Web App 条目，不是一条普通的网址书签

版本与平台：
- Firefox 142 起在 Firefox Labs 里实验（`about:preferences#experimental` → 「Add sites to your taskbar」）
- Firefox 143 起 Windows 默认开启，pref 为 `browser.taskbarTabs.enabled = true`
- Linux 已支持但默认关闭（含 Flatpak）；Microsoft Store（MSIX）版不支持

两个限制：
- 它装的不是独立程序，本质是「钉一个特定 URL 的窗口快捷方式」，运行时仍由 Firefox 提供内核与扩展
- 已知 bug：第二个及以后安装的 Web App 任务栏图标会重复出现；从 Gmail 系站点创建会被认错成 Gmail（名称与图标都错）

撤掉的方式：地址栏那个按钮再点一次（变成 Remove tab from taskbar），或整体关掉功能——`browser.taskbarTabs.enabled = false`。

### Containers（多账户容器）—— 关闭与恢复
容器是 Gecko 自带的能力（webextension 里的 `contextualIdentities`），**不装扩展也能用**；装 Multi-Account Containers 那类扩展只是把 UI 打开。所以「卸载扩展」不等于「关掉容器」——扩展删掉后，标签右键的「Open in New Container Tab」照样还在。

三层关法，按需求选一层：
1. **只想让容器 UI 消失**：`about:preferences` → General → Tabs → 取消勾选 Enable Container Tabs。右键菜单、新建标签「+」号长按弹出的容器菜单、设置页的那个勾选项会一起消失
2. **彻底关**：`about:config` 里把 `privacy.userContext.enabled` 和 `privacy.userContext.ui.enabled` 都设为 `false`，重启 Firefox。它们控制的是功能本身，与 UI 显隐无关
3. **关了又自己回来**：说明有扩展持 `contextualIdentities` 权限，它会在下次启动时把 `privacy.userContext.enabled` 强制改回 `true`（Bugzilla 1748576）。正确顺序是先在 `about:extensions` 禁用/卸载扩展，再关 pref

三个坑（Bugzilla 1663547）：
- **关闭容器会连带关掉所有容器标签**，某些路径下连提示都没有（点了「Keep enabled」也照样禁掉并关标签）
- **被关掉的容器标签不进 Recently Closed Tabs**，恢复不回来——关之前先把容器里开着的页面记一下
- **容器数据没删**：容器里的 cookie / localStorage 仍然留着，重新开启容器就全回来

关联：Cookie AutoDelete 的设置项里有「Enable Support for Container Tabs」，只有真要跑容器工作流时才需要打开。

### 侧边栏与分屏（旧扩展方案已废弃）
早先用 Side View 扩展（Firefox Test Pilot 项目，2019 年该计划关停后扩展不再开发）把网站塞进侧边栏。**这套方案现在不需要了**，浏览器原生就具备：

- **原生侧边栏**：Firefox 136 起对所有用户开放（Settings → General → Browser Layout → Show sidebar），内置书签 / 历史 / 其他设备标签页 / 聊天机器人
- **旧版侧边栏 2026 年退役**：Q2 2026 起分批迁移，**Firefox 153（2026-07-21）完全移除**，相关 pref 一并删掉
- **分屏**：`browser.tabs.splitView.enabled`，同一窗口内左右两个标签页；把其中一半拖窄就是侧边栏效果

要「始终看得见某个页面」，用原生分屏 / 侧边栏，不要再装 Side View。

### DevTools
用户文档：https://developer.mozilla.org/en-US/docs/Web/JavaScript 的 Developer tools 部分

工具站与订阅源：
- https://www.canidev.tools/
- https://devtoolstips.org/
- https://css-tricks.com/tag/devtools/
- https://umaar.com/dev-tips/

零散技巧：
- **搜索 DOM 树中的节点**：Inspector 下的搜索框，然后 Scroll Into View 跳到对应节点（the node within the viewport）
- **从 console 访问节点**：`$0` 是当前选中的 DOM 节点；临时变量用右键 → Use in Console
- **用徽章可视化元素**：badge 显示元素类型，见 [Ffdocs](https://firefox-source-docs.mozilla.org/devtools-user/page_inspector/how_to/examine_and_edit_html/index.html#html-tree)
- 给 DOM Node 截图；在响应式模式下截图
- Chrome Tip：Inspect the top layer
- Firefox Tip：Click label's `for` attribute，跳到对应 `id`
- [Some Cross-Browser DevTools Features You Might Not Know — CSS-Tricks](https://css-tricks.com/some-cross-browser-devtools-features-you-might-not-know/)

### 扩展清单（2022 年起用过的）
按用途分类；停更或已被取代的移到下方「已淘汰」，不再列在正式清单里。

- **拦截与隐私**：uBlock Origin、Privacy Badger、DuckDuckGo Privacy Essentials
- **翻译与词典**：Immersive Translate（沉浸式翻译，双语对照）、Swift Selection Search
- **开发**：React Developer Tools、Vue.js devtools、Wappalyzer、Extension Inspector、Refined GitHub、Github Repo Size、Hoppscotch Browser Extension
- **阅读与效率**：Smart TOC、OneTab、Shortkeys（自定义快捷键）、Video Speed Controller、Zoom Page WE、Print Friendly & PDF、FireShot（整页截图）、Display #Anchors
- **内容与订阅**：RSSHub Radar、Wayback Machine、Tampermonkey、Stylus、Gesturefy、Right Links WE
- **主题与外观**：automaticDark（按时段切主题）
- 其它：Cookie AutoDelete、Emoji

已淘汰 / 已被取代：
- **Side View** — Test Pilot 计划 2019 年关停，扩展停止开发；功能已被原生侧边栏 + 分屏覆盖
- **Decentraleyes** — 长期不更新（最后提交停留在数年前），社区 fork **LocalCDN** 支持更多 CDN 且仍在维护
- **Saladict 沙拉查词** — 主仓库停更，Chrome 侧因 MV2 被停用；替代品为「沙拉翻译」
- **Proxy SwitchyOmega 原版** — AMO 上停在 2018 年的 2.5.x，改用 Zero Omega / OmegaLite 这类 fork

### Performance & 定制清单（借鉴 RubenKelevra 的 Firefox tweaks gist）

> 该 gist 最后更新 2023-07，之后 Firefox 渲染栈和 pref 体系都动过，逐条核对再抄。已确认失效的一条：`gfx.webrender.enabled` 在 Firefox 117 被移除，现行开关是 `gfx.webrender.all`。本文开头「Useful about:config Settings」里的大半条目本来就出自同一份 gist 的早期版本，下面是它更完整、更成体系的版本。

#### 扩展侧的三个加速点
- **uBlock Origin**：确保 `Disable pre-fetching` 是**关**的。开着会明显拖慢导航——Firefox 不再预取任何内容
- **JSLibCache**：打开 `Allow header modification`。否则带参数的 URL 上，很多 JS 库不会被改写成走本地缓存；这不影响站点正确性。同时把它提供的 uBlock rules 贴进 uBlock 的 Dashboard → My rules → Save → Commit，避免 uBlock 拦掉改写
- **Cache Longer**：装上即可。延长条目的缓存留存时间——NVMe 读本地缓存比走网络快得多，命中率提高对加载时间的影响很直接

#### 缓存与 IO
```text
browser.cache.disk.smart_size.enabled = false      # 关掉智能容量伸缩
browser.cache.frecency_half_life_hours = 18        # 降低缓存清扫频率
browser.cache.max_shutdown_io_lag = 16             # 关闭时多写一点 IO
browser.cache.memory.max_entry_size = 327680       # 单条内存缓存对象上限
browser.cache.disk.metadata_memory_limit = 15360   # 常用 metadata 的内存池（KB）
```
这几条跟前面的 `browser.cache.disk.capacity` / `browser.cache.memory.capacity` 配合用：先关 smart size，固定上限才有意义。

#### GFX 渲染
```text
gfx.canvas.accelerated = true
gfx.canvas.accelerated.cache-items = 32768
gfx.canvas.accelerated.cache-size = 4096
gfx.content.skia-font-cache-size = 80
gfx.webrender.compositor = true
gfx.webrender.compositor.force-enabled = true
gfx.webrender.precache-shaders = true
gfx.webrender.program-binary-disk = true
image.mem.decode_bytes_at_a_time = 65536
image.mem.shared.unmap.min_expiration_ms = 120000
image.cache.size = 10485760
media.memory_cache_max_size = 1048576
media.memory_caches_combined_limit_kb = 3145728
```
`gfx.webrender.software.opengl` 和 `layers.acceleration.force-enabled` 属于前 WebRender 时代的遗留项，Windows 上别去动——它们的历史背景见文末「Linux 专属」。

#### 预测式网络操作
```text
network.dns.disablePrefetchFromHTTPS = false
network.dnsCacheExpirationGracePeriod = 240
network.predictor.enable-hover-on-ssl = true
network.predictor.enable-prefetch = true
network.predictor.preconnect-min-confidence = 20
network.predictor.prefetch-force-valid-for = 3600
network.predictor.prefetch-min-confidence = 30
network.predictor.prefetch-rolling-load-count = 120
network.predictor.preresolve-min-confidence = 10
```
信心阈值调低 = 更早去解析 / 预连 / 预取，用带宽换点击后的等待时间。

#### 少进程、少隔离（省内存）
```text
fission.autostart = false
privacy.partition.network_state = false
dom.ipc.processCount = 1
dom.ipc.processCount.webIsolated = 1
```
理由：Firefox 默认按 CPU 核数开内容进程，内存开销远超必要；而且切标签时不只是把内容换回内存，还要重复换入库等库的副本。代价是站间隔离变弱——这是「省内存」和「隔离强度」之间的取舍，两台机器口径不必一致。

#### 收尾（做完 pref 再跑）
1. 重启 Firefox
2. 进 `about:support`，滚到 Places Database，点 **Verify Integrity**（重写数据库）
3. 同一页右上角点 **Clear startup cache**
4. 再重启一次

#### 明确不建议照抄的一条
gist 建议在 `about:preferences#privacy` 选 Custom、关掉全部过滤项，并禁用 Security 区的 **Block dangerous and deceptive content**。它确实吃 CPU，但代价是失去恶意下载拦截——这笔账不划算，保留。

#### gist 里另外几个值得装的扩展
- **I don't care about cookies** / **Consent-O-Matic**：自动处理 cookie 同意弹窗，装上即可
- **Cookie AutoDelete**：关掉 Show Notification After Automatic Cleanup；容器相关设置见上面 Containers 一节
- **SponsorBlock**：YouTube 自动跳过赞助片段
- **Bypass Paywalls Clean**：绕部分付费墙，代价是更新频繁索要新权限（汉堡菜单会出现 `!` 提示）

### User Styles
#### userChrome.css 放在哪
profile 目录在 `about:support` → Profile Directory 里能看到（点 Open Directory 直接打开）。

- **Windows**：`%APPDATA%\Mozilla\Firefox\Profiles\<profile>\chrome\userChrome.css`
- **Linux**：`~/.mozilla/firefox/<profile>/chrome/userChrome.css`

Dev Edition 的 profile 名通常形如 `***.dev-edition-default`。`chrome/` 目录默认不存在，需要自己建。改之前确认 `about:config` 里 `toolkit.legacyUserProfileCustomizations.stylesheets` 是 `true`，否则文件写了也不生效。

#### Hide Tabbar
```css
#TabsToolbar {visibility: collapse;}
```

#### View Dark PDF
Bookmarklet 反转 PDF 颜色：

```javascript
javascript:(function(){var el = typeof viewer !== 'undefined' ? viewer : document.body; el.style.filter = 'grayscale(1) invert(1) sepia(1) contrast(75%)';})()
```

https://scottpaterson.ca/firefox-dark-mode-pdf/

### Troubleshooting
#### Network Errors
- `NS_ERROR_CORRUPTED_CONTENT` - 内容损坏错误

#### PR_END_OF_FILE_ERROR
使用 Proxy SwitchyOmega 扩展加 gfw list 导致 `PR_END_OF_FILE_ERROR` 错误。属于 VPN 配置问题。

参考：
- https://www.hostinger.com/tutorials/pr_end_of_file_error
- https://support.mozilla.org/en-US/questions/1315880

#### RSS File Open Loop
有的网站访问 RSS 页面时是下载 *.rss 文件。如果用 Firefox 打开，Firefox 可能不停地打开这个文件。删除本地文件即可停止。

### Firefox for Android

Android 端（源码名 Fenix）与桌面版是两套代码，这一节只记 Android 专属的内容。

零散一条：在 Firefox Android 上，JS bookmarklet 只能在空白页面运行。

#### Secret Settings（隐藏的实验开关页）
设置里藏着一页开发者开关，全是 Mozilla 内部用来灰度、试验、调试的布尔项——同一个版本号上，两个人看到的行数可能不一样（有些项只在 Nightly / Beta / Debug 渠道出现，另一些受 Nimbus 实验影响），也没有任何正式支持。

打开方式：设置 → 关于 Firefox → 连点 Firefox logo，直到出现 `Debug menu: (#) click(s) left to enable`，返回设置页就会多出 Secret Settings 与 Secret Debug Info。

页面结构：顶栏一行 `Show debug info`（点开是调试信息面板）、九个分类（Toolbar / Search / Homepage / Tabs / Network / Performance / Terms of Service / Features / Debug）、底部一个 `Reset switches to defaults` 按钮。

##### Toolbar
- Use a minimal bottom toolbar while entering text in a website —— 网页里输入时收起底栏。源码里当前被强制隐藏（Bug 1943053 暂时禁用）
- Animate dynamic toolbars based on website scroll data —— 动态工具栏跟着页面滚动数据动
- Enable Custom Tab Extension List —— 自定义标签页扩展列表
- Enable Google Lens Integration —— Google Lens
- Show Voice Search in Display Toolbar —— 工具栏显示语音搜索
- Enable focus mode —— focus 模式下也显示工具栏
- Enable menu customization —— 菜单自定义

##### Search
- Enable Firefox Suggest —— 地址栏搜索建议（带赞助项）。开关会连带启停后台的 suggestions 数据摄取任务
- Enable Remote Search Configuration (requires restart) —— 搜索引擎清单改从 Mozilla 的 Remote Settings 服务器同步，而不是只用客户端内置那份。现在默认走这条路
- Search Optimization Feature / …Flight cards / …Sport cards / …Stock cards —— 搜索优化卡片（航班/体育/股票）

##### Homepage
- Enable Homepage as a New Tab —— 新标签页直接开首页
- Enable universal edge-to-edge wallpapers —— 壁纸铺满整屏（含状态栏区域）
- Enable Ads Client for Stories —— 首页 Stories 内容流的广告客户端
- Enable Private Mode and Stories Entry Point —— 私密模式与 Stories 的入口
- Enable Add Shortcuts Improvement —— 快捷方式管理的改进实现
- Enable Homepage Weather Widget —— 首页天气小组件
- Show More Shortcuts —— 首页显示更多快捷方式（默认只放一小排）
- Enable Homepage Customization —— 首页自定义（拖动/增删）
- Hide Collections UI —— 隐藏「集合」入口
- Migrate Collections to Tab Groups —— 把旧的 Collections 迁移成 Tab Groups。**涉及标签数据，别顺手打开**

##### Tabs
- Enable Tab Manager opening animation —— 标签管理器打开动画，纯视觉
- Enable Tab Groups Drag and Drop —— 标签组拖放
- Enable Live Reorder for Drag and Drop —— 拖放时实时重排
- Enable Tab Groups Onboarding / …Strip / …In Menu —— 标签组引导、标签组条、菜单里的标签组
- Enable tab reload cover —— 重载标签时先盖一层
- Enable scroll-aware capture (requires tab reload cover) —— 上面那层的滚动感知截图

##### Network
- Enable DNS over HTTPS settings —— 把 DoH 的配置入口放回常规设置（不是直接开启 DoH，只是让那个设置项可见）
- Enable LNA blocking feature overall (required for anything LNA) —— Local Network Access 总开关，其他 LNA 项都依赖它
- Enable LNA request blocking —— 拦网页向本地网络发起的请求
- Enable LNA tracker blocking —— 拦 LNA 相关的跟踪

##### Performance
- Enable Isolated Content Process (requires restart) —— 独立内容进程
- Enable Isolated Processes with Zygote Preloading (requires restart) —— 带 Zygote 预加载的独立进程（另需 Android 10+）
- Enable Power Saving Mode automatically (follows OS battery saver) / …manually —— 跟随系统省电模式 / 手动开省电模式

##### Terms of Service
用来测条款流程的三个开关：标记 ToU 已接受、把「最新更新日期」改成现在（触发条款已更新的流程）、打开 30 秒倒计时。

##### Features
- Use Nimbus Preview Collection (requires restart) —— 提前订阅尚未全量推送的 Nimbus 实验集合，等于自愿当实验对象
- Enable Address Sync for supported regions —— 地址（含电话/邮箱）同步
- Show onboarding on each app cold open —— 每次冷启动都重放引导
- Enable Native Android Share Sheet —— 用 Android 原生分享面板替代 Firefox 自绘的（**Android 14 以上才显示这一项**）
- Shake to summarize / Listen to page —— 摇一摇总结、朗读页面
- Enable Weekly Privacy Notification Feature / Force weekly privacy report notification trackers over threshold —— 每周隐私报告通知，以及强制触发它
- Enable Microsurvey Feature —— 应用内微调查
- Use third party CA certificates —— 除 Firefox 自带根证书库外，再信任 Android 系统 CA 库（含用户自己导入的证书），源码里落到 GeckoView 的 `enterpriseRootsEnabled`。给企业内网 PKI / 自签代理用；代价是信任集合变大，凡是系统信任的中间人证书都能解密你的 HTTPS。**保持关闭**
- Enable Import Bookmarks / Enable Import Passwords —— 从别的浏览器导入书签/密码，只在该项目的 Debug 渠道可见
- Enable Longfox —— 还在早期开发的实验功能，默认关。源码里有 peek animation 的显示计数与 game state；Bug 里明说是「悄悄开发、不让用户注意到」，后来又把开关暴露到所有渠道，好让被实验选中的人能关掉
- Enable IP Protection UI / Locations selection / Use GPI authentication —— 内置 VPN（IP Protection）的界面、地区选择与认证
- Show Archived Version Button On Error Pages —— 出错页给一个「看 Wayback 存档」按钮
- Enable Uninstall Survey —— 卸载后调查
- Show OLED Theme option —— 暴露纯黑 OLED 主题选项
- Use New PDF Tools —— 新的内置 PDF 工具
- Use new Account Settings UI —— 新版账户设置界面

##### Debug
- Enable Debug Drawer —— 调试抽屉
- Enable New Crash Flow —— 新版崩溃处理界面
- Keep Debug Menu revealed —— 保持调试菜单常驻可见
- Never show Crash Pull —— 不再显示崩溃上报提示
- Custom Glean server URL (requires restart) —— 把遥测（Glean）上报指向自建服务器
- Remote Settings Server (requires restart) —— 点进去改 Remote Settings 的数据来源服务器（子页面，不特指 staging）

##### 两个细节
**Reset 按钮不重置文本框类设置。** 它的确认弹窗写得很清楚：把所有开关恢复默认，但 Custom Glean Server 与 Remote Settings Server 不受影响——那两个不是开关，是子页面/文本框。

**只在 Nightly / Debug（部分含 Beta）才出现的项**：动态工具栏、自定义标签页扩展、Google Lens（含 Beta）、语音搜索、地址同步、Wayback 按钮、新标签页首页、标签组全套、LNA 三项、两个「独立进程」、IP Protection 成套、Shake to summarize、Listen to page、每周隐私通知、Terms of Service 三项、搜索优化（含 Beta）、Custom Glean server。「导入书签/密码」只在 Debug 渠道。Release 渠道能看到的其余项，就是普通实验开关——能开，但没人保证下个版本还在。

**开发构建的另一个口子**：debug 构建可以在 `local.properties` 里用 `secretSettings.<pref_key>=true|false` 预设这批开关，每次重编译都会重新应用（手动改过的这几项会被重置）。

##### 哪些真值得开
- **Enable DNS over HTTPS settings** —— 想配加密 DNS，就靠它把入口露出来
- **Show OLED Theme option** —— 有 OLED 屏的话
- 其余保持默认。这页的定位是「给实验开的口子」，不是「隐藏的高级设置」，多开只会让浏览器行为和别人的不一样

##### 本节的来源
- [Debug settings menu instructions — Firefox Source Docs](https://firefox-source-docs.mozilla.org/mobile/android/fenix/Secret-settings-debug-menu-instructions.html)
- [SecretSettingsFragment.kt — 各开关的可见性与行为](https://github.com/mozilla-firefox/firefox/blob/main/mobile/android/fenix/app/src/main/java/org/mozilla/fenix/settings/SecretSettingsFragment.kt)
- [secret_settings_preferences.xml — 页面上的分类与条目顺序](https://github.com/mozilla-firefox/firefox/blob/main/mobile/android/fenix/app/src/main/res/xml/secret_settings_preferences.xml)
- [static_strings.xml — 各项的界面文案](https://github.com/mozilla-firefox/firefox/blob/main/mobile/android/fenix/app/src/main/res/values/static_strings.xml)
- [Bug 2022529 — Add longfox secret setting](https://bugzilla.mozilla.org/show_bug.cgi?id=2022529)
- [Bug 2048200 — Expose longfox secret setting to all release types](https://github.com/mozilla-firefox/firefox/commit/44d22b4bad306c0db1c77ff474122e94a2a1f80e)

### Browser Support
#### Element.setHTML Support
https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML

在 about:config 中设置 `dom.security.sanitizer.enabled = true`，重启 Firefox。

### Linux 专属
只在 Linux 上才有意义的内容集中放在这里，Windows 端不用管。

#### Wayland
为 Firefox 添加环境变量 `MOZ_ENABLE_WAYLAND=1`。

`~/.config/environment.d/envvars.conf`：

```text
MOZ_ENABLE_WAYLAND=1
```

参考：
1. https://wiki.archlinux.org/title/Firefox#Wayland
2. https://wiki.archlinux.org/title/Environment_variables#Wayland_environment
3. https://bugzilla.mozilla.org/show_bug.cgi?id=wayland

#### 硬件视频解码（VAAPI）
```text
media.ffmpeg.vaapi.enabled = true
```
Linux 走 VAAPI 硬解；Windows 上的对应开关是 `media.hardware-video-decoding.force-enabled`（见正文）。

#### 渲染兼容开关（前 WebRender 时代遗留）
```text
layers.acceleration.force-enabled = false
gfx.webrender.software.opengl = true
```
Linux 上历史上用它们绕过 OpenGL / 加速黑名单。Firefox 88 起 WebRender 在 Linux 上默认开启，`layers.acceleration.force-enabled` 基本失去作用；gist 自己在 2023-04 也把它的建议值从 `true` 改成 `false`（理由是可能反而拉高 CPU）。现代硬件上保持默认、别改。

#### Arch Linux Search 扩展
https://aur.archlinux.org/packages/firefox-extension-arch-search

点击 Sources 的 *.xpi 文件即可安装。


相关：[[js-expressjs|js-expressjs]]

## 参考
- [Web Apps in Firefox — Firefox Source Docs](https://firefox-source-docs.mozilla.org/browser/components/taskbartabs/docs/index.html)
- [Give web apps in Firefox a try on Labs — Mozilla Connect](https://connect.mozilla.org/t5/firefox-labs/give-web-apps-in-firefox-a-try-on-labs-and-tell-us-what-you/m-p/103870)
- [How does pin to taskbar work? — Mozilla Connect](https://connect.mozilla.org/t5/discussions/how-does-pin-to-taskbar-work/m-p/105758)
- [Enable or Disable PWA Support and "Add Tab to Taskbar" Button in Firefox — AskVG](https://www.askvg.com/enable-or-disable-pwa-support-and-add-tab-to-taskbar-button-in-firefox/)
- [Using web apps in Firefox for Windows — Mozilla Support](https://support.mozilla.org/en-US/kb/web-apps-firefox-windows)
- [How to disable Containers in Firefox — Winaero](https://winaero.com/how-to-disable-containers-in-firefox/)
- [Bug 1748576 — 扩展持 contextualIdentities 权限时 privacy.userContext.enabled 不持久](https://bugzilla.mozilla.org/show_bug.cgi?id=1748576)
- [Bug 1663547 — 关闭容器功能会连带关掉容器标签](https://bugzilla.mozilla.org/show_bug.cgi?id=1663547)
- [Bug 1842345 — Remove gfx.webrender.enabled pref（Firefox 117）](https://bugzilla.mozilla.org/show_bug.cgi?id=1842345)
- [Phasing Out the Older Version of Firefox Sidebar — Mozilla Connect](https://connect.mozilla.org/t5/discussions/phasing-out-the-older-version-of-firefox-sidebar-in-2026/m-p/115477)
- [Sidebar and Vertical Tabs Launch in Release 136 — Mozilla Connect](https://connect.mozilla.org/t5/discussions/sidebar-and-vertical-tabs-launch-in-release-136/m-p/89652)
- [mozilla/side-view Issue #444 — Is this Dead?](https://github.com/mozilla/side-view/issues/444)
- [LocalCDN（Decentraleyes 的维护中 fork）](https://www.localcdn.org/)
- [Add-on signing in Firefox（xpinstall.signatures.required）](https://support.mozilla.org/en-US/kb/add-on-signing-in-firefox)
- [RubenKelevra: Firefox tweaks gist](https://gist.github.com/RubenKelevra/fd66c2f856d703260ecdf0379c4f59db)
- [Firefox performance tweaks（另一份清单）](https://xn--ime-zza.eu/3)
- [GoToIntranetSiteForSingleWordEntryInAddressBar — Firefox administrator reference（domainwhitelist / domainsuffixwhitelist 的官方说明）](https://firefox-admin-docs.mozilla.org/reference/policies/gotointranetsiteforsinglewordentryinaddressbar/)
- [De-crappifying Firefox's automatic address mangling — cameratim](https://www.cameratim.com/computing/decrapping-firefox)
- [docshell/base/URIFixup.sys.mjs — 读取 fixup 白名单 pref 的实现](https://github.com/mozilla-firefox/firefox/blob/main/docshell/base/URIFixup.sys.mjs)
