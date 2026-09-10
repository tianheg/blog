---
title: '延长/禁用Win自动更新'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Tools
---

```bash
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings" /v FlightSettingsMaxPauseDays /t reg_dword /d 10000 /f
```
