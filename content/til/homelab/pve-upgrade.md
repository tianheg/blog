---
title: 'PVE: Upgrade'
status: draft
date: 2025-06-22T18:17:50+08:00
---

```bash
pveversion
apt-get update && apt-get upgrade
# make sure use a mirror repo at /etc/apt/sources.list.d/pve-enterprise.list
apt-get dist-upgrade
reboot
```
