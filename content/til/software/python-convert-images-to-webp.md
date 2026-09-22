---
title: 'Python Convert Images to Webp'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Programming
---

- [How to Convert Images to Webp in Python - Fedingo](https://fedingo.com/how-to-convert-images-to-webp-in-python/)
- <https://stackoverflow.com/a/47655463>
- <https://stackoverflow.com/a/57158589>

\`\`\`bash mkdir pytowebp && cd $_ python -m venv venv --upgrade-deps . venv/env/activate (venv) pip install Pillow (venv) emacs main.py \`\`\`

main.py:

\`\`\`py from pathlib import Path from PIL import Image

def convert<sub>towebp</sub>(source): """Convert image to webp.

Args: source (pathlib.Path): Path to source image

Returns: pathlib.Path: path to new image """ destination = source.with<sub>suffix</sub>(".webp")

image = Image.open(source) # Open image image.save(destination, format="webp") # Convert image to webp

return destination

def main(): all<sub>filespath<*sub> = Path(".").glob(r"****") for single<sub>file</sub> in all<sub>filespath</sub>: if single<sub>file</sub>.suffix in {".png", ".jpg", ".jpeg"}: # PurePath.suffix 查询文件扩展名 webp<sub>path</sub> = convert<sub>towebp</sub>(single<sub>file</sub>) print(webp<sub>path</sub>)

main() ```

最难的部分是同时找到包含 `{".png", ".jpg", ".jpeg"}` 三种后缀的文件。

---

参考资料

1. [Image Processing in Python: Algorithms, Tools, and Methods You Should Know - neptune.ai](https://neptune.ai/blog/image-processing-python)
2. [Essential Pil (Pillow) Image Tutorial (For Machine Learning People) - neptune.ai](https://neptune.ai/blog/pil-image-tutorial-for-machine-learning)


相关：[[python|python]]