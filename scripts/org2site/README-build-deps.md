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

## org-mode 的 tar（不从 ELPA 取）

ELPA 只保留当前版本：`org-9.8.10.tar` 在 2026-11-27 已 404（页面只列到 9.8.9）。CI 是干净
容器，每次构建都挂在 `装 org-mode`（`exitCode 22`）；而本地因为 `~/.cache/org2site/org-9.8.10/`
已解包、`ensure_org` 直接 return，**永远命不中这条路** —— 站点会静默停在旧版本。

所以 org 跟 emacs 一样自托管。**升级 org 时**：

1. 先拿到新版本源码（ELPA tar 还活着就直接下，否则用本地已解包的缓存目录）；
2. 在缓存根目录重打包（**去掉 `.elc`**，`ensure_org` 之后会自己字节编译）：

```bash
cd ~/.cache/org2site
tar --exclude='*.elc' -cf /tmp/org-<VER>.tar org-<VER>
sha256sum /tmp/org-<VER>.tar
```

3. 上传 —— `--s3-no-check-bucket` **必须有**：这个 token 没有 HeadBucket 权限，rclone 会先
   尝试 CreateBucket 然后 403（报错信息长得像"桶不存在"，其实桶在）：

```bash
rclone copyto --s3-no-check-bucket /tmp/org-<VER>.tar s3:blog-build-deps/org/org-<VER>.tar
curl -sL "https://pub-d12ed328a9ee45b9ad7336cb78330e98.r2.dev/org/org-<VER>.tar" | sha256sum
```

4. 更新 `build.sh` 的 `ORG_VERSION` / `ORG_SHA256`（URL 由版本号拼出来，一般不用动）；
5. **跨环境对比**：换一个空的 `ORG2SITE_CACHE` 跑全量构建（可先 `cp -al` 一份 emacs-31.1
   跳过 215MB 下载），与旧缓存的产物 `diff -rq` —— 预期只有 `index.xml` 的 `lastBuildDate`
   不同。只验「构建成功」不算验过，org 换版本会改变 EXAMPLE 块等输出。

rclone 的 S3 后端用现成的 `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_ACCOUNT_ID`
（实测对 `blog-build-deps` 有列与写权限；本文档早先写的「只授权 hermes-agent」已过期）。

### 想要某个具体版本的源码，从哪取

按可用性排序（都在 2026-11-27 实测过）：

1. **GNU ELPA 当前版**：`https://elpa.gnu.org/packages/org-<VER>.tar`。**只有当前版本**，
   下一个 patch 一发布，这个 tar 立刻 404（实测 9.8.9/10/11/12 全 404，只有 9.8.13 活着）。
   所以它只能用来「拿最新」，不能钉版本。
2. **savannah 官方 git 的 release tag**（版本本身永不消失）：
   `git clone --depth 1 -b release_9.8.10 https://git.savannah.gnu.org/git/emacs/org-mode.git`
   —— `ls-remote` 秒回，但完整浅克隆在 homelab 这条链路上要 **3 分 13 秒**（2.4MB pack），
   超时设短了会白跑。
3. **GitHub 镜像的 tag**：`https://codeload.github.com/bzg/org-mode/tar.gz/refs/tags/release_9.8.10`
   → 200，2.45MB，快；内容同上，备选。
4. ~~cgit snapshot~~：`.../cgit/emacs/org-mode.git/snapshot/...` 从 homelab **不通**（000 / 502）。

两个从 git 重打包时要注意的点：

- ELPA 的 tar 是**拍平**的（`lisp/*.el` 在顶层），仓里是 `lisp/` 子目录 —— 打成扁的，或者
  解包后加 `-L` 指向 `lisp/`，`ensure_org` 按扁的写。
- ELPA 的 tar 里多三个**生成物**：`org-loaddefs.el`、`org-pkg.el`、`org-version.el`。从 git
  重打包要么先 `make autoloads`，要么明确接受缺它们（`org.el` 仍能加载，但 `org-version` 会退回）。
  实测其余 **127 个 `.el` 与 tag `release_9.8.10` 逐字节相同** —— 所以「ELPA tar 与上游 tag 同源」是成立的。

## 踩过的坑

- **`make-string` + `aset` 拼排序键**：`(make-string n ?a)` 会得到 unibyte 串，往里 `aset` 私用区码位在
  emacs 31 直接报 `Attempt to store non-ASCII char into multibyte string`（30.1 只是静默截断）。
  已把 `org2site--title-key` 改成 `concat` 实现（坑记在 `blog-org2site` skill）。
- **可搬运性**：光解包不设 `EMACSLOADPATH`/`EMACSDATA` 会找不到 lisp —— prefix 在构建时就烧进二进制了，
  环境变量是唯一可靠的重定位手段。
- **org 覆盖**：ELPA 的 org 靠 `-L "$ORG_DIR"` 插到 `load-path` 最前（实测 `-L` 是**前插**）；
  ELPA 只发源码，所以首次要在缓存里字节编译一次。
