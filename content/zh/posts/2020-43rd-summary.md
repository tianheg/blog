---
title: "2020 第 43 周总结"
date: 2020-10-25T20:04:59+08:00
categories: ["生活"]
life: ["Summary"]
description: "试着使用EChart画统计图"
tags: ["EChart","Data"]
keywords: ["EChart","Data"]
slug: 2020 43rd summary
---

<div id="main" style="width: 600px;height:400px;"></div>
<script type="text/javascript">
// 基于准备好的dom，初始化echarts实例
var myChart = echarts.init(document.getElementById('main'));
var option = {
    title: {
        text: 'ECharts 入门示例'
    },
    tooltip: {},
    legend: {
        data:['销量']
    },
    xAxis: {
        data: ["衬衫","羊毛衫","雪纺衫","裤子","高跟鞋","袜子"]
    },
    yAxis: {},
    series: [{
        name: '销量',
        type: 'bar',
        data: [5, 20, 36, 10, 10, 20]
    }]
};
myChart.setOption(option);
</script>

