# 构建依赖（emacs / org）

`build.sh` 需要两个外部依赖，都是**钉版本 + 校验 sha256**的：

| 依赖 | 版本 | 来源 | 谁提供 |
|---|---|---|---|
| emacs | 31.1 | GNU 官方**源码**（官方只发源码，没有 Linux 二进制） | 本仓库构建后发布到 R2 |
| org-mode | 9.8.10 | GNU ELPA 官方 tarball | 官方直取（`packages/org-9.8.10.tar`） |

## 为什么 emacs 要自己构建

- CF Workers Builds 的镜像（Ubuntu 24.04）里**没有 emacs**，也没有 root 能 apt 装
- 系统源里那个是 emacs 29.3 / org 9.6.15，与我们要的版本**产物不同**（实测同一份内容差 558 个文件）
- GNU 不给 Linux 发二进制，所以「官方直取」只能是从源码构建
- 早期用的 micromamba + conda-forge 已被弃用（用户要求不引入 conda 依赖）

## 当前发布物

- 桶：R2 `blog-build-deps`，公共访问走 r2.dev
- 对象：`emacs/emacs-31.1-linux-x86_64.tar.gz`（约 60 MB）
- 下载地址与 sha256 写在 `build.sh` 顶部（`EMACS_URL` / `EMACS_SHA256`，可用环境变量 `ORG2SITE_EMACS_URL` 覆盖，便于本地测试）

## 重新构建 emacs（升级版本时照做）

只在本机跑，不占 CI 时间。**必须在无 root 的前提下可用**，所以构建配置最小化。

```bash
V=31.1
mkdir -p /tmp/emacs-src && cd /tmp/emacs-src
curl -O "https://ftp.gnu.org/gnu/emacs/emacs-$V.tar.xz"   # 官方源码（同目录另有 .sig 可验签）
tar xf "emacs-$V.tar.xz" && cd "emacs-$V"

# --without-all：去掉 GUI/图形库等一切用不到的东西，构建快、体积小；
# 本管线只要 batch 文本处理。gnutls/jansson 系统里没有也不影响（json.el 是纯 Lisp 后备）。
./configure --without-all --with-x-toolkit=no --with-gnutls=no --with-json=no \
            --prefix=/tmp/emacs-src/install
make -j"$(nproc)" && make install
```

打包（关键：装到临时 prefix 后整体打包，运行时靠环境变量定位 `lisp/` 和 `etc/`，所以放哪都能跑）：

```bash
tar -C /tmp/emacs-src/install -czf "/tmp/emacs-$V-linux-x86_64.tar.gz" .
sha256sum "/tmp/emacs-$V-linux-x86_64.tar.gz"
```

自检（解到**别的目录**再跑一次，确认可搬运）：

```bash
OUT=/tmp/emacs-rel; rm -rf "$OUT"; mkdir -p "$OUT"
tar -C "$OUT" -xzf "/tmp/emacs-$V-linux-x86_64.tar.gz"
export EMACSLOADPATH="$OUT/share/emacs/$V/lisp:$OUT/share/emacs/site-lisp"
export EMACSDATA="$OUT/share/emacs/$V/etc" EMACSDOC="$EMACSDATA"
"$OUT/bin/emacs" --version                  # → GNU Emacs 31.1
```

## 上传

需要一个对 `blog-build-deps` 有**对象读写**权限的 R2 API token（CF 面板 → R2 → Manage API Tokens）。
现有的 `R2_ACCESS_KEY_ID` 只授权了备份桶 `hermes-agent`，**不能用**。

```bash
python3 - <<'PY'
import boto3, os
from botocore.config import Config
c = boto3.Session(aws_access_key_id=os.environ["R2BD_KEY"], aws_secret_access_key=os.environ["R2BD_SECRET"]).client(
    "s3", endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
    config=Config(signature_version="s3v4"), region_name="auto")
with open("/tmp/emacs-31.1-linux-x86_64.tar.gz", "rb") as f:
    c.put_object(Bucket="blog-build-deps", Key="emacs/emacs-31.1-linux-x86_64.tar.gz", Body=f)
PY
```

上传后**必须核对公开 URL 能下载且 sha256 一致**：

```bash
curl -sL "https://pub-d12ed328a9ee45b9ad7336cb78330e98.r2.dev/emacs/emacs-31.1-linux-x86_64.tar.gz" | sha256sum
```

最后把新的 `EMACS_VERSION` / `EMACS_SHA256`（必要时还有 URL）更新到 `build.sh` 顶部，并跑一次全量构建确认产物与升级前**逐文件对比**只有预期差异。

## 踩过的坑

- **`make-string` + `aset` 拼排序键**：`(make-string n ?a)` 会得到 unibyte 串，往里 `aset` 私用区码位在
  emacs 31 直接报 `Attempt to store non-ASCII char into multibyte string`（30.1 只是静默截断）。
  已把 `org2site--title-key` 改成 `concat` 实现（坑记在 `blog-org2site` skill）。
- **可搬运性**：光解包不设 `EMACSLOADPATH`/`EMACSDATA` 会找不到 lisp —— prefix 在构建时就烧进二进制了，
  环境变量是唯一可靠的重定位手段。
- **org 覆盖**：ELPA 的 org 靠 `-L "$ORG_DIR"` 插到 `load-path` 最前（实测 `-L` 是**前插**）；
  ELPA 只发源码，所以首次要在缓存里字节编译一次。
