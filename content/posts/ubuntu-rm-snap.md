---
title: 'Ubuntu 移除 snap'
date: 2022-11-13T15:40:00+08:00
tags: ['技术']
---

https://haydenjames.io/remove-snap-ubuntu-22-04-lts/

```bash
    snap list
    sudo systemctl disable ...

    snapd.service
    snapd.apparmor.service
    snapd.autoimport.service
    snapd.core-fixup.service
    snapd.recovery-chooser-trigger.service
    snapd.snap-repair.timer
    snapd.system-shutdown.service
    snapd.socket
    snapd.seeded.service
```

```bash
    sudo rm -rf /var/cache/snapd/
    sudo apt autoremove --purge snapd
    rm -rf ~/snap
```
