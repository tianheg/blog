+++
date = '2021-10-17T21:04:50+08:00'
title = 'LC1. 两数之和'
tags = ['LeetCode']
slug = 'lc-1-two-sum'
+++

今天思考 LeetCode 题目：两数之和[^1]。

## 题目描述

两个变量，一个整数数组 `nums` 和一个整数目标值 `target`，在该数组中找出 *和为目标值 `target`* 的那两个整数，并返回它们的数组下标。

可假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。

可按任意顺序返回答案。

## 题解

### 一[^2]

```js
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
let twoSum = function (nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    let x = target - nums[i];
    if (map.has(x)) {
      return [map.get(x), i];
    } else {
      map.set(nums[i], i);
    }
  }
  return [];
};
```

- 时间复杂度：$O(n)$
- 空间复杂度：

`Map`:

`const map = new Map()`

- `map.has()`
- `map.get()`
- `map.set`

全局对象 `Map` 持有键值对，且记忆原有的插入顺序。`Map` 和 `Object` 是有区别的[^3]：

1. `Map` 默认不存放内容，只存放后来放入的；`Object` 有原型，所以存在和你的 key 矛盾的 key。
2. `Map` 的 key 可以是任何值（函数、对象、其他基元）；`Object` 只能是字符串或符号。
3. `Map` 的 key 顺序和插入顺序一致；`Object` 则很复杂。
4. `Map` 的大小通过属性 size 获得；`Object` 的大小必须手动决定。
5. `Map` 是一个可迭代对象，所以可迭代；`Object` 没有实现迭代协议，所以不能直接通过 `for...of` 迭代。
6. `Map` 在涉及频繁添加和删除键值对的场景中执行得更好；`Object` 相较于 `Map` 在添加和删除键值对的场景稍弱。
7. 序列化，语法分析：`Map` 并无原生支持，但可以自己构建；原生支持：`Object` 到 JSON，JSON 到 `Object`。

什么是哈希表？

### 二[^4]，[^5]

```js
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function (nums, target) {
  let prevNums = {}; // 存储出现的数字，和对应的索引
  for (let i = 0; i < nums.length; i++) { // 遍历元素
    const currentNum = nums[i]; // 当前元素
    const targetNum = target - currentNum; // 满足要求的目标元素
    const targetNumIndex = prevNums[targetNum]; // 在 prevNums 中获得目标元素的索引
    if (targetNumIndex !== undefined) {
      return [targetNumIndex, i]; // 如果存在，直接返回 [目标元素索引, 当前索引]
    } else {
      prevNums[currentNum] = i; // 不存在的话，说明之前没出现目标元素，存入当前元素和对应索引
    }
  }
};
```

哈希表

HashMap 减少查询时间。

[^1]: https://leetcode-cn.com/problems/two-sum/
[^2]: https://leetcode-cn.com/problems/two-sum/solution/qiao-yong-jszhong-de-mapdui-xiang-by-ber-qegl/
[^3]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
[^4]: https://leetcode-cn.com/problems/two-sum/solution/dai-ma-sui-xiang-lu-dai-ni-gao-qing-chu-xhhit/
[^5]: https://leetcode-cn.com/problems/two-sum/solution/qing-xi-de-bian-liang-ming-ming-bang-zhu-ji-yi-bu-/
