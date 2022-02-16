+++
title = "Unicode Segmentation in JavaScript"
date = 2021-12-18T00:00:00+08:00
lastmod = 2022-02-16T09:50:04+08:00
tags = ["技术", "JavaScript"]
draft = false
+++

<https://h3manth.com/posts/unicode-segmentation-in-javascript/>

Unicode 定义了一个字符分割算法来查找字符之间的边界。Unicode 还定义了一种算法，用于查找 [CLDR](https://en.wikipedia.org/wiki/Common_Locale_Data_Repository) 根据地区设置调整的词和句子之间的边界。这些边界可能是有用的，例如，在实现一个文本编辑器，其中有跳跃或突出单词和句子的命令，[Intl.Segmenter](https://tc39.es/proposal-intl-segmenter/) API 可以帮助我们轻松地分割这些代码点。

示例代码：

```javascript
let segmenter = new Intl.Segmenter("kn-IN", {granularity: "word"});
let input = "ಆವು ಈವಿನ ನಾವು ನೀವಿಗೆ ಆನು ತಾನದ ತನನನಾ";
let segments = segmenter.segment(input);
for (let {segment, index, isWordLike} of segments) {
  console.log("segment at code units [%d, %d): «%s»%s",
    index, index + segment.length,
    segment,
    isWordLike ? " (word-like)" : ""
  );
}
```

更多内容阅读 [GitHub：tc39/proposal-intl-segmenter](https://github.com/tc39/proposal-intl-segmenter)。