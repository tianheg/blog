+++
title = "Git Remove Untracked Files from Working Tree"
date = 2021-11-28T00:00:00+08:00
lastmod = 2022-04-27T16:06:33+08:00
tags = ["技术", "Git"]
draft = false
+++

<https://stackoverflow.com/a/64966/12539782>

```sh
# Print out the list of files and directories which will be removed (dry run)
git clean -n -d
# Delete the files from the repository
git clean -f
```
