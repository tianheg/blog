---
title: Mirror
status: draft
date: 2025-06-15T19:22:54+08:00
header: DevOps
---

### 列表
#### pip
```bash
pip install pkg -i https://pypi.tuna.tsinghua.edu.cn/simple

# 修改 ~/.pip/pip.conf
[global]
index-url = https://mirrors.aliyun.com/pypi/simple/

[install]
trusted-host=mirrors.aliyun.com
```

镜像列表

- <https://mirrors.aliyun.com/pypi/simple/>
- <https://pypi.tuna.tsinghua.edu.cn/simple>
- <http://pypi.doubanio.com/simple/>
- <http://mirrors.163.com/pypi/simple/>
- <https://repo.huaweicloud.com/repository/pypi/simple/>
- <https://mirrors.cloud.tencent.com/pypi/simple/>
- <https://mirrors.pku.edu.cn/pypi/simple/>
- <https://mirror.nyist.edu.cn/pypi/web/simple/>
- <http://mirrors.neusoft.edu.cn/pypi/web/simple/>
- <https://mirrors.hit.edu.cn/pypi/web/simple/>

#### npm,yarn,pnpm
```bash
npm config set registry https://registry.npmmirror.com

yarn v1
yarn v2-> yarn config set npmRegistryServer https://registry.npmmirror.com
```

### 一些资源
- <https://github.com/eryajf/Thanks-Mirror>
