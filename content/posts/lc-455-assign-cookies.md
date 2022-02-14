+++
title = "LC455. 分发饼干"
date = 2022-02-14T00:00:00+08:00
lastmod = 2022-02-14T15:08:51+08:00
tags = ["技术", "LeetCode"]
draft = false
+++

今天思考 LeetCode 题目：分发饼干[^fn:1]。


## 题目描述 {#题目描述}

假设你是一位很棒的家长，想要给你的孩子们一些小饼干。但是，每个孩子最多只能给一块饼干。

对每个孩子 i，都有一个胃口值 g[i]，这是能让孩子们满足胃口的饼干的最小尺寸；并且每块饼干 j，都有一个尺寸 s[j] 。如果 s[j] &gt;= g[i]，我们可以将这个饼干 j 分配给孩子 i，这个孩子会得到满足。你的目标是尽可能满足越多数量的孩子，并输出这个最大数值。


## 解题 {#解题}

我的错误示例：

```js
var findContentChildren = function(g, s) {
  let num = 0;
  for (let i = 0; i < g.length; i++) {
    for (let j = 0; j < s.length; j++) {
      if (g[i] <= s[j]) {
        num = num + 1;
        return num;
      }
    }
  }
}
```

来自这里的解决方案[^fn:2]：

```js
/**
 * @param {number[]} g
 * @param {number[]} s
 * @return {number}
 */
let findContentChildren = function(g, s) {
  g.sort((a, b) => a - b);
  s.sort((a, b) => a - b);
  const numOfChildren = g.length, numOfCookies = s.length;
  let count = 0;
  for (let i = 0, j = 0; i < numOfChildren && j < numOfCookies; i++,j++) {
    while (j < numOfCookies && g[i] > s[j]) {
      j++;
    }
    if (j < numOfCookies) {
      count++;
    }
  }
  return count;
};
console.log(findContentChildren([1,2,3], [1,6,3])); // 3
```

解决方案用到了贪心算法[^fn:3]。

贪心算法是寻找 **最优解** 的常用方法。这种方法模式一般将求解过程分成若干步骤，但每一步都应用贪心原则，选取当前状态下 **最好/最优的选择** 。基本步骤：

1.  从某个初始解出发
2.  采用迭代过程，当可以向目标前进一步时，就根据局部最优策略，得到一部分解，缩小问题规模
3.  将所有解综合起来

LeetCode 第 860 题（柠檬水找零）也涉及了贪心算法。

[^fn:1]: <https://leetcode-cn.com/problems/assign-cookies/>
[^fn:2]: <https://leetcode-cn.com/problems/assign-cookies/solution/fen-fa-bing-gan-by-leetcode-solution-50se/>
[^fn:3]: <https://zhuanlan.zhihu.com/p/53334049>