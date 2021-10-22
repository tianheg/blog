+++
date = '2021-10-22T21:47:47+08:00'
title = 'LC122. 买卖股票的最佳时机II'
tags = ['LeetCode']
slug = 'lc-122-best-time-to-buy-and-sell-stock-ii'
+++

今天思考 LeetCode 题目：买卖股票的最佳时机II[^1]。

## 题目描述

给定一个数组 `prices`，其中 `prices[i]` 是一支给定股票第 `i` 天的价格。

设计一个算法来计算所能获取的最大利润。可以尽可能地完成更多的交易（多次买卖一支股票）。

注意：不能同时参与多笔交易（必须在再次购买前出售掉之前的股票）。

提示：

- `1 <= prices.length <= 3 * 10^4`
- `0 <= prices[i] <= 10^4`

## 题解[^2]

```js
/**
 * @param {number[]} prices
 * @return {number}
 */
let maxProfit = function(prices) {
    const n = prices.length;
    const dp = new Array(n).fill(0).map(v => new Array(2).fill(0));
    dp[0][0] = 0, dp[0][1] = -prices[0];
    for (let i = 1; i < n; ++i) {
        dp[i][0] = Math.max(dp[i - 1][0], dp[i - 1][1] + prices[i]);
        dp[i][1] = Math.max(dp[i - 1][1], dp[i - 1][0] - prices[i]);
    }
    return dp[n - 1][0];
};
```

题解使用了「动态规划」这一方法。

[^1]: https://leetcode-cn.com/problems/best-time-to-buy-and-sell-stock-ii/
[^2]: https://leetcode-cn.com/problems/best-time-to-buy-and-sell-stock-ii/solution/mai-mai-gu-piao-de-zui-jia-shi-ji-ii-by-leetcode-s/
