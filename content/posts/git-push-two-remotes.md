+++
title = "Git Push Two Remotes"
date = 2021-11-25T00:00:00+08:00
lastmod = 2022-04-27T16:06:12+08:00
tags = ["技术", "Git"]
draft = false
+++

```sh
git remote set-url --add --push origin git://original/repo.git
git remote set-url --add --push origin git://another/repo.git
```

<https://stackoverflow.com/a/14290145>
