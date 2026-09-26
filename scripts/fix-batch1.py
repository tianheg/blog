"""批 1：机械性 org 残留修复。

用法： python3 fix-batch1.py          # dry-run
        python3 fix-batch1.py --apply
每条 (file, old, new) 断言 old 在文件中恰好出现 1 次。
"""
import sys, re, pathlib

ROOT = pathlib.Path('/root/projects/blog/content')
APPLY = '--apply' in sys.argv

# ---- 1a. 94 页读书记：伪转义的 <span> 反转义 -------------------------------
SPAN_OLD = '&lt;span style="color:var(--dushuji-count-color)"&gt;'
SPAN_NEW = '<span style="color:var(--dushuji-count-color)">'

# ---- 1b~1e. 逐处显式替换 ---------------------------------------------------
PAIRS = [
    # --- 1b. ](<url) 缺闭角括号 ---
    ('til/learning/tech-learn-way-intro-to-prog.md',
     '[实验部分](<http://csapp.cs.cmu.edu/public/labs.html)都移植过来了。同时，可以看看> The C Programming Language',
     '[实验部分](http://csapp.cs.cmu.edu/public/labs.html)都移植过来了。同时，可以看看 The C Programming Language'),
    ('til/life/how-to-ask-questions-the-smart-way.md',
     '（搜索[Google 论坛](<https://groups.google.com/)和网页>）',
     '（搜索[Google 论坛](https://groups.google.com/)和网页）'),
    ('til/life/how-to-ask-questions-the-smart-way.md',
     '（[关闭 HTML](<http://archive.birdhouse.org/etc/evilmail.html)并不难>）。',
     '（[关闭 HTML](http://archive.birdhouse.org/etc/evilmail.html)并不难）。'),
    ('til/life/how-to-ask-questions-the-smart-way.md',
     '（你能在[这儿](<http://www.linux.org/groups/index.html)找到使用者群组的清单>）。',
     '（你能在[这儿](http://www.linux.org/groups/index.html)找到使用者群组的清单）。'),
    ('til/life/how-to-ask-questions-the-smart-way.md',
     '试着按[软件发布实践](<http://en.tldp.org/HOWTO/Software-Release-Practice-HOWTO/index.html)操作>。',
     '试着按[软件发布实践](http://en.tldp.org/HOWTO/Software-Release-Practice-HOWTO/index.html)操作。'),
    ('til/software/bootstrap.md',
     '也可以在[这里](<https://github.com/twbs/rfs#installation)找到安装方法>。',
     '也可以在[这里](https://github.com/twbs/rfs#installation)找到安装方法。'),
    ('til/software/bootstrap.md',
     'Bootstrap 基于[RTLCSS](<https://rtlcss.com/)实现> RTL。',
     'Bootstrap 基于[RTLCSS](https://rtlcss.com/)实现 RTL。'),
    ('til/software/mdo-code-guide.md',
     '[HTML5 标准](<https://html.spec.whatwg.org/multipage/syntax.html#start-tags)说这是可选项>。',
     '[HTML5 标准](https://html.spec.whatwg.org/multipage/syntax.html#start-tags)说这是可选项。'),
    ('til/software/mdo-code-guide.md',
     '保持小写>。',
     '保持小写。'),
    ('til/software/mdo-code-guide.md',
     '中读到更多关于> `lang` 的内容。在 &lt;abbr title="Internet Assigned Numbers Authority"&gt;IANA</abbr>',
     '中读到更多关于 `lang` 的内容。在 <abbr title="Internet Assigned Numbers Authority">IANA</abbr>'),
    ('til/software/mdo-code-guide.md',
     '介绍里使用速记属性可能出现的问题>。',
     '介绍里使用速记属性可能出现的问题。'),
    ('til/software/use-slidev-make-ppt.md',
     '方便地在> VS Code 中查看（需要全局安装 `[cite/t:@slidev/cli]`）',
     '方便地在 VS Code 中查看（需要全局安装 `@slidev/cli`）'),

    # --- 1c. org 链接 [[url][text]] / 孤儿 ]] ---
    ('posts/create-cool-github-profile.md',
     'issue：[[https://github.com/ruanyf/weekly/issues/1616][[开源自荐] 利用\nGithub Actions 获取网站的 RSS 数据，并更新到个人主页]]。',
     'issue：[[开源自荐] 利用 Github Actions 获取网站的 RSS 数据，并更新到个人主页](https://github.com/ruanyf/weekly/issues/1616)。'),
    ('posts/health.md',
     '> [[https://www.goodreads.com/book/show/25744928-deep-work?ac=1&from_search=true&qid=P3dBIXI75u&rank=1][Deep\n> Work]] by [Cal Newport](https://www.calnewport.com/)',
     '> [Deep Work](https://www.goodreads.com/book/show/25744928-deep-work?ac=1&from_search=true&qid=P3dBIXI75u&rank=1) by [Cal Newport](https://www.calnewport.com/)'),
    ('posts/git.md',
     '2. [[https://www.saintsjd.com/2011/01/what-is-a-bare-git-repository/]',
     '2. <https://www.saintsjd.com/2011/01/what-is-a-bare-git-repository/>'),
    ('til/courses/open-missing-semester-of-cs.md',
     '`cd ~/.vim/pack/vendor/start; git clone [[https://github.com/ctrlpvim/ctrlp.vim]]`',
     '`cd ~/.vim/pack/vendor/start; git clone https://github.com/ctrlpvim/ctrlp.vim`'),
    ('til/software/tutorials.md',
     '[[https://x.com/dotey/status/1810084451659219275][宝玉 ([cite/t:@dotey]) on X]]',
     '[宝玉 (@dotey) on X](https://x.com/dotey/status/1810084451659219275)'),
    ('posts/docker.md',
     '2. [[https://github.com/docker/docker-ce-packaging/pull/553#issuecomment-906294789][[master] add docker-compose-plugin package (deb, rpm) by thaJeztah · Pull Request #553 · docker/docker-ce-packaging]]',
     '2. [[master] add docker-compose-plugin package (deb, rpm) by thaJeztah · Pull Request #553 · docker/docker-ce-packaging](https://github.com/docker/docker-ce-packaging/pull/553#issuecomment-906294789)'),

    # --- 1d. [cite/t:@x] ---
    ('posts/2021.md',
     '[cite/t:@dirtysalt]，他的博客[^3]',
     'dirtysalt，他的博客[^3]'),
    ('posts/coding.md',
     '[Beringei: High-performance Time Series Storage Engine [cite/t:@Facebook](https://engineering.fb.com/2017/02/03/core-data/beringei-a-high-performance-time-series-storage-engine/)]',
     '[Beringei: High-performance Time Series Storage Engine](https://engineering.fb.com/2017/02/03/core-data/beringei-a-high-performance-time-series-storage-engine/)'),
    ('posts/coding.md',
     "[Introducing Atlas: Netflix's Primary Telemetry Platform [cite/t:@Netflix](https://netflixtechblog.com/introducing-atlas-netflixs-primary-telemetry-platform-bd31f4d8ed9a)]",
     "[Introducing Atlas: Netflix's Primary Telemetry Platform](https://netflixtechblog.com/introducing-atlas-netflixs-primary-telemetry-platform-bd31f4d8ed9a)"),
    ('posts/coding.md',
     '[Scaling Time Series Data Storage - Part I [cite/t:@Netflix](https://netflixtechblog.com/scaling-time-series-data-storage-part-i-ec2b6d44ba39)]',
     '[Scaling Time Series Data Storage - Part I](https://netflixtechblog.com/scaling-time-series-data-storage-part-i-ec2b6d44ba39)'),
    ('til/software/coding.md',
     '[Beringei: High-performance Time Series Storage Engine [cite/t:[cite/t:@Facebook](https://engineering.fb.com/2017/02/03/core-data/beringei-a-high-performance-time-series-storage-engine/)]]',
     '[Beringei: High-performance Time Series Storage Engine](https://engineering.fb.com/2017/02/03/core-data/beringei-a-high-performance-time-series-storage-engine/)'),
    ('til/software/coding.md',
     "[Introducing Atlas: Netflix's Primary Telemetry Platform [cite/t:[cite/t:@Netflix](https://netflixtechblog.com/introducing-atlas-netflixs-primary-telemetry-platform-bd31f4d8ed9a)]]",
     "[Introducing Atlas: Netflix's Primary Telemetry Platform](https://netflixtechblog.com/introducing-atlas-netflixs-primary-telemetry-platform-bd31f4d8ed9a)"),
    ('til/software/coding.md',
     '[Scaling Time Series Data Storage - Part I [cite/t:[cite/t:@Netflix](https://netflixtechblog.com/scaling-time-series-data-storage-part-i-ec2b6d44ba39)]]',
     '[Scaling Time Series Data Storage - Part I](https://netflixtechblog.com/scaling-time-series-data-storage-part-i-ec2b6d44ba39)'),
    ('til/software/cannot-use-ejs.md',
     "title: 'Want to use ejs with [cite/t:@fastify/view] on Vercel",
     "title: 'Want to use ejs with fastify/view on Vercel"),
    ('til/software/create-publish-scoped-public-packages.md',
     '有用户名（[cite/t:@tianheg/package]）',
     '有用户名（@tianheg/package）'),
    ('til/software/create-publish-scoped-public-packages.md',
     'npm login npm init --scope=[cite/t:@tianheg] touch README.md',
     'npm login npm init --scope=@tianheg touch README.md'),
    ('til/software/js-the-right-way.md',
     'but [cite/t:@cowboy](cite/t:@cowboy)(<http://twitter.com/cowboy>) (Ben Alman)',
     'but @cowboy (<http://twitter.com/cowboy>) (Ben Alman)'),
    ('til/software/make-twitter-search-faster.md',
     '1、[cite/t:@dotey老师内容]',
     '1、@dotey 老师内容'),
    ('til/software/mdo-code-guide.md',
     '.elem { margin: 10px 0 ([cite/t:@variable] * 2) 10px; }',
     '.elem { margin: 10px 0 (@variable * 2) 10px; }'),
    ('til/software/playwright-test.md',
     "require('[cite/t:@playwright/test]')",
     "require('@playwright/test')"),
    ('til/software/playwright-test.md',
     "@type {import('[cite/t:@playwright/test]').PlaywrightTestConfig}",
     "@type {import('@playwright/test').PlaywrightTestConfig}"),
    ('til/software/risc-v.md',
     '[8] [https://medium.com/[cite/t:@aditya-sunjava/exploring-the-differences-arm-vs-risc-v-architecture-0f50cb838190](https://medium.com/@aditya-sunjava/exploring-the-differences-arm-vs-risc-v-architecture-0f50cb838190)]',
     '[8] <https://medium.com/@aditya-sunjava/exploring-the-differences-arm-vs-risc-v-architecture-0f50cb838190>'),

    # --- 1e. 行内代码 / 正文里的半转义 HTML（页面显示 &lt;） ---
    ('posts/javascript.md',
     '`&lt;textarea&gt;{{ txt }}</textarea>`',
     '`<textarea>{{ txt }}</textarea>`'),
    ('til/software/vue.md',
     '`&lt;textarea&gt;{{ txt }}</textarea>`',
     '`<textarea>{{ txt }}</textarea>`'),
    ('posts/js-ecma-262-3-in-detail.md',
     '（在 `&lt;script&gt;</script>` 标签内）',
     '（在 `<script></script>` 标签内）'),
    ('posts/markdown-usage-syntax.md',
     '中变成 `&lt;em&gt;</em>`',
     '中变成 `<em></em>`'),
    ('posts/markdown-usage-syntax.md',
     '`&lt;strong&gt;</strong>`',
     '`<strong></strong>`'),
    ('til/software/mdo-code-guide.md',
     '（&lt;mark&gt;为什么？</mark>）',
     '（<mark>为什么？</mark>）'),
]


def main():
    changes = 0
    problems = []
    files = {}
    # 1a
    for f in sorted(ROOT.rglob('*.md')):
        t = f.read_text(errors='replace')
        n = t.count(SPAN_OLD)
        if n:
            files.setdefault(f, []).append((SPAN_OLD, SPAN_NEW, n))
            changes += n
    # 1b~1e
    for rel, old, new in PAIRS:
        f = ROOT / rel
        if not f.exists():
            problems.append(f'文件不存在 {rel}')
            continue
        t = f.read_text(errors='replace')
        n = t.count(old)
        if n != 1:
            problems.append(f'{rel}: 匹配 {n} 次 -> {old[:70]}')
            continue
        files.setdefault(f, []).append((old, new, 1))
        changes += 1

    print(f'计划修改 {len(files)} 个文件 / {changes} 处')
    for p in problems:
        print('  !! ', p)
    if problems:
        print('有未匹配项，中止')
        return 1
    if not APPLY:
        print('(dry-run，未写入；加 --apply 生效)')
        return 0
    for f, subs in files.items():
        t = f.read_text(errors='replace')
        for old, new, n in subs:
            t = t.replace(old, new)
        f.write_text(t)
    print('已写入')
    return 0


sys.exit(main())
