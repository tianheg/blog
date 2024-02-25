#!/bin/bash

for file in content/posts/*-en.org
do
  if [ -e "$file" ]
  then
    echo "$file exists."
  else
    echo "No files ending with -en exist."
    break
  fi
done
