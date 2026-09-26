---
title: 'MariaDB Change User Root Pass'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Tools
---

更改普通用户密码：

```sh
$ mysql -u root -p
MariaDB [(none)]> ALTER USER 'user'@'localhost' IDENTIFIED BY 'new_password';
MariaDB [(none)]> FLUSH PRIVILEGES;
```

更改 root 密码：

```sh
$ sudo systemctl stop mariadb
$ sudo mysqld_safe --skip-grant-tables --skip-networking &
$ mariadb -u root
MariaDB [(none)]> FLUSH PRIVILEGES;
MariaDB [(none)]> ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_passwordhere';
MariaDB [(none)]> exit
$ sudo pkill mysqld
$ sudo systemctl start mariadb
$ mariadb -u root -p
```
