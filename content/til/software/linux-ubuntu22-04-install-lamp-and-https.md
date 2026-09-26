---
title: 'Linux Ubuntu22 04 Install Lamp and HTTPS'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Linux
---

Refers:

1. <https://www.digitalocean.com/community/tutorials/how-to-install-linux-apache-mysql-php-lamp-stack-on-ubuntu-22-04>
2. <https://www.digitalocean.com/community/tutorials/how-to-secure-apache-with-let-s-encrypt-on-ubuntu-22-04>

## 安装 Apache 更新防火墙

```sh
sudo apt update
sudo apt install apache2
sudo ufw app list
```

输出：

```txt
Available applications:
Apache
Apache Full
Apache Secure
OpenSSH
```

```sh
sudo ufw allow in "Apache"
sudo ufw status
```

输出：

```txt
Status: active

To Action From
-- ------ ----
OpenSSH ALLOW Anywhere
Apache ALLOW Anywhere
OpenSSH (v6) ALLOW Anywhere (v6)
Apache (v6) ALLOW Anywhere (v6)
```

现在可以通过 IP 访问初始页面了。

找服务器的公网 IP 地址：

```sh
ip addr show ens3 | grep inet | awk '{ print $2; }' | sed 's/\/.*$//'
```

如果有域名绑定到这个 IP 上，也可以用域名 `http://example.com:80`。

## 安装 MySQL 和 PHP

```sh
sudo apt install mysql-server
sudo mysql_secure_installation
```

第一步点击 Y，接下来根据情况选择。我进行到这几步时，密码验证总是通不过。但也能进入 Mysql shell 里。

```sh
sudo apt install php libapache2-mod-php php-mysql
php -v

sudo mkdir /var/www/your_domain
sudo chown -R $USER:$USER /var/www/your_domain
sudo nano /etc/apache2/sites-available/your_domain.conf
```

`your_domain.conf` 文件内容：

```conf
<VirtualHost *:80>
ServerName your_domain
ServerAlias www.your_domain
# 如果只有一个域名，可用
# 注释掉
ServerAdmin webmaster@localhost
DocumentRoot /var/www/your_domain
ErrorLog ${APACHE_LOGDIR}/error.log
CustomLog ${APACHE_LOGDIR}/access.log combined
</VirtualHost>
```

```sh
sudo a2ensite your_domain

sudo a2dissite 000-default

sudo apache2ctl configtest

sudo systemctl reload apache2
vim /var/www/your_domain/index.html
# 任意添加内容
```

注意：默认情况下，index.html 比 index.php 的优先级高。如果想反过来，可进行如下修改：

```sh
sudo vim /etc/apache2/mods-enabled/dir.conf
```

修改后的结果：

```conf
<IfModule mod_dir.c>
DirectoryIndex index.php index.html index.cgi index.pl index.xhtml index.htm
</IfModule>
```

```sh
sudo systemctl reload apache2

vim /var/www/your_domain/info.php
```

`info.php`：

```php
<?php phpinfo();
```

访问 `http://server_domainorIP/info.php`，会出现一个页面描述 php 的配置信息。

```sh
sudo rm /var/www/your_domain/info.php

sudo mysql
mysql> CREATE DATABASE example_database;
mysql> CREATE USER 'example_user'@'%' IDENTIFIED BY 'password';
mysql> ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
mysql> GRANT ALL ON example_database.* TO 'example_user'@'%';
mysql> exit

mysql -u example_user -p
mysql> SHOW DATABASES;
```

输出：

```txt
| Database                                |
| --- |
| example_database information_schema |

2 rows in set (0.000 sec)
```

```sh
mysql> CREATE TABLE example_database.todo_list ( item_id INT AUTO_INCREMENT, content VARCHAR(255), PRIMARY KEY(item_id) );
mysql> INSERT INTO example_database.todo_list (content) VALUES ("My first important item");
mysql> SELECT * FROM example_database.todo_list;
```

输出：

```txt
| item_id | content                 |
| --- | --- |
| 1         | My first important item |

4 rows in set (0.000 sec)
```

```sh
mysql> exit

vim /var/www/your_domain/todo_list.php
```

`todo_list.php`：

```php
<?php
$user = "example_user";
$password = "password";
$database = "example_database";
$table = "todo_list";

try {
$db = new PDO("mysql:host=localhost;dbname=$database", $user, $password);
echo "<h2>TODO</h2><ol>";
foreach($db->query("SELECT content FROM $table") as $row) {
echo "<li>" . $row['content'] . "</li>";
}
echo "<*ol>";
} catch (PDOException $e) {
print "Error!: " . $e->getMessage() . "<br*>";
die();
}
```

访问 `http://your_domainorIP/todo_list.php`。

---

## 开启 HTTPS

```sh
sudo apt update
sudo apt install certbot python3-certbot-apache

sudo ufw status
```

输出：

```txt
Status: active

To Action From
-- ------ ----
OpenSSH ALLOW Anywhere
Apache ALLOW Anywhere
OpenSSH (v6) ALLOW Anywhere (v6)
Apache (v6) ALLOW Anywhere (v6)
```

```sh
sudo ufw allow 'Apache Full'
sudo ufw delete allow 'Apache'
sudo ufw status
```

输出：

```txt
Status: active

To Action From
-- ------ ----
OpenSSH ALLOW Anywhere
Apache Full ALLOW Anywhere
OpenSSH (v6) ALLOW Anywhere (v6)
Apache Full (v6) ALLOW Anywhere (v6)
```

```sh
sudo certbot --apache

sudo systemctl status certbot.timer
# active

sudo certbot renew --dry-run
```


相关：[[linux-ubuntu22-04-restart|linux-ubuntu22-04-restart]]