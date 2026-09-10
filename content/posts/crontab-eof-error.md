---
title: 'crontab EOF 错误'
date: 2022-02-25
tags: ['技术']
---

当出现以下错误提示时：

```bash
    crontab: installing new crontab
    "/tmp/crontab.8jYVxO":1: premature EOF
    Invalid crontab file, can't install.
```

说明，写完第一行代码后，没有按空格键换行。 `premature EOF`
意为过早地结束文件。
