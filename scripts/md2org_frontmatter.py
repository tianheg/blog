#!/usr/bin/env python3
import re
import os

def convert_to_org_mode(file_path):
  with open(file_path, 'r') as file:
    markdown_text = file.read()

  # Extract title, date, and tags
  title = re.search(r'title = "(.*?)"', markdown_text, flags=re.DOTALL).group(1)
  date = re.search(r'date = (.*?T.*?)\+', markdown_text, flags=re.DOTALL).group(1).split('T')[0]
  tags = re.search(r'tags = \["(.*?)"\]', markdown_text, flags=re.DOTALL).group(1)

  # Remove front matter
  markdown_text = re.sub(r'\+\+\+.*?\+\+\+', '', markdown_text, flags=re.DOTALL)

  # Add title, date, and tags to the top of the file
  markdown_text = f'#+TITLE: {title}\n#+DATE: <{date}>\n#+TAGS[]: {tags}' + markdown_text

  # Write the result back to the file
  with open(file_path, 'w') as file:
    file.write(markdown_text)

    # Log the conversion process
    print(f"Converted {file_path} to org mode.")

# convert_to_org_mode('content/posts/apollo-11.org')
### Error recording
# The issue seems to be that the date in the markdown text is spread over multiple lines. The regular expression is not able to match multi-line strings because the . character does not match newline characters by default.
def minify_front_matter(file_path):
  with open(file_path, 'r') as file:
    markdown_text = file.read()

  # Extract front matter
  front_matter_match = re.search(r'\+\+\+(.*?)\+\+\+', markdown_text, flags=re.DOTALL)
  if front_matter_match is None:
    raise ValueError(f"Could not find front matter in {file_path}")

  front_matter = front_matter_match.group(1)
  num_lines = front_matter.count('\n') + 1

  # If front matter spans multiple lines, minify it to one line
  if num_lines >= 2:
    front_matter_minified = front_matter.replace('\n', ' ')
    markdown_text = markdown_text.replace(front_matter, front_matter_minified)

  # Write the result back to the file
  with open(file_path, 'w') as file:
    file.write(markdown_text)

  print(f"Minified front matter in {file_path} to one line.")
