---
title: 'Netlify Use PNPM'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Web
---

<https://github.com/netlify/build/issues/1633>

netlify.toml:

\`\`\`toml [build.environment] NODE<sub>VERSION</sub> = "16" NPM<sub>FLAGS</sub> = "--version"

[build] publish = "dist" command = "npx pnpm install --store=node<sub>modules<*sub>*.pnpm-store && npx pnpm build" ```
