---
title: LinuxJourney - Getting Started
date: 2020-06-07T08:30:41+08:00
categories: ["Tech"]
tech: ["Linux"]
slug: LinuxJourney getting started
---

## History

This is a little bit of backstory about Linux.

To learn about how Linux came to be, let's go back to the beginning to 1969 where Ken Thompson and Dennis Ritchie of Bell Laboratories developed the UNIX operating system. It was later rewritten in C to make it more portable and eventually became a widely used operating system.

A decade or so later, Richard Stallman started working on the GNU (GNU is Not UNIX) project, the GNU kernal called Hurd, which unfortunately never came to completion. The GNU General Public License (GPL), a free software license, was also created as a result of this.

The kernel is the most important piece in the operating system. It allows the hardware to talk to the software. It also does a whole lot of other things, but we'll dig into that in a different course. For now, just know that the kernel controls pretty much everything that happens on your system.

During this time other efforts such as BSD, MINIX, etc were developed to be UNIX like-systems. However, one thing that all these UNIX like-systems had in common was the lack of a unified kernel.

Then in 1991, a young fellow named Linus Torvalds started developing what we know today as the Linux kernel.

{{<notice notice-info>}}

Additional reading:

- [GNU](https://www.gnu.org/home.en.html)
- [Ken Thompson](https://en.wikipedia.org/wiki/Ken_Thompson)
- [Richard Stallman](https://stallman.org/)
- [Linus Torvalds](https://en.wikipedia.org/wiki/Linus_Torvaldss)

{{</notice>}}

## Choosing a Linux Distribution

One thing before we move forward, the term Linux is actually quite a misnomer, since it actually refers to the Linux kernel. However, many distributions use the Linux kernel so therefore are commonly known as Linux operating systems.

A Linux system is divided into three main parts:

- Hardware - This includes all the hardware that your system runs on as well as memory, CPU, disks, etc.
- Linux kernel - As we discussed above, the kernel is the core of the operating system. It manages the hardware and tells it how to interact with the system.
- User Space - This is where users like yourself will be directly interacting with the system.

So the first step we'll  need to take is to install Linux on your machine. You have many options to choose from and this course will help inform you and get you started on choosing a Linux distribution.

There are many Linux distributinos to choose from, we'll just go over the most popular options.

## Debian

### Overview

Debian is an operating system composed entirely of free and open-source software. It's widely known and has been in development for over 20 years. There are three branches that you can use, Stable, Testing and Unstable.

Stable is an overall good branch to be on. Testing and Unstable are rolling releases. This means that any incremental changes in those branches will eventually become Stable. For example, if you wanted to get the next update from Windows XP to Windows 10, you'll have to do a complete Windows 10 installation. However being on the Testing release, you'll automatically get updates until it becomes the next operating system release without having to a full installation.

### Package  Management

Debian also uses Debian package management tools. Every Linux distribution installs and manages packages differently and they use different package management tools.

### Uses

Debian is an overall great operating system for any platform.

{{<notice notice-info>}}

If you're interested in having Debian as your opeating system, head over to the installation section and give it a try: [https://www.debian.org/](https://www.debian.org/)

{{</notice>}}

## Red Hat Enterprise Linux

### Overview

Red Hat Enterprise Linux commonly referred to as RHEL is developed by Red Hat. RHEL has strict rules to restrict free re-distribution although it still provides source code for free.

### Package Management

RHEL uses a different package manager than Debian, RPM package manager, which we will eventually learn about as well.

### Configurability

RHEL-based operating systems will differ slightly from th Debian-nased operating systems, most noticeably in package management. If you decide to go with RHEL it's probably best if you know you'll be working with it.

### Uses

As described by the name it's mostly used in enterprise, so if you need a solid server OS this would be a good one.

{{<notice notice-info>}}

If you're interested in having RHEL as your opeating system, head over to the installation section and give it a try: [https://www.redhat.com/en/technologies/linux-platforms/enterprise-linux/](https://www.redhat.com/en/technologies/linux-platforms/enterprise-linux/)

{{</notice>}}

## Ubuntu

### Overview

One of the most popular Linux distributions for personal machines is Ubuntu. Ubuntu also releases its own desktop environment manager Unity by default.

### Package Management

Ubuntu is a Debian-based operating system developed by Canonical. So it uses a core Debian package management system.

### Configurability

Ubuntu is a great choice for a beginner who wants to get into Linux. Ubuntu offers ease of use and a great user interface experience that has led to its wide adoption. It's widely used and supported and is most like other operating systems like OSX and Windows in terms of usability.

### Uses

Great for any platform, desktop, laptop and server.

{{<notice notice-info>}}

If you're interested in having Ubuntu as your opeating system, head over to the installation section and give it a try: [https://ubuntu.com/](https://ubuntu.com/)

{{</notice>}}

## Fedora

### Overview

Backed by Red Hat, the Fedora Project is community driven containing open-source and free software. Red Hat Enterprise Linux branches off Fedora, so think of Fedora after thorough testing and quality assurance. Think of Fedora as an Ubuntu equivalent that uses a Red Hat backend instead of Debian.

### Package Management

Uses Red Hat package manager.

{{<notice notice-info>}}

If you're interested in having Fedora as your opeating system, head over to the installation section and give it a try: [https://getfedora.org/](https://getfedora.org/)

{{</notice>}}

## Linux Mint

### Overview

Linux Mint is based off of Ubuntu. It uses Ubuntu's software repositories so the same package are available on both distributions. If you prefer a lighter distro than Ubuntu, you may be interested in Linux Mint.

### Package Management

Since  Linux Mint is Ubuntu based, it uses the Debian package manager.

{{<notice notice-info>}}

If you're interested in having Linux Mint as your opeating system, head over to the installation section and give it a try: [https://linuxmint.com/](https://linuxmint.com/)

{{</notice>}}

## Gentoo

### Overview

Gentoo offers ridiculous flexibility with the operating system at a price. It's made for advanced users who don't mind getting their hands dirty with the system.

### Package Management

Gentoo uses its own package management, Portage. The Portage package management is very modular and easy to maintain, which plays a big part in the operating system as a whole being very flexible.

{{<notice notice-info>}}

If you're interested in having Gentoo as your opeating system, head over to the installation section and give it a try: [https://www.gentoo.org/](https://www.gentoo.org/)

{{</notice>}}

## Arch Linux

### Overview

Arch is a lightweight and flexible Linux distribution driven 100% by the community. Similar to Debian, Arch uses a rolling release model so incremental updates eventually become the Stable release. You really need to get your hands dirty to understand the system and its functions, but in turn you get complete and total control of your system.

### Package Management

It uses its own package manager, Pacman, to install, update and manage packages.

{{<notice notice-info>}}

If you're interested in having Arch as your opeating system, head over to the installation section and give it a try: [https://www.archlinux.org/](https://www.archlinux.org/)

{{</notice>}}

## openSUSE

### Overview

openSUSE Linux is created by the openSUSE Project. A community that promotes the use of Linux everywhere, working together in an open, transparent and friendly manner as part of the worldwide Free and Open Source Software community. openSUSE is the second oldest still running Linux Distributions and shares the base system with SUSE's award-winning SUSE Linux Enterprise products.

### Package Management

Uses RPM package manager.

{{<notice notice-info>}}

If you're interested in having openSUSE as your opeating system, head over to the installation section and give it a try: [https://software.opensuse.org/en](https://software.opensuse.org/en)

{{</notice>}}

## Reference:

Learning | Linux Journey: [https://linuxjourney.com/lesson/linux-history](https://linuxjourney.com/lesson/linux-history)

