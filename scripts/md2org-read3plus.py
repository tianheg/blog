import os

directory = 'content/posts'
for filename in os.listdir(directory):
  if filename.endswith('.org'):
    file_path = os.path.join(directory, filename)
    with open(file_path, 'r') as file:
        first_line = file.readline().strip()
        if first_line.startswith('+++'):
            print(file_path)
# python scripts/md2org-read3plus.py > +++file.txt
