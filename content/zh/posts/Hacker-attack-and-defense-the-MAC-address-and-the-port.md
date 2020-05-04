---
title: 新手学黑客攻防-认识MAC地址和如何操作端口
categories: ["技术"]
toc: true
date: 2020-03-17T16:45:02+08:00
tags: ["MAC", "端口", "基础"]
---

### 认识 MAC地址

MAC ( Medium / Media Access Control，介质访问控制 ) 地址，用来定义网络设备的位置。在 OSI 参考模型中，第三层网络层负责 IP 地址，第二层数据链路层则负责 MAC 地址。因此一个主机会有一个 IP 地址，而每一个网络位置都会有一个专属于它的 MAC 地址。

<!--more-->

#### 什么是 MAC 地址

MAC 地址，也叫硬件地址，是由 48 比特（ 6字节 ）长，十六进制的数字组成，是识别 LAN （局域网）节点的标识。

MAC 地址在网卡里。网卡的物理地址通常由网卡生产厂家写入网卡的 EPROM （一种闪存芯片，通常可以通过程序擦写）中，它存储的是传输数据时真正用于标识发出数据和接收数据的主机地址。

MAC 地址就如同身份证号码，具有全球唯一性。

#### 如何获取本机 MAC 地址

在 Windows 10 中主要有两种方式获取本机 MAC 地址。

第一种，在命令提示符中输入`ipconfig /all`，你有几个网卡就会有几个 `Physical Address`，也就是 MAC 地址。因为我使用了 `VMware Workstation` 和 `VM Virtualbox` 这两款虚拟机软件，所以会虚拟出网卡供虚拟电脑使用，这同样会生成 MAC 地址。

第二种，在连接网络的图标那里，点击已连接网络的属性，在这里可以找到`Physical Address`。

### 黑客如何进入别人的电脑

端口是计算机与外界进行通信交流的出口。这也是黑客进入电脑的通道。

#### 端口——黑客进出的门户

端口主要分为硬件端口和软件端口两种。其中硬件端口又称为接口，分为串行接口和并行接口两种。串行接口主要有 USB、SATA、 和 IDE 等，平常使用的打印机接口属于并行接口。软件端口一般指网络中面向连接服务和无连接服务的通信协议端口，是一种抽象的软件结构，包括一些数据结构和 I / O （输入/输出）缓冲区。

在网络技术中，端口（Port）的含义由多种。集线器、交换机、路由器的端口指的是连接其他网络设备的接口，如 RJ-45 端口、Serial 端口等。这里所指的端口不是物理意义上的端口，而是特指 TCP/IP 中的端口，而是逻辑意义上的端口。

端口用来解决主机应该把接收到的数据包传送给众多同时运行进程中的哪一个的问题。例如， http 使用 80 号端口， FTP 使用 21 号端口，这样通过不同的端口，电脑同时运行的不同程序就可以互不干扰地进行通信了。通常来说，一台电脑一般有 65,535 个端口，但常用的端口只有几十个，由此可见，还有大量的端口没有使用。这样，黑客程序就可以采用某种方法，打开没有使用的端口，从而对电脑进行控制。

Port(computer networking)-wikipedia:

In computer netwoking, a port is a communication endpoint. At the software level, within an operating system, a port is a logical construct that identifies a speciflc process or a type of network service. Ports are identified for each protocol and address combination by 16-bit unsigned numbers, commonly known as the port number. The most common protocols that use port numbers are the Transmussion Control Protocol(TCP) and the User Datagram Protocol(UDP).

A port number is always associated with an IP address of a host and the protocol type of the communication. It completes the destination or origination network address of a message. Specific port numbers are commonly reserved to identify the historically most commonly used services, and are called the well-known port numbers. Higher-numbered ports are available for general use by applications and are known as ephemeral ports.

When used as a service enumeration, ports provide a multiplexing service for multiple services or multiple communication sessions at one network address. In the client-server model of application architecture multiple simultaneous communication sessions may be initiated for the same service.

#### 常用的电脑端口

计算机中的 65,535 个端口按不同的分类标准可以分为很多类，其中最常用的分类标准有按端口号和协议类型分类两种。

##### 按端口号分类

按端口号可以将电脑中的端口分为 3 类，分别是 “公认端口” 、“注册端口” 和 “动态和/或私有端口”。

###### 公认端口

公认端口（Well Known Ports）也称为“常用端口”，其端口号的范围为 0~1023，它们紧密地绑定于一些特定的服务。通常这些端口的通信明确地表明了某种服务的协议，这种端口不可再重新定义它的作用对象。例如， 21 端口分配给了 FTP 服务，而 23 端口是 Telnet 服务专用的， SMTP 使用 25 号端口， 80 端口是 HTTP 通信所使用的， 135 端口分配给了 RPC （远程过程调用）服务，这些端口通常不会被如木马这样的黑客程序利用。

###### 注册端口

注册端口（Registered Ports）的端口号范围为 1024~49151，它们松散地绑定于一些服务。也就是说有许多服务绑定于这些端口，这些端口同样用于许多其他的目的。这些端口大多数没有明确定义的服务对象，应用程序会根据自己的实际需要进行定义。例如，腾讯 QQ 客户端用的就是 4000 端口。需要指出的是：这些端口也是木马程序的常用端口，是防护和查杀木马程序必须要检查的端口。

###### 动态和/或私有端口

动态和/或私有端口（Dynamic and/or Private Ports）的端口号范围为49152~65535。理论上不应将这些端口分配给服务，但实际上一些较为特殊的程序，特别是一些木马程序就喜欢使用这些端口，因为这些端口通常不被人们注意，容易隐藏。

##### 按协议类型分类

端口的另一种分类标准是按协议类型分类。网络上常用的通信协议有两种，分别是面向连接的 TCP（传输控制协议）和面向无连接的 UDP（用户数据报协议），对于这两种通信协议的服务所提供的端口，可以将计算机端口分为 TCP 端口和 UDP 端口。由于 TCP 和 UDP 是相互独立的，因此它们各自的端口号也相互独立，例如，TCP 使用 235 号端口，UDP 也可以使用 235 号端口，这两者是不冲突的。

###### 使用 TCP 的常见端口

(1)FTP

FTP(文件传输协议)使用 21 端口，主要用于文件传输服务，例如上传和下载文件。

(2)Telnet 协议

Telnet（远程登录）协议使用 23 端口，用户可以以自己的身份连接到远程计算机上。

(3)SMTP

SMTP（简单邮件传输）使用 25 号端口，大多数的邮件服务器都采用这个协议，用于发送邮件。例如，当你想要在网易邮箱中登录 QQ 邮箱时，就要开通 QQ 的 IMAP/SMTP 服务。这一服务可以在网页版 QQ 邮箱的设置的账户里看到。

(4)POP3

POP3 和 SMTP 相对应， 用于接收邮件，通常情况下使用的是 110 号端口。

###### 使用 UDP 的常见端口

(1)HTTP

HTTP(超文本传输协议)是用户使用最多的协议。上网浏览网页时就是使用这个协议，不过现在都逐渐变为 HTTPS 了，因为后者会对网页发送给客户机的内容进行加密，更好地保护网络安全。无论是手机还是电脑，都可以在地址栏看到网址使用的是哪种协议。在使用 http 协议的网站里尽量不要输入敏感信息，像密码之类的信息，在使用 https 协议的网站则可以。提供 HTTP 服务需要开启 80 号端口。

(2)DNS 协议

DNS 协议用于域名解析服务，由于 IP 地址是纯数字形式的，不方便记忆，于是就出现了便于记忆的域名，但计算机只能通过 IP 地址寻找要访问的主机，此时就需要将域名解析成 IP 地址，将域名解析成 IP 地址的工作就是由 DNS 服务器来完成的，该服务使用 53 号端口。

(3)SNMP

SNMP（简单网络管理协议）使用 161 号端口，主要用来管理网络设备。

(4)QQ

QQ 客户端既可以发送信息又可以接收信息，其采用的协议是 UDP。它使用 8000 号端口侦听是否有数据到来，使用 4000 号端口向外发送数据。

#### 查看电脑端口的命令

在命令提示符内输入`netstat /a /n`，就能看到以数字形式显示的活动的 TCP 连接和 UDP 连接的端口号以及状态。

如果想对某台电脑进行攻击，必须对目标电脑的情况有大概的了解，这时可以用扫描工具对目标主机进行扫描。这样就可以得到目标主机打开的端口的情况，进而推测出目标电脑提供了哪些服务，从而对目标第难熬有初步的了解。

如果在管理员不知情的情况下计算机的端口打开得太多，那么可能有两种情况：一种是提供了服务而管理员没有注意，例如，安装 IIS（Internet Information Server，因特网信息服务）时就会自动增加很多服务；二是电脑被安装了木马，通过一些特殊的端口进行通信。这都是很危险的，如果管理员不了解电脑提供的服务，就会降低系统的安全性。因此扫描本机开放端口是做好电脑安全防范的首要工作。

#### 怎样关闭端口

在默认情况下，用户系统有很多没用的或者不安全的端口是开启的，这些端口很容易被黑客利用，为了保证系统的俺去那，用户可以关闭一些不用的端口。

关闭端口的方式有很多种，可以通过关闭相应的服务来访问，也可以通过限制响应的端口号来阻止访问。

##### 1、关闭相应服务阻止访问端口

计算机中的各项服务通常都对应相应的端口，例如，WWW 服务对应 80 号端口，SMTP 对应 25 号端口等，因此关闭相应的服务也就关闭了其对应的端口。

下面就以关闭 Remote Desktop Services（远程桌面服务）为例进行介绍，具体的操作步骤如下。

步骤1、打开 services （服务），打开的方式有很多，可以 win+R 弹出运行对话框，在对话框里输入`services.msc`，就可以打开；或者在命令提示行里输入`services.msc`；或者去控制面板上找。

步骤2、在 [services] 窗口列表中，寻找 Remote Desktop Services ，找到后双击打开 “properties”（属性），在 Startup type 选择 Disabled，然后单击确定即可关闭该服务也就关闭了该服务对应的端口。

##### 2、限制端口的方法

通过限制访问指定的端口号，同样可以达到关闭端口的目的。下面以 3389 号端口为例进行介绍。

步骤1、打开 Local Security Policy（本地安全策略），打开运行窗口，输入`secpol.msc`即可打开。

步骤2、在窗口列表里找到 IP Security Policies on Local Computer，在列表右边空白处鼠标右键单击，选择 create IP security policy；点击 Next ，填写 Name：限制访问3389号端口，点击Next ；不勾选 Activate the default response rule (earlier versions of Windows only)，点击 Next ；勾选 Edit properties ，点击 Finish。

步骤3、在 “限制访问3389号端口”属性框中，取消勾选 Use Add Wizard，点击 Add，在 New Rule 属性框里，要用到 IP Filter List 和 Filter Action。

步骤4、在 IP Filter List 里取消勾选 Use Add Wizard ，点击 Add ，在 Addresses 下的 Source address 选择 Any IP Address ，Destination address 选择 My IP Address ；在 Protocol 下的 Select a protocol type 选择 TCP，Set the IP protocol port 下 选择 From any port 和 To this port ，并填写端口号 3389。点击 OK 保存。回到 New Rule 属性框的 IP Filter List ，勾选刚才新建的 New IP Filter List。点击 Filter Action。

步骤5、在 Filter Action 里取消勾选 Use Add Wizard ，点击 Add ，在弹出的对话框内，选择 Block ，点击 OK。勾选这个新建的 New Filter Action。点击 Close。

步骤6、在 “限制访问3389号端口”属性框中，你可以看到一个 New IP Filter List 已经被勾选，点击 OK。

步骤7、鼠标放在新建的策略下，要右键单击，选择 assign 。最后，重启计算机即可使设置生效。