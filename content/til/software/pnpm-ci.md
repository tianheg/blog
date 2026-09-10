---
title: 'PNPM Ci'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Web
---

1. <https://pnpm.io/continuous-integration>
2. [feed/update-feed.yml at main · tianheg/feed](https://github.com/tianheg/feed/blob/14c27f488f213851ca94a155fe2e4c4df8ab6573/.github/workflows/update-feed.yml)

`.github/workflows/main.yml`:

\`\`\`yml name: Build GitHub Pages

on: push: branches:

- main

workflow<sub>dispatch</sub>: schedule:

- cron: '0 22 * * *'

jobs: build: runs-on: ubuntu-latest concurrency: group: ${{ github.workflow }}-${{ github.ref }} steps:

- uses: actions/checkout@v3

- name: Cache pnpm modules uses: actions/cache@v3 with: path: ~/.pnpm-store key: ${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }} restore-keys: | ${{ runner.os }}-

- uses: pnpm/action-setup@v2.2.1 with: version: latest run<sub>install</sub>: true

- name: Setup Node.js environment uses: actions/setup-node@v3.1.1 with: node-version: '16' cache: 'pnpm'

- name: Build the feed run: pnpm run build

- name: Copy output run: pnpm run copy

- name: Deploy to GitHub Pages uses: peaceiris/actions-gh-pages@v3 if: ${{ github.ref == 'refs/heads/main' }} with: github<sub>token</sub>: ${{ secrets.GITHUB<sub>TOKEN</sub> }} publish<sub>dir</sub>: ./dist force<sub>orphan</sub>: true

\`\`\`
