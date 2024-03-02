import re, os
import datetime

def read_file(file_path):
  with open(file_path, 'r') as file:
    return file.read()

def write_file(file_path, content):
  with open(file_path, 'w') as file:
    file.write(content)

def get_weekday(date_str):
  date_obj = datetime.datetime.strptime(date_str, '%Y-%m-%d')
  return date_obj.strftime('%a')

def replace_date_with_weekday(content, pattern):
  return re.sub(pattern, lambda match: f'{match.group(1)}{match.group(2)} {get_weekday(match.group(2))}{match.group(3)}', content)

def process_files_in_directory(directory, pattern):
  for filename in os.listdir(directory):
    if filename.endswith(".org"):
      file_path = os.path.join(directory, filename)
      content = read_file(file_path)
      # Only update the file if it contains a date without weekday or time
      if re.search(pattern, content):
        new_content = replace_date_with_weekday(content, pattern)
        write_file(file_path, new_content)

def main():
  directory = 'content/posts'
  # Only match dates without weekday or time
  pattern = r"(#\+DATE: <)(\d{4}-\d{2}-\d{2})(>)"
  process_files_in_directory(directory, pattern)

if __name__ == "__main__":
  main()
