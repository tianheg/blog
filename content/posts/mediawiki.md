---
title: Mediawiki
date: 2022-11-14T08:57:00+08:00
tags: ['技术']
---

### Docker

`docker-compose.yml`:

```
    # MediaWiki with MariaDB
    #
    # Access via "http://localhost:8080"
    #   (or "http://$(docker-machine ip):8080" if using docker-machine)
    version: '3'
    services:
      mediawiki:
        image: mediawiki
        restart: always
        ports:
          - 8080:80
        links:
          - database
        volumes:
          - /var/www/html/images
          # After initial setup, download LocalSettings.php to the same directory as
          # this yaml and uncomment the following line and use compose to restart
          # the mediawiki service
          # - ./LocalSettings.php:/var/www/html/LocalSettings.php
      # This key also defines the name of the database host used during setup instead of the default "localhost"
      database:
        image: mariadb
        restart: always
        environment:
          # @see https://phabricator.wikimedia.org/source/mediawiki/browse/master/includes/DefaultSettings.php
          MYSQL_DATABASE: my_wiki
          MYSQL_USER: wikiuser
          MYSQL_PASSWORD: example
```

执行完初始化安装后，会生成 LocalSettings.php，把这个文件放到根目录。

```
    -
    |-- LocalSettings.php
    |-- docker-compose.yml
```

refer

1. <https://hub.docker.com/_/mediawiki>
2. <https://hub.docker.com/_/mariadb>

#### 无法使用可视化编辑

```
    Error contacting the Parsoid/RESTBase server: (curl error: 7) Couldn't connect to server

    Error contacting the Parsoid/RESTBase server: (curl error: 6) Couldn't resolve host name

    Error contacting the Parsoid/RESTBase server (HTTP 404) # (这个错误只出现一次)
```

refer

1. <https://www.mediawiki.org/wiki/MediaWiki-Docker/Extension/VisualEditor>
2. <https://www.mediawiki.org/wiki/Topic:Vv35plp6g16qno0s>
3. <https://www.mediawiki.org/wiki/Extension:VisualEditor>

没有解决，暂时放下。

尝试过在 LocalSettings.php 最末尾添加：

```
    if ( isset( $_SERVER['REMOTE_ADDR'] ) &&
         in_array( $_SERVER['REMOTE_ADDR'], [ $_SERVER['SERVER_ADDR'], '127.0.0.1' ] ) ) {
      $wgGroupPermissions['*']['read'] = true;
      $wgGroupPermissions['*']['edit'] = true;
      $wgGroupPermissions['*']['writeapi'] = true;
    }

    $wgDefaultUserOptions['visualeditor-editor'] = "visualeditor";
```

把 `127.0.0.1` 改成 `localhost` 也不行。

在[这里](https://www.mediawiki.org/wiki/Extension:VisualEditor#Troubleshooting)找到相关错误解释。

```
    Error contacting the Parsoid/RESTBase server (curl error: 7) Couldn't connect to server

        Ensure that the mediawiki native hostname does not equal to the domain the wiki is running on. If both names are equal, the api will try to connect to the domain the wiki is running on, but will have difficulty resolving the domain.
```

目前不理解。

目前不设置可视化编辑。

#### Cannot access the database: :real_connect(): (HY000/2002): No such
file or directory。

请检查下列的主机、用户名和密码设置后重试。若使用"localhost"作为数据库主机，请尝试"127.0.0.1"（反之亦然）。

把 Database host 改为 `database` 。refer
<https://stackoverflow.com/a/57312266/12539782>
