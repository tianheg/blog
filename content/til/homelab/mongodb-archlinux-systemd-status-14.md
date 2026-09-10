---
title: 'Mongodb Archlinux Systemd Status 14'
status: draft
date: 2025-06-15T19:22:54+08:00
---

<https://stackoverflow.com/a/66107451/12539782>

解决办法

\`\`\`bash sudo chown -R [mongodb:mongodb](mongodb:mongodb) /var/lib/mongodb sudo chown [mongodb:mongodb](mongodb:mongodb) /tmp/mongodb-27017.sock sudo systemctl restart mongodb \`\`\`
