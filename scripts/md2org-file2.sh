#!/bin/bash


while IFS= read -r line
do
  # Run the Python function for each file path
  python -c "import sys; sys.path.insert(0, './scripts'); import md2org_frontmatter; md2org_frontmatter.minify_front_matter('$line'); md2org_frontmatter.convert_to_org_mode('$line')"
done < "+++file.txt"
