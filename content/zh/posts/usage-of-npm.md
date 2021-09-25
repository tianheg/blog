+++
date = '2020-04-04T11:14:30+08:00'
description = '记录 npm 的使用'
keywords = ['Node.js']
tags = ['Node.js']
title = '使用 npm'
+++

## 一、

更新单个本地包版本：使用 `npm update <package>`

更新全部本地安装的包：

1. 在 `package.json` 文件所在的目录中执行 `npm update` 命令。
2. 执行 `npm outdated` 命令，没有输出。

## 二、

执行以下操作，需要 npm 版本大于等于 2.6.1，具体细节请访问：<https://www.npmjs.cn/getting-started/updating-global-packages/>

更新全局安装的包：`npm update -g <package>`

找到需要更新的全局安装包：`npm outdated -g --depth=0`

更新全部全局安装包：`npm update -g`

待整理网址：[npm 升级所有可更新包](https://segmentfault.com/a/1190000005857342)

## 三、问题

```powershell
npm WARN deprecated bcrypt-nodejs@0.0.3: bcrypt-nodejs is no longer actively maintained. Please use bcrypt or bcryptjs. See https://github.com/kelektiv/node.bcrypt.js/wiki/bcrypt-vs-brypt.js to learn more about these two options
npm WARN deprecated minimatch@2.0.10: Please update to minimatch 3.0.2 or higher to avoid a RegExp DoS issue
npm WARN deprecated connect@2.7.11: connect 2.x series is deprecated
npm WARN deprecated hawk@3.1.3: This module moved to @hapi/hawk. Please make sure to switch over as this distribution is no longer supported and may contain bugs and critical security issues.
npm WARN deprecated sntp@1.0.9: This module moved to @hapi/sntp. Please make sure to switch over as this distribution is no longer supported and may contain bugs and critical security issues.
npm WARN deprecated boom@2.10.1: This version has been deprecated in accordance with the hapi support policy (hapi.im/support). Please upgrade to the latest version to get the best features, bug fixes, and security patches. If you are unable to upgrade at this time, paid support is available for older versions (hapi.im/commercial).
npm WARN deprecated cryptiles@2.0.5: This version has been deprecated in accordance with the hapi support policy (hapi.im/support). Please upgrade to the latest version to get the best features, bug fixes, and security patches. If you are unable 
to upgrade at this time, paid support is available for older versions (hapi.im/commercial).
npm WARN deprecated hoek@2.16.3: This version has been deprecated in accordance with the hapi support policy (hapi.im/support). Please upgrade to the latest version to get the best features, bug fixes, and security patches. If you are unable to upgrade at this time, paid support is available for older versions (hapi.im/commercial).
npm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@1.2.12 (node_modules\hexo-admin\node_modules\fsevents):
npm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents@1.2.12: wanted {"os":"darwin","arch":"any"} (current: {"os":"win32","arch":"x64"})
npm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@2.1.2 (node_modules\fsevents):
npm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents@2.1.2: wanted {"os":"darwin","arch":"any"}(current: {"os":"win32","arch":"x64"})
```

问题探索简记：

10-13 行代码：`fsevents`暂时无法卸载，它被`chokidar@2.1.8`、`chokidar@3.3.1`需要着。换句话说，后两者依赖于`fsevents`。但是，让我不明白的是，如果不能卸载，那为什么会在`fsevents`前显示`UNMET OPTIONAL DEPENDENCY(未满足的可选依赖)`。难道可选不代表：可以删除吗？

其余错误，待到真正需要解决时再解决。

## 四、查看特定包版本

举例：

比如我们需要 jquery，我们要查看 jquery 包在服务器上的版本：

1. 使用`npm view jquery versions`，这种方式可以查看 npm 服务器上所有的 jquery 版本信息：

   ```bash
   E:\可以在任意路径执行>npm view jquery versions
   
   [
     '1.5.1',       '1.6.2',       '1.6.3',
     '1.7.2',       '1.7.3',       '1.8.2',
     '1.8.3',       '1.9.1',       '1.11.0-beta3',
     '1.11.0-rc1',  '1.11.0',      '1.11.1-beta1',
     '1.11.1-rc1',  '1.11.1-rc2',  '1.11.1',
     '1.11.2',      '1.11.3',      '1.12.0',
     '1.12.1',      '1.12.2',      '1.12.3',
     '1.12.4',      '2.1.0-beta2', '2.1.0-beta3',
     '2.1.0-rc1',   '2.1.0',       '2.1.1-beta1',
     '2.1.1-rc1',   '2.1.1-rc2',   '2.1.1',
     '2.1.2',       '2.1.3',       '2.1.4',
     '2.2.0',       '2.2.1',       '2.2.2',
     '2.2.3',       '2.2.4',       '3.0.0-alpha1',
     '3.0.0-beta1', '3.0.0-rc1',   '3.0.0',
     '3.1.0',       '3.1.1',       '3.2.0',
     '3.2.1',       '3.3.0',       '3.3.1',
     '3.4.0',       '3.4.1'
   ]
   ```

2. 使用 `npm view jquery version`，这种方式只能查看 jquery 的最新版本：

   ```bash
   E:\可以在任意路径执行>npm view jquery version
   3.4.1
   ```

3. 使用 `npm info jquery`，这种方式和第一种一样能查看所有版本信息，它还能显示更多关于 jquery 的信息：

   ```bash
   E:\可以在任意路径执行>npm info jquery
   
   jquery@3.4.1 | MIT | deps: none | versions: 50
   JavaScript library for DOM operations
   https://jquery.com
   
   dist
   .tarball: https://registry.npm.taobao.org/jquery/download/jquery-3.4.1.tgz
   .shasum: 714f1f8d9dde4bdfa55764ba37ef214630d80ef2
   
   maintainers:
   - dmethvin <dave.methvin@gmail.com>
   - mgol <m.goleb@gmail.com>
   - scott.gonzalez <scott.gonzalez@gmail.com>
   - timmywil <timmywillisn@gmail.com>
   
   dist-tags:
   beta: 3.4.1    latest: 3.4.1
   
   published 11 months ago by timmywil <4timmywil@gmail.com>
   ```

   这东西太有用了！

如果我们需要查看本地下载的 jquery 版本信息，怎么做呢？

1. 使用 `npm ls jquery`，查看本地安装的 jquery，因为我没有安装 jquery，所以返回的结果为 `empty`：

   ```bash
   E:\当前目录>npm ls jquery
   hexo-site@0.0.0 E:\当前目录
   `-- (empty)
   ```

   代码所示第二行中 `hexo-site@0.0.0` 可以忽略，因为我当前目录下部署有 hexo，所以会显示。因此，当我执行 `npm ls hexo` 时，会出现如下信息：

   ```bash
   E:\当前目录>npm ls hexo
   hexo-site@0.0.0 E:\当前目录
   `-- hexo@4.2.0
   ```

2. 使用 `npm ls jquery -g`，查看全局安装的 jquery，因为我没有安装 jquery，所以它会显示：

   ```bash
   E:\当前目录>npm ls jquery -g
   C:\Users\yourname\AppData\Roaming\npm
   `-- (empty)
   ```

   但我安装了 hexo，它显示：

   ```bash
   E:\当前目录>npm ls hexo -g
   C:\Users\yourname\AppData\Roaming\npm
   `-- (empty)
   ```

   我不知道这是个什么情况，我想到自己安装 hexo 时，是通过安装 hexo-cli 获得的，于是我进行了如下操作：

   ```bash
   E:\当前目录>npm ls hexo-cli -g
   C:\Users\yourname\AppData\Roaming\npm
   `-- hexo-cli@3.1.0
   ```

   很显然，`hexo-cli` 是存在的。当我打开这个目录时，发现只有 `hexo-cli`，而没有 `hexo`，而这应该就是执行 `npm ls hexo -g`，结果为 empty 的原因。

   我再次执行 `npm ls serverless -g`，而它出现在了该目录下，所以不为 empty。关于 `serverless` 框架，我只是听说过，看过一点腾讯云录制的教学视频。看不懂，以后再研究，`serverless` 是可以建博客的。好奇它的部署操作。

   ```bash
   E:\当前目录>npm ls serverless -g
   C:\Users\yourname\AppData\Roaming\npm
   `-- serverless@1.67.0
   ```

   **总结第四部分**：

   主要介绍了服务器端和本地的 npm 包版本信息的查看，有不同情况结果的操作展示，可以详细地了解 npm 包版本的相关信息。

## 五、npm 安装指定版本的包（以 vue 为例）

1. `npm info vue` 查看 vue 信息：

   ```powershell
   PS C:\Users\yourname> npm info vue
   
   vue@2.6.11 | MIT | deps: none | versions: 263
   Reactive, component-oriented view layer for modern web interfaces.
   https://github.com/vuejs/vue#readme
   
   dist
   .tarball: https://registry.npm.taobao.org/vue/download/vue-2.6.11.tgz
   .shasum: 76594d877d4b12234406e84e35275c6d514125c5
   
   maintainers:
   - yyx990803 <yyx990803@gmail.com>
   
   dist-tags:
   csp: 1.0.28-csp       latest: 2.6.11        next: 3.0.0-alpha.11
   
   published 3 months ago by yyx990803 <yyx990803@gmail.com>
   ```

   这一步，实际上，包括以下几步都不是必须，根据个人需要选择。

2. `npm view vue versions` 查看 vue 的所有版本：

   ```powershell
   PS C:\Users\yourname> npm view vue versions
   
   [
     '0.0.0',          '0.6.0',                '0.7.0',
     '0.7.1',          '0.7.3',                '0.7.4',
     '0.7.5',          '0.7.6',                '0.8.0',
     '0.8.1',          '0.8.2',                '0.8.3',
     '0.8.4',          '0.8.6',                '0.8.7',
     '0.8.8',          '0.9.0',                '0.9.1',
     '0.9.2',          '0.9.3',                '0.10.0',
     '0.10.1',         '0.10.2',               '0.10.3',
     '0.10.4',         '0.10.5',               '0.10.6',
     '0.11.0-rc',      '0.11.0-rc2',           '0.11.0-rc3',
     '0.11.0',         '0.11.1',               '0.11.2',
     '0.11.3',         '0.11.4',               '0.11.5',
     '0.11.6',         '0.11.7',               '0.11.8',
     '0.11.9',         '0.11.10',              '0.12.0-beta1',
     '0.12.0-beta2',   '0.12.0-beta3',         '0.12.0-beta4',
     '0.12.0-beta5',   '0.12.0-csp',           '0.12.0-rc',
     '0.12.0-rc2',     '0.12.0',               '0.12.1-csp',
     '0.12.1-csp.1',   '0.12.1-csp.2',         '0.12.1',
     '0.12.2',         '0.12.3',               '0.12.4',
     '0.12.5-csp',     '0.12.5',               '0.12.6-csp',
     '0.12.6',         '0.12.7-csp',           '0.12.7',
     '0.12.8-csp',     '0.12.8',               '0.12.9-csp',
     '0.12.9',         '0.12.10-csp',          '0.12.10',
     '0.12.11-csp',    '0.12.11',              '0.12.12-csp',
     '0.12.12',        '0.12.13-csp',          '0.12.13',
     '0.12.14-csp',    '0.12.14',              '0.12.15-csp',
     '0.12.15',        '0.12.16-csp',          '0.12.16',
     '1.0.0-alpha.1',  '1.0.0-alpha.2',        '1.0.0-alpha.3',
     '1.0.0-alpha.4',  '1.0.0-alpha.5',        '1.0.0-alpha.6',
     '1.0.0-alpha.7',  '1.0.0-alpha.8',        '1.0.0-beta.1',
     '1.0.0-beta.2',   '1.0.0-beta.3',         '1.0.0-beta.4',
     '1.0.0-csp',      '1.0.0-migration',      '1.0.0-rc.1',
     '1.0.0-rc.2',     '1.0.0-rc.2-migration', '1.0.0',
     '1.0.1',          '1.0.2',                '1.0.3',
     '1.0.4',          '1.0.5',                '1.0.6',
     '1.0.7',          '1.0.8',                '1.0.9',
     '1.0.10-csp',     '1.0.10',               '1.0.11-csp',
     '1.0.11',         '1.0.12-csp',           '1.0.12-csp-1',
     '1.0.12',         '1.0.13-csp',           '1.0.13',
     '1.0.14-csp',     '1.0.14',               '1.0.15-csp',
     '1.0.15',         '1.0.16-csp',           '1.0.16',
     '1.0.17-csp',     '1.0.17',               '1.0.18-csp',
     '1.0.18',         '1.0.19-csp',           '1.0.19',
     '1.0.20-csp',     '1.0.20',               '1.0.21-csp',
     '1.0.21',         '1.0.22-csp',           '1.0.22',
     '1.0.23-csp',     '1.0.23',               '1.0.24-csp',
     '1.0.24',         '1.0.25-csp',           '1.0.25',
     '1.0.26-csp',     '1.0.26',               '1.0.27-csp',
     '1.0.27',         '1.0.28-csp',           '1.0.28',
     '2.0.0-alpha.1',  '2.0.0-alpha.2',        '2.0.0-alpha.3',
     '2.0.0-alpha.4',  '2.0.0-alpha.5',        '2.0.0-alpha.6',
     '2.0.0-alpha.7',  '2.0.0-alpha.8',        '2.0.0-beta.1',
     '2.0.0-beta.2',   '2.0.0-beta.3',         '2.0.0-beta.4',
     '2.0.0-beta.5',   '2.0.0-beta.6',         '2.0.0-beta.7',
     '2.0.0-beta.8',   '2.0.0-rc.1',           '2.0.0-rc.2',
     '2.0.0-rc.3',     '2.0.0-rc.4',           '2.0.0-rc.5',
     '2.0.0-rc.6',     '2.0.0-rc.7',           '2.0.0-rc.8',
     '2.0.0',          '2.0.1',                '2.0.2',
     '2.0.3',          '2.0.4',                '2.0.5',
     '2.0.6',          '2.0.7',                '2.0.8',
     '2.1.0',          '2.1.1',                '2.1.2',
     '2.1.3',          '2.1.4',                '2.1.5',
     '2.1.6',          '2.1.7',                '2.1.8',
     '2.1.9',          '2.1.10',               '2.2.0-beta.1',
     '2.2.0-beta.2',   '2.2.0',                '2.2.1',
     '2.2.2',          '2.2.3',                '2.2.4',
     '2.2.5',          '2.2.6',                '2.3.0-beta.1',
     '2.3.0',          '2.3.1',                '2.3.2',
     '2.3.3',          '2.3.4',                '2.4.0',
     '2.4.1',          '2.4.2',                '2.4.3',
     '2.4.4',          '2.5.0',                '2.5.1',
     '2.5.2',          '2.5.3',                '2.5.4',
     '2.5.5',          '2.5.6',                '2.5.7',
     '2.5.8',          '2.5.9',                '2.5.10',
     '2.5.11',         '2.5.12',               '2.5.13',
     '2.5.14',         '2.5.15',               '2.5.16',
     '2.5.17-beta.0',  '2.5.17',               '2.5.18-beta.0',
     '2.5.18',         '2.5.19',               '2.5.20',
     '2.5.21',         '2.5.22',               '2.6.0-beta.1',
     '2.6.0-beta.2',   '2.6.0-beta.3',         '2.6.0',
     '2.6.1',          '2.6.2',                '2.6.3',
     '2.6.4',          '2.6.5',                '2.6.6',
     '2.6.7',          '2.6.8',                '2.6.9',
     '2.6.10',         '2.6.11',               '3.0.0-alpha.0',
     '3.0.0-alpha.1',  '3.0.0-alpha.2',        '3.0.0-alpha.3',
     '3.0.0-alpha.4',  '3.0.0-alpha.5',        '3.0.0-alpha.6',
     '3.0.0-alpha.7',  '3.0.0-alpha.8',        '3.0.0-alpha.9',
     '3.0.0-alpha.10', '3.0.0-alpha.11'
   ]
   ```

   根据需要选择版本，我们可以从这些版本中看出 vue 的开发过程。

3. `npm install vue` 下载最新 vue 发布版本：

   ```powershell
   PS C:\Users\yourname> npm install vue
   npm WARN saveError ENOENT: no such file or directory, open 'C:\Users\yourname\package.json'
   npm WARN enoent ENOENT: no such file or directory, open 'C:\Users\yourname\package.json'
   npm WARN yourname No description
   npm WARN yourname No repository field.
   npm WARN yourname No README data
   npm WARN yourname No license field.
   npm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@2.1.2 (node_modules\fsevents):
   npm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents@2.1.2: wanted {"os":"darwin","arch":"any"} (current: {"os"
   :"win32","arch":"x64"})
   
   + vue@2.6.11
   added 1 package from 1 contributor in 3.385s
   
   5 packages are looking for funding
     run `npm fund` for details
   ```

   那些警告听说是可以忽略的，但是仔细阅读还是能获得不少信息，以后出现问题时，能根据这个信息调试。

4. `npm install -g vue`，全局安装 vue：

   ```bash
   E:\当前目录>npm install -g vue
   + vue@2.6.11
   added 1 package from 1 contributor in 0.518s
   ```

5. `npm install vue@2.6.10` 下载 2.6.10 版本的 vue，其他版本根据 `npm view vue versions` 的结果和自己的需求选择。

6. `npm ls vue` 查看本地 vue 版本：

   ```powershell
   PS C:\Users\yourname> npm ls vue
   C:\Users\Gao Tian He
   `-- vue@2.6.11
   ```

7. `npm ls vue -g` 查看全局安装 vue 包版本：

   ```powershell
   PS C:\Users\yourname> npm ls vue -g
   C:\Users\yourname\AppData\Roaming\npm
   `-- (empty)
   ```

   为什么会这样？因为我并没有全局安装，也就是使用 `npm install -g vue` 安装。

   这样 vue 只会存在于`C:\Users\yourname\node_modules`路径下，而通过全局安装包的路径下并无 vue。当我通过上述命令全局安装后，再次执行`npm ls vue -g`，就会出现：

   ```powershell
   PS C:\Users\yourname> npm ls vue -g
   C:\Users\yourname\AppData\Roaming\npm
   `-- vue@2.6.11
   ```

8. `npm uninstall vue` 卸载 vue 包

9. `npm uninstall -g vue` 全局卸载 vue 包

   >通过这一系列下载 vue 框架的操作，我明白了全局安装 `npm install -g <package>` 和安装 `npm install <packeage>` 的区别。
