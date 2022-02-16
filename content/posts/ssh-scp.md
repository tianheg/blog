+++
title = "scp - OpenSSH secure file copy"
date = 2021-12-03T00:00:00+08:00
lastmod = 2022-02-16T14:58:29+08:00
tags = ["技术"]
draft = false
+++

<https://www.techrepublic.com/article/how-to-use-secure-copy-with-ssh-key-authentication/>

```sh
# copy local file to server
scp -i ~/.ssh/id_rsa.pub FILENAME USER@SERVER:/home/USER/FILENAME
# copy file from server
scp -i ~/.ssh/id_rsa.pub USER@SERVER:/home/USER/FILENAME /home/USER/FILENAME
```