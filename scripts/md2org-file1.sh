#!/bin/bash

for file in content/posts/*.md
do
  base_name=$(basename "$file" .md)
  pandoc -s "$file" -o "content/posts/$base_name.org"
  echo "Converted $file to content/posts/$base_name.org"
done

echo "All Markdown files have been converted to Org mode."
