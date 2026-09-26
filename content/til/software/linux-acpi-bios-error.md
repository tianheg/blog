---
title: 'Linux ACPI BIOS Error'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Linux
---

```sh
> sudo dmesg -l err
[ 0.580655] ACPI BIOS Error (bug): Could not resolve symbol [_PR.PR00._CPC], AE_NOTFOUND (20211217/psargs-330)
[ 0.580667] ACPI Error: Aborting method _PR.PR01._CPC due to previous error (AE_NOTFOUND) (20211217/psparse-529)
[ 0.580838] ACPI BIOS Error (bug): Could not resolve symbol [_PR.PR00._CPC], AE_NOTFOUND (20211217/psargs-330)
[ 0.580851] ACPI Error: Aborting method _PR.PR02._CPC due to previous error (AE_NOTFOUND) (20211217/psparse-529)
[ 0.581182] ACPI BIOS Error (bug): Could not resolve symbol [_PR.PR00._CPC], AE_NOTFOUND (20211217/psargs-330)
[ 0.581195] ACPI Error: Aborting method _PR.PR03._CPC due to previous error (AE_NOTFOUND) (20211217/psparse-529)
[ 0.581370] ACPI BIOS Error (bug): Could not resolve symbol [_PR.PR00._CPC], AE_NOTFOUND (20211217/psargs-330)
[ 0.581382] ACPI Error: Aborting method _PR.PR04._CPC due to previous error (AE_NOTFOUND) (20211217/psparse-529)
[ 0.581451] ACPI BIOS Error (bug): Could not resolve symbol [_PR.PR00._CPC], AE_NOTFOUND (20211217/psargs-330)
[ 0.581458] ACPI Error: Aborting method _PR.PR05._CPC due to previous error (AE_NOTFOUND) (20211217/psparse-529)
[ 0.581519] ACPI BIOS Error (bug): Could not resolve symbol [_PR.PR00._CPC], AE_NOTFOUND (20211217/psargs-330)
[ 0.581525] ACPI Error: Aborting method _PR.PR06._CPC due to previous error (AE_NOTFOUND) (20211217/psparse-529)
[ 0.581583] ACPI BIOS Error (bug): Could not resolve symbol [_PR.PR00._CPC], AE_NOTFOUND (20211217/psargs-330)
[ 0.581589] ACPI Error: Aborting method _PR.PR07._CPC due to previous error (AE_NOTFOUND) (20211217/psparse-529)
```

> If you boot fine, Ignore it because it is basically a garbage error. The Ubuntu kernel developers, in their great wisdom, decided to print level4 errors at bootup. If the bios manufacturer didn't implement ACPI the way the kernel expects, and it prints the errors on the screen. There is a way to stop the kernel from printing level4 but it probably isn't worth the trouble. > > Edit: My brain said level4 but my fingers insisted on level 3, so I edited appropriately > > from <https://forums.linuxmint.com/viewtopic.php?p=2163183&sid=b70de791fc21b0f17b4560e38e989188#p2163183>


相关：[[linux-temporary-failure-resolving-url|linux-temporary-failure-resolving-url]]