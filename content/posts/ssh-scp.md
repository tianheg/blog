---
title: 'scp - OpenSSH secure file copy'
date: 2021-12-03
tags: ['技术', SSH]
---

<https://www.techrepublic.com/article/how-to-use-secure-copy-with-ssh-key-authentication/>

```bash
    # copy local file to server
    scp -i ~/.ssh/id_rsa.pub FILENAME USER@SERVER:/home/USER/FILENAME
    # copy file from server
    scp -i ~/.ssh/id_rsa.pub USER@SERVER:/home/USER/FILENAME /home/USER/FILENAME
```
