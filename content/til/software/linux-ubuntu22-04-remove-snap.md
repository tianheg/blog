---
title: 'Linux Ubuntu22 04 Remove Snap'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Linux
---

<https://haydenjames.io/remove-snap-ubuntu-22-04-lts/>

\`\`\`sh snap list sudo systemctl disable ...

snapd.service snapd.apparmor.service snapd.autoimport.service snapd.core-fixup.service snapd.recovery-chooser-trigger.service snapd.snap-repair.timer snapd.system-shutdown.service snapd.socket snapd.seeded.service ```

\`\`\`sh sudo rm -rf /var/cache/snapd/ sudo apt autoremove --purge snapd rm -rf ~/snap \`\`\`
