+++
title = "crontab EOF错误"
date = 2022-02-25T00:00:00+08:00
lastmod = 2022-02-25T15:14:03+08:00
tags = ["技术"]
draft = false
+++

当出现以下错误提示时：

```sh
crontab: installing new crontab
"/tmp/crontab.8jYVxO":1: premature EOF
Invalid crontab file, can't install.
```

说明，写完第一行代码后，没有按空格键换行。 `premature EOF` 意为过早地结束文件。