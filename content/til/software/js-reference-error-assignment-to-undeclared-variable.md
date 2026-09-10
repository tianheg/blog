---
title: 'JS Reference Error Assignment to Undeclared Variable'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Web
---

### --- title: "JS ReferenceError -- Assignment to undeclared variable"
错误代码：

\`\`\`js index = game.initialisingPlayers.indexOf(data.id) \`\`\`

正确代码：

\`\`\`js let index = game.initialisingPlayers.indexOf(data.id) \`\`\`

或者使用 const。
