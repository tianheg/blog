+++
date = '2021-08-02T08:54:04+08:00'
slug = 'install-wordpress-with-lamp'
tags = ['English Blog', 'WordPress']
title = 'Install WordPress With LAMP'
+++

## LAMP

Linux, Apache, MySQL, PHP

```sh
sudo apt update
sudo apt-get install apache2 -y # apache2
sudo apt install php libapache2-mod-php # php, libapache2-mod-php
sudo systemctl restart apache2 # restart apache2
sudo apt-get install mariadb-server php-mysql -y # MariaDB Server and PHP-MySQL packages
sudo systemctl restart apache2 # restart apache2 again
cd /var/www/html/ # open web folder
sudo rm * # remove old files
sudo wget http://wordpress.org/latest.tar.gz # download WordPress
sudo tar xzf latest.tar.gz # extract WordPress tarball
sudo mv wordpress/* . # move WordPress files to /var/www/html/*
sudo rm -rf wordpress latest.tar.gz # remove wordpress folder and WordPress tarball
sudo apt install tree
tree -L 1
.
├── index.php
├── license.txt
├── readme.html
├── wp-activate.php
├── wp-admin
├── wp-blog-header.php
├── wp-comments-post.php
├── wp-config-sample.php
├── wp-content
├── wp-cron.php
├── wp-includes
├── wp-links-opml.php
├── wp-load.php
├── wp-login.php
├── wp-mail.php
├── wp-settings.php
├── wp-signup.php
├── wp-trackback.php
└── xmlrpc.php

3 directories, 16 files

sudo chown -R www-data: . # change ownership of all these files to Apache user
sudo mysql_secure_installation # MariaDB
sudo mysql -uroot -p # run MySQL
MariaDB [(none)]> create database wordpress;
Query OK, 1 row affected (0.001 sec)
MariaDB [(none)]> GRANT ALL PRIVILEGES ON wordpress.* TO 'root'@'localhost' IDENTIFIED BY '<YOUR PASSWORD>';
Query OK, 0 rows affected (0.012 sec)
MariaDB [(none)]> FLUSH PRIVILEGES;
Query OK, 0 rows affected (0.001 sec)
# Exit the MariaDB prompt with Ctrl + D
sudo reboot # restart Raspberry Pi
```

Write php file to test:

```php
<?php
phpinfo();
```

Save to `test.php`, then access `http://ip/test.php`, will see the phpinfo.

After execute `sudo mysql_secure_installation`:

- You will be asked `Enter current password for root (enter for none):` — If you had set root password jusst input, or you can press **Enter** to set it.
- Type in **Y** and press **Enter** to `Set root password?`.
- Type in a password at the `New password:` prompt, and press **Enter**. **Important:** remember this root password, as you will need it later to set up WordPress.
- Type in **Y** to `Remove anonymous users`.
- Type in **Y** to `Disallow root login remotely`.
- Type in **Y** to `Remove test database and access to it`.
- Type in **Y** to `Reload privilege tables now`.

When complete, you will see the message `All done!` and `Thanks for using MariaDB!`.

## Install WordPress

Then begin the WordPress installation.

```txt
Database Name:      wordpress
User Name:          root
Password:           <YOUR PASSWORD>
Database Host:      localhost
Table Prefix:       wp_
```

After input these, if you get `Server Down` error, just run `sudo systemctl restart apache2`.

Then:

```txt
Site Title: tianheg
Username: root
Password: <Set a password>
Email: user@domain
```

I like <https://zenhabits.net/>'s theme, I [download it](https://zenhabits.net/theme/), install it.

## Install WordPress Theme

1. Access `http://address/wp-admin/`
2. Click Appearance/Themes
3. Find <kbd>Add New</kbd>/<kbd>Upload Theme</kbd>, you can just upload the zh2 zip file. That's it!
4. Custom it as you want.

ref:

1. <https://projects.raspberrypi.org/en/projects/lamp-web-server-with-wordpress>
2. <https://linuxize.com/post/how-to-install-php-on-ubuntu-20-04/>
