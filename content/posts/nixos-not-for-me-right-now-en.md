---
title: 'NixOS Is Not for Me Right Now'
date: 2026-09-20T16:10:00+08:00
tags: ['技术', '随笔', NixOS, English]
---

Over the past few days I tried NixOS, and yesterday I realized it's not for me.

What first drew me in was one thing about NixOS: complete control over a system, inside and out — as long as the config is there, you can reproduce an identical environment on a brand-new machine. That's genuinely great, because using Linux means having to learn a lot, and there's always something you're unfamiliar with — and when you've broken the system, how to roll back is often a real headache. NixOS's design solves exactly that problem.

It keeps every system built from your existing config, so rolling back to the previous generation takes a single line: `sudo nixos-rebuild switch --rollback`. And dotfiles — the thing that gave me headaches — can also be managed through home-manager from the NixOS ecosystem. I eagerly migrated all my dotfiles from Arch Linux into NixOS's embrace. It wasn't until I got to my Emacs config that I found this differs noticeably from my old habits: am I using Emacs, or am I using NixOS with Emacs?

Using Emacs in a NixOS environment is strange. I picked one of the approaches: home-manager for the Emacs packages, use-package for configuring those packages. Every time I modified the config, I found I had to rebuild the system; every single change, another rebuild. That's a huge mental burden for me. And one build, because of network problems, just hung there and would never finish — I only got it working after adding a mirror.

In the end I really couldn't stand it anymore, and stopped looking into how to use my Arch Linux config under NixOS.

NixOS is something new to me. I haven't grown a lasting interest in it yet. The future changes, and maybe I'll use it again someday.
