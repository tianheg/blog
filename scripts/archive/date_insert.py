#!/usr/bin/env python3

import os

path = "/home/archie/repo/blog/org/"
org_files = os.listdir(path)
print(org_files)
for file in org_files:
  with open(path + file, "r") as f:
      contents = f.readlines()

  contents.insert(2, "#+DATE: <2022-02-10 Thu>")

  with open(path + file, "w") as f:
      contents = "".join(contents)
      f.write(contents)
# https://stackoverflow.com/a/10507291