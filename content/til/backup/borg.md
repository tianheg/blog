---
title: Borg
status: draft
date: 2025-06-15T19:22:54+08:00
---

Notes:

You have to be aware that each file is saved exactly once. Should a file be damaged by a disk failure, for example, this file will be corrupted in all following backups. Therefore, it is best practice to store very important data in more than one repository!

important data need backup many places(two remote one local)

本站日常跑的增量备份管线（StorageBox + R2 + Forgejo 三路）见 [[hermes-backup|Hermes 每日备份管线]]；方法论层面见 [[3-2-1|3-2-1 备份方法]]。

Storage service providers(1TB = 1000GB):

- [Rsync(special Borg-only backup product)](https://www.rsync.net/signup/order.html?code=experts) $96/TB/year
- [BorgBase - Simple and Secure Offsite Backups](https://www.borgbase.com/)  $80/TB/year
- [Hetzner storage box](https://www.hetzner.com/storage/storage-box) $48/TB/year

But BorgBase offer a free space(10GB) to try.

### Use Borgmatic to

File compression is optional and supports multiple algorithms (zstd is recommended) and intensities.

Archives created with Borg can be mounted as FUSE filesystems for browsing and restoring individual files.

Archives can be created locally, or on remote systems using SSHFS, NFS, Samba, or similar mounting solutions. Transfer over SSH is supported, but the remote host must have Borg available.

### Hetzner Storage Box

- https://community.hetzner.com/tutorials/install-and-configure-borgbackup
- https://borgbackup.readthedocs.io/en/stable/quickstart.html
- https://borgbackup.readthedocs.io/en/stable/usage/general.html
- https://borgbackup.readthedocs.io/en/stable/usage/extract.html
- https://docs.hetzner.com/storage/storage-box/backup-space-ssh-keys/
- https://docs.hetzner.com/storage/storage-box/access/access-ssh-rsync-borg/

### Refer

- Borg docs: https://borgbackup.readthedocs.io/en/stable/index.html
- Borgmatic official site: https://torsion.org/borgmatic/
- https://community.hetzner.com/tutorials/install-and-configure-borgbackup
- https://www.stavros.io/posts/holy-grail-backups/
- [Borg backup - ArchWiki](https://wiki.archlinux.org/title/Borg_backup)
- [Borgmatic - ArchWiki](https://wiki.archlinux.org/title/Borgmatic)
- https://gainanov.pro/eng-blog/linux/database-backup-with-borg/
- https://docs.borgbase.com/setup/borg/databases
- https://torsion.org/borgmatic/docs/how-to/backup-your-databases/
