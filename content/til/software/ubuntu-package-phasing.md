---
title: 'Ubuntu package phasing'
status: draft
date: 2026-02-14T10:00:37+08:00
header: Linux
---

When I upgrade pkgs on my Ubuntu server, it prompts:

```bash
Some packages may have been kept back due to phasing
```

I ask LLM, it tell below things:

> It means that certain package updates are available in the repositories, but they are being deliberately withheld from your system as part of a gradual rollout called phasing.
>
> Phasing is a safety mechanism used primarily in Ubuntu (and optionally in Debian) to reduce the risk of introducing widespread regressions. Instead of making an updated package available to everyone at once, it is released in phases – a small percentage of users get it first, then if no major issues are reported, the percentage increases over time until it reaches 100%.
