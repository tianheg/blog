---
title: 'Use SSH key to sign Git commits'
status: draft
date: 2026-02-17T23:06:34+08:00
header: Git
---

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
vim ~/.ssh/allowed_signers
git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers
```

=~/.ssh/allowed_signers='s content:

```text
your_email@example.com ssh-ed25519 AAAAC3...(public key content)
```
