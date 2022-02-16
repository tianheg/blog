+++
title = "ssh Could not open a connection to your authentication agent."
date = 2021-12-03T00:00:00+08:00
lastmod = 2022-02-16T14:59:23+08:00
tags = ["技术", "SSH"]
draft = false
+++

如何解决，运行以下代码即可：

```sh
eval "$(ssh-agent -s)"
```

那么为什么之前不需要执行这条命令，却不会出现这种错误提示呢？

不需要执行是因为「在大多数 Linux 系统中， `ssh-agent` 可以在主机启动时自动配置运行」，刚才那个属于特殊情况，上述命令是手动运行 `ssh-agent`&nbsp;[^fn:1]。


## 问题延伸 {#问题延伸}

-   [`ssh-agent`]({{< relref "ssh-agent" >}})

[^fn:1]: <https://www.ssh.com/academy/ssh/agent>