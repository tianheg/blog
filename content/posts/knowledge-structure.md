---
title: "构建知识体系"
date: 2021-01-10T10:59:20+08:00
description: "构建自己的知识体系"
tags: ["知识体系"]
keywords: ["体系", "知识", "构建", "Wiki", "Note", "Blog"]
---

我需要一个「[知识体系](/tags/知识体系)」，帮助我获取外界的信息，整合归纳信息，构建一个可复用的知识结构。

## 现有的努力

### 2021-02-27

![blog + TIL](/images/blog.png)

### 2021-01-27

- **Blog + Obsidian**
- 使用博客构建体系，使用 Obsidian 建立文档联系
- flomo 记录「[问题](/tags/问题)」，然后每天选择一个时间，把这些问题放到博客的每周问题总结里

### 2021-01-27 之前的方案

Wiki，Note，Blog 三个体系划分知识，分类太多，不好专注。这三种形式，知识之间的链接程度不同，在这三者来回跳跃容易乱掉。

**Wiki**

Vuepress 构建，主要用于构建技术领域的结构框架，一开始的领域涉及算法和数据结构、计算机系统原理、数据库原理、前后端开发指南、分布式技术、编程语言、网络基础、操作系统、安全、其他（其中含有：开源许可证、生活、数学、学习、科技、网站、工具、数据分析）。

现在 Wiki 已经不再存在，因为它太过复杂，不符合当初对它的期待——条理清晰、易于查找、访问方便。

条理清晰。知道自己需要的知识在哪些地方是非常重要的。在日后查找时，一目了然。

易于查找。这点和第一个有些重复，不过侧重点不同。这里的“易”指的是，文档的顺序编排上是值得考量的。不同主题的放在不同文件夹，相同主题的也要遵循一定的规律存储。而且，一个好的目录能够成就一个好的 Wiki 知识库。目录的重要性不言而喻，它是以上两点的主要表现对象。有了它，条理清晰没问题，易于查找也是肯定的。

访问方便。这一点目前对我来说不成问题，以后也不会成为难题。因为 GitHub 在国内的访问速度不是很理想，如果不能科学上网，使用 GitHub 如食鸡肋。

**Note**

同样 Vuepress 构建，用于记录书影音笔记，从别处收集的文章。还有一个页面用于收集获取书影音的方法。

现在 Note 已经去除 read，watch，listen 文件夹分类。改为大类分类：艺术（arts）、设计（design）、纪录片（documentary）、文学（literature）、电影（movies）、音乐（music）、要学习的人（person）、诗歌（poems）、自我成长（self）、剧集（series）、社会科学（social-science）、舞台剧（stage-show）、技术（tech）。

经过此次分类，对于内容体系的划分有了更深一步的理解。

**Blog**

Hugo 构建，主要记录生活随笔，想写些深度技术内容。

现在，博客是我的知识体系的最终归宿。以标签为索引，目标是化繁为简。我明白知识体系构建的过程一定是从简单到复杂，我要让复杂变得简单，但又不仅仅是简单，复杂也包含在其中。

可以类比老子的《道德经》，一生二、二生三、三生万物。

## 一些点子

- 需要一个方便的容器（写作），比如：Hexo，Hugo，Vuepress，Gatsby，MkDocs，Docsify 等等，静态网站生成器（Static Site Generator, SSG）
- 知识之间的紧密联系
- 查找方便
- 公开可访问
- 信息需要被整理
- 对于信息的分类（质与量）
  - 质：优质信息，如学术论文、新闻特稿、经典名著、牛人分享等
  - 量：大量信息，如家长里短、鸡毛蒜皮、社群聊天、日常新闻、常识经验等
  - 种类划分：技术、商业、学术、政治、日常等等 or 平台、形式、社群、新闻
  - 从对信息的使用周期进行划分：短期使用信息、中期使用信息、长期使用信息
- 信息获取到使用的链路：获取 优质/商业/可利用 信息 --> 发现信息中蕴含的价值和机会 --> 执行试错并优化
- 文字类反馈，写作笔记的一个方法，用自己的话表达别人的你认为的好的内容。写 summary
- 书籍是最好的获取信息的方式，这是我目前认为的适合我的信息获取方式。
- 追求极简，纯文本保存，可多平台迁移（如果某种格式只能使用在某个平台，绝对不使用此格式保存我的知识体系内容）

## 别人做笔记的思路

1

My thinking/process is basically:

1. In order to maintain as much open format and interoperability in the future, stick to content and file format standards.
2. For the few internal/external links in each document, it’s not that much of an inconvenience (especially with quick keys) to use standard `[text](link)` syntax. This ensures I can serve any .MD file I have with any SSG and/or use any standard Markdown converter now and in the future. And when I’ve finished the document, I do have to manually at Tags to the Frontmatter “tags” array. Adds 2-3 seconds per tag, but guarantees I’ll have taxonomy connections between files when published through an SSG.
3. Placing Frontmatter at the top of each file also guarantees future interoperability, conversion, and hosting via SSG. Using TextExpander makes this super easy and fast.

——来自 [ShaneRobinson](https://forum.obsidian.md/t/obsidian-github-pages-for-digital-gardeners/2622/7)

## 一些工具——数字花园

### 建造公开的花园

- [TiddlyWiki](https://tiddlywiki.com/) - A no-code personal wiki system
  - [Stroll](https://giffmex.org/stroll/stroll.html) a TiddlyWiki plugin with bi-directional links and other Roam-like features
  - [TiddlyMap](http://tiddlymap.org/) - a mind-map plugin that shows visualizations for TiddlyWiki.
- [Gitbook](https://www.gitbook.com/)
- [React-Notion](https://github.com/splitbee/react-notion/) - allows you to publish a React-based website sources from your Notion notes - "Notion as a CMS"
- [Gatsby Brain Theme](https://github.com/aengusmcmillin/gatsby-theme-brain) - Roam-like bidirectional links in Gatsby.js
- [Gatsby Andy Theme](https://github.com/aravindballa/gatsby-theme-andy)
- [Gatsby Theme Garden](https://github.com/mathieudutour/gatsby-digital-garden/) - A set of tools to build a digital garden with Gatsby.js. Pull data from Roam Research or markdown.
- [Simply Jekyll](https://simply-jekyll.netlify.app/posts/introduction-to-simply-jekyll) - A Jekyll theme with bidirectional links, sidenotes, and transclusion
- [Digital Garden Jekyll Template](https://github.com/maximevaillancourt/digital-garden-jekyll-template) - A simple, clean jekyll template with bi-directional links
- [Eleventy Garden](https://github.com/b3u/eleventy-garden) - A minimal template with backlinks, built in [Eleventy](https://11ty.dev)
- [Foam](https://foambubble.github.io/foam/) - Roam-like personal note management and publishing system built inside VSCode，一个能够使用 `[[]]` 链接文本的应用
- [Foamy NextJS](https://github.com/yenly/foamy-nextjs) - Basic Foam + NextJS with MDX starter for building a digital garden
- [Dendron](https://www.dendron.so/) - A structured note taking tool that merges the freedom of Roam-like linking with the order hierarchical organization  
- [Roam-to-Garden](https://github.com/DoomHammer/roam-to-git/tree/roam-to-garden) - Turns a [Roam Research](https://roamresearch.com/) database into a Digital Garden
- [Archivy](https://github.com/archivy/archivy/) - Archivy is a self-hosted knowledge repository that allows you to safely preserve useful content that contributes to your own personal, searchable and extendable wiki.

### 建造私人花园

- [Roam Research](https://roamresearch.com/) - A personal notes system for interconnected thought
- [Org Roam](https://www.orgroam.com/) - non-hierarchical note-taking with org-mode in emacs
- [Obsidian](https://obsidian.md/) - a Roam-like knowledge base that works on top of a local folder of plain text Markdown files. 一个能够生成文档联系图的应用
- [TheBrain](https://www.thebrain.com/) - A tool for taking interconnected notes with an interactive graph.
- [Kumu](https://www.kumu.io/) - Make sense of your messy world. Kumu makes it easy to organize complex data into relationship maps that are beautiful to look at and a pleasure to use.

### 其余的花园用具

- [Webmentions](https://indieweb.org/Webmention) - About the Webmentions system
  - [Webmention.io](https://webmention.io/) - A service to add Webmentions to your Garden
- [Hypothesis](https://web.hypothes.is/) - A layer of social meta commentary

### 怎样构建和其他入门指导

- [How to build a digital garden with TiddlyWiki](https://nesslabs.com/digital-garden-tiddlywiki) by Anne-Laure Le Cunff
- [Install org-roam: an introductory technical guide with Doom Emacs](https://ianjones.us/own-your-second-brain) by Ian Jones
- [Building a Digital Garden](https://tomcritchlow.com/2019/02/17/building-digital-garden/) by Tom Critchlow
- [Webmentions - Joining the IndieWeb with Svelte](https://www.swyx.io/writing/clientside-webmentions) by Shawn Wang

### 理论、哲学和内省

- **[The Garden and the Stream: A Techno pastoral](https://hapgood.us/2015/10/17/the-garden-and-the-stream-a-technopastoral/)** by Mike Caulfield
- [Of Digital Streams, Campfires and Gardens](https://tomcritchlow.com/2018/10/10/of-gardens-and-wikis/) by Tom Critchlow
- [How the Blog Broke the Web](https://stackingthebricks.com/how-blogs-broke-the-web/) by Amy Hoy
- [My blog is a digital garden, not a blog](https://joelhooks.com/digital-garden) by Joel Hooks
- [You and your mind garden](https://nesslabs.com/mind-garden) by Anne-Laure Le Cunff
- [Digital Garden Terms of Service](https://www.swyx.io/writing/digital-garden-tos/) by Shawn Wang
- [What is a digital garden?](https://www.christopherbiscardi.com/garden) by Chris Biscardi
- [The Garden and the Stream: An IndieWeb Pop-up Session](https://indieweb.org/2020/Pop-ups/GardenAndStream)
- [The Swale: Weaving between Garden and Stream](https://bonkerfield.org/2020/05/swale-garden-stream/) by Will Stedden
- [A Brief History & Ethos of the Digital Garden](http://maggieappleton.com/garden-history) by Maggie Appleton

### 一致之处：便签盒、知识图、维基和相关概念

- [The Knowledge Graph Radar](https://github.com/brettkromkamp/knowledge-graph-radar)
- [Zettelkasten: knowledge and info management](https://zettelkasten.de/)
- [The Zettelkasten Method](https://www.lesswrong.com/posts/NfdHG6oHBJ8Qxc26s/the-zettelkasten-method-1) by Abram Demski
- [A web of wikis](https://doubleloop.net/2020/05/16/a-web-of-wikis/) by Neil Mather
- [Bliki tooling](https://doubleloop.net/2020/05/02/bliki-tooling/) by Neil Mather
- [Hack Your Life With A Private Wiki Notebook, Getting Things Done, And Other Systems](http://webseitz.fluxent.com/wiki/HackYourLifeWithAPrivateWikiNotebookGettingThingsDoneAndOtherSystems) by Bill Seitz
- [As We May Think](https://www.theatlantic.com/magazine/archive/1945/07/as-we-may-think/303881/) by Vannevar Bush (The Atlantic, 1945)

### 数字花园目录

| Gardener & Link | 🛠 Build Tools  | 🌿Note Themes |
| -------------------- | ------------------ | ----------------- |
| [Andy Matuschak](https://notes.andymatuschak.org/)  | The Mystery Andy System | Note-taking, education, tools for thought |
| [Anne-Laure Le Cunff](https://www.mentalnodes.com/)    | TiddlyWiki   | Networked thinking, metacognition, evidence-based learning and self-education   |
| [Tom Critchlow](https://tomcritchlow.com/)   | Jekyll              |  Indie consulting         |
| [Shawn Wang](https://www.swyx.io/writing) | Sapper | Web development, writing, speaking
| [Kevin Cummingham](https://kevincunningham.co.uk) |  Gatsby | Web development, React, AWS, GraphQL
| [Maggie Appleton](https://maggieappleton.com/garden)   |  Gatsby + MDX   | Anthropology, metaphors, visual explanations, and web development
| [Chris Biscardi](https://www.christopherbiscardi.com/garden)   |  Sector / Toast?   | Web development, MDX, GraphQL, Gatsby
| [Wess Daniels](https://nurselog.online)   |  Tiddlywiki (Pre-Release 5.1.23)   | Culture and systems change, liberation theology, tech and pedagogy
| [Aengus McMillin](https://aengusmcmillin.com/brain)  |  Gatsby |  Programming, Stoicism  |
| [Azlen Elza](https://notes.azlen.me/g3tibyfv/)  |  | Design, Conversational interfaces, Tools for thought
| [Joel Hooks](https://joelhooks.com/)  |  Next.js  | Bootstrapping / indie-hacking, community building, web development,
| [Ian Jones](https://ianjones.us/notes)  |  Gatsby  | Web development, Gatsby, Emacs
| [Wayan Jimmy](https://notebook.wayanjimmy.xyz) |  Gatsby ([Hasura Gitbook Starter](https://github.com/hasura/gatsby-gitbook-starter)) | Coding, Learning notes
| [Markus](https://re1.dev/wiki/) |  Eleventy | Design, linux, privacy
| [Max Stoiber](https://notes.mxstbr.com/About_these_notes) |  The Mystery Andy System | React, web development
| [Gwern](https://www.gwern.net/) | [JS, CSS, Hakyll, Haskell](https://www.gwern.net/About#tools) | Quantified self, spaced repetition, bitcoin
| [Chris Aldrich](https://tw.boffosocko.com) |  TiddlyWiki + TiddlyBlink + TiddlyMap | Art of Memory, IndieWeb, humanities, commonplace books, thought spaces
| [Neil Mather](https://commonplace.doubleloop.net) |  Org-mode | Programming, politics, climate change |
| [Gordon Brander](http://gordonbrander.com/pattern/) |  [Lettersmith](https://github.com/gordonbrander/lettersmith_py) | Design patterns, storytelling, systems
| [Bill Seitz](http://webseitz.fluxent.com/wiki/) |  Flask/Python with [WikiFlux](http://webseitz.fluxent.com/wiki/WikiFlux) | Product management, startups, wiki theory, engineering |
| [Daniel Chapman](https://www.dschapman.com/notes) |  Gatsby | Books, Writing, Poetry
| [Will Stedden](https://bonkerfield.org/) |  Custom coding a [side project](https://bonkerfield.org/2020/05/swale-garden-stream/) | Machine learning, automated language generation, quantum physics art, online transparency
| [Salman Ansari](https://notes.salman.io/) | Gatsby | Start-ups, engineering |
| [Fabien Benetou](https://fabien.benetou.fr/) | PmWiki (with plenty of extensions PHP/JS/NodeJS/WebXR/CSS/Processing/etc) | Everytyhing but particularly programming, tools, tools for thoughts |
| [Waylon Walker](https://waylonwalker.com/notes) | Gatsby | python, data-engineering, coding, learning notes |
| [Cristian Rojas](https://notes.crisrojas.com) | [Hugo Zettels theme](https://github.com/crisrojas/zettels)   | 🇪🇸 Drawing, coding, biology, introspection   |
| [Chinarut Ruangchotvit](http://autobiography.chinarut.com) | TheBrain | autobiography, personal transformation |
| [Steve Dondley](https://steve.dondley.com/notes/) | Jekyll, vimwiki | Tech, software, automation, some politics and issues |
| [Scott Spence](https://scottspence.com/garden/) | Gatsby + MDX | Web development, MDX, GraphQL, Gatsby, styled-components  |
| [Devine Lu Linvega](https://wiki.xxiivv.com) | C | Sailing, Design, Livecoding, Plan9 |
| [Milkii Brewster](https://wiki.thingsandstuff.org) | MediaWiki | Various life and tech topics, mostly Linux and audio FOSS |
| [Maxime Vaillancourt](https://maximevaillancourt.com/notes) | Jekyll ([open-source template](https://maximevaillancourt.com/blog/setting-up-your-own-digital-garden-with-jekyll)) | personal growth, ruby, web, linux |
| [Andy Byers](https://notes.ajb.app)  |  Jekyll  |   notes on coding, note taking, personal knowledge management and other random thoughts.  |
| [Abstractxan](https://abstractxan.xyz) | C++ ([Mizi](https://github.com/AbstractXan/Mizi)) | Tech, Art, Curating resources |
| [Nikita Voloboev](https://wiki.nikitavoloboev.xyz) | GitBook | Tool obsessed. Code, web dev, art. |
| [Luciano Strika](https://strikingloo.github.io/wiki/) | Jekyll | Personal Wiki, Digital Garden. StrikingLoo's Haphazard Repository of Knowledge, Opinions and Trivia |
| [Piotr Gaczkowski](https://garden.doomhammer.info) | Jekyll + Roam Research as backend | Book notes, Codex Vitae, cocktails, experiments |
| [Tymon Zaniewski](garden.tymon-zaniewski.xyz) | Jekyll ([open-source template](https://maximevaillancourt.com/blog/setting-up-your-own-digital-garden-with-jekyll)) | personal wiki, DIY electronics, making music |
| [Aquiles Carattino](https://www.aquiles.me) | Aqui Brain Dump | Science. Notes on books and papers. Technology Transfer. Working in Public |
| [Yenly Ma](https://yenly.wtf) | [Foamy NextJS](https://github.com/yenly/foamy-nextjs) and NextJS with MDX | Digital garden of gardens. Learning and making in public. |

---

**参考资料**：

1. <https://github.com/MaggieAppleton/digital-gardeners>
2. <https://forum.obsidian.md/t/obsidian-github-pages-for-digital-gardeners/2622/7>
3. <https://github.com/binyamin/eleventy-garden>
4. <https://github.com/raghuveerdotnet/simply-jekyll>
5. [note-complete](https://github.com/raghuveerdotnet/scratchpad/tree/master/note-complete)
6. <https://github.com/aravindballa/gatsby-theme-andy>
7. <https://github.com/aengusmcmillin/gatsby-theme-brain>
8. <https://nesslabs.com/digital-garden-tiddlywiki>
9. <https://github.com/gollum/gollum>
10. <https://jackiexiao.github.io/obsidian-docs/fr/Plugins/List%20of%20plugins/>
11. <https://github.com/Jackiexiao/foam-mkdocs-template>
12. <https://github.com/Maxence-L/notenote.link>
13. <https://github.com/svsool/vscode-memo>
14. <https://github.com/kmcgillivray/obsidian-lettersmith>
15. <https://www.11ty.dev/>
16. <http://gordonbrander.com/pattern/>
17. <https://github.com/brennanbrown/enjoyment-work>
18. <https://github.com/Mint-System/Knowledge/>
19. [建立知识体系，这份指南就够了](https://github.com/tianheg/articles/blob/main/docs/book/%E5%BB%BA%E7%AB%8B%E7%9F%A5%E8%AF%86%E4%BD%93%E7%B3%BB%EF%BC%8C%E8%BF%99%E4%BB%BD%E6%8C%87%E5%8D%97%E5%B0%B1%E5%A4%9F%E4%BA%86.md)
