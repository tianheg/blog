---
title: "2020 年第 43 周总结"
date: 2020-10-25T20:04:59+08:00
categories: ["生活"]
life: ["Summary"]
description: "试着使用EChart画统计图"
tags: ["EChart","Data"]
keywords: ["EChart","Data"]
slug: 2020 43rd summary
---

<div id="main" style="width:600px;height:400px;" class="center"></div>
<script type="text/javascript" class="center">
// 基于准备好的dom，初始化echarts实例
var myChart = echarts.init(document.getElementById('main'));
var option = {
    title: {
        text: 'Coding Time this week unit: min'
    },
    tooltip: {},
    legend: {
        data:['Time']
    },
    xAxis: {
        data: ["M","T","W","T","F","S","S"]
    },
    yAxis: {},
    series: [{
        name: 'time',
        type: 'bar',
        data: [88, 60, 278, 53, 8, 280, 173]
    }]
};
myChart.setOption(option);
</script>

这是我第一次尝试，在博客中插入图表，比较简陋，以后慢慢改进。动机始于 [Ovilia](https://github.com/Ovilia) 的一篇博客 [2016 年读书小结](http://zhangwenli.com/blog/2017/01/03/reading-report/)。当时，读到这儿时觉得很有趣，没想到搁置了几天才开始动手做。

这张表显示的是，我本周的写代码的时间，时间统计工具 [Wakatime](https://wakatime.com/)。

---

时间，变得很特别，时快时慢。我也逐渐越来越慢，不知道什么时候开始的，也不知道什么时候会结束。今天下午一点多，在去买饭的路上，调侃自己：你可能无法彻底放松了。是的，我的确是这样认为的。以往那种懒散的状态消失不见了，我再也不可能回到那种状态。现在紧张的学习生活已经成为了常态，慢慢地数着第 40 周、第 41 周、第……周。

同学的一句话让我深思：你是什么时候迷上这东西（指编程）的呢？记得是今年 1 月份的时候，我买了域名，备案需要服务器，就这样慢慢的上道了。直到如今，我沉迷其中无法自拔。这是好事，因为我终于找到了喜欢做的事情。我不会遗憾自己没有早点遇见，只会赞叹冥冥之中命运的安排，我一步一个脚印地步入了这片神圣的地方。我不知道能够探索多久，只觉得不要浪费还能探索的时光。

时间过得是那么快，一周一周、一月一月、一年一年，我要做点什么，生活能变得不那么乏味，能变得有些生机。我在这里始终无知，是谦卑的学习者，任何人都是我的老师，我都应该学习借鉴他们。不介入争端，那只会无端消耗我，探索的时间。讨论有意义的问题，生命短暂，留给有价值的东西。

