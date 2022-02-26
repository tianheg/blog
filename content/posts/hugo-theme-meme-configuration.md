+++
title = "配置 Hugo 主题 Meme"
date = 2020-06-09T00:00:00+08:00
lastmod = 2022-02-26T14:51:31+08:00
tags = ["技术", "Hugo"]
draft = false
+++

## 卡片风格 {#卡片风格}

在文件 `~/assets/scss/custom/_custom.scss` 中 或者 在某个需要使用卡片风格的文章中 添加以下样式：

```css
.mytag{
    position: relative;
    left: 0; right: 0;
    width: 100%;
    height: 100%;
    line-height: 2;
    margin: auto;
    border-radius: 5px;
    background: rgba(255, 255, 255, .2);
    box-shadow: 3px 3px 6px 3px rgba(0, 0, 0, .5);
    overflow: hidden;
}
.mytag::before{
    content: '';
    position: relative;
    left: 0; right: 0;
    filter: blur(20px);
    z-index: -1;
    margin: -30px;
}
```

<style>
.mytag{
    position: relative;
    left: 0; right: 0;
    width: 100%;
    height: 100%;
    line-height: 2;
    margin: auto;
    border-radius: 5px;
    background: rgba(255, 255, 255, .2);
    box-shadow: 3px 3px 6px 3px rgba(0, 0, 0, .5);
    overflow: hidden;
}
.mytag::before{
    content: '';
    position: relative;
    left: 0; right: 0;
    filter: blur(20px);
    z-index: -1;
    margin: -30px;
}
.colorfulfont {
background: linear-gradient(to right, red,#45ed63);
-webkit-background-clip: text;
color: transparent;
}
</style>

代码：

```html
<div class="mytag">
<p style="margin:25px">
   <b>"少年贪玩，青年迷恋爱情，壮年汲汲于成名成家，暮年自安于自欺欺人。人寿几何，顽铁能炼成的精金，能有多少？但不同程度的锻炼，必有不同程度的成绩；不同程度的纵欲放肆，必积下不同程度的顽劣。"<br />上苍不会让所有幸福集中到某个人身上，得到爱情未必拥有金钱；拥有金钱未必得到快乐；得到快乐未必拥有健康；拥有健康未必一切都会如愿以偿。保持知足常乐的心态才是淬炼心智、净化心灵的最佳途径。一切快乐的享受都属于精神，这种快乐把忍受变为享受，是精神对于物质的胜利，这便是人生哲学。"</b>
</p>
<div style="text-align:right;margin:15px" ><footer>——<cite>杨绛</cite></footer></div>
</div>
```

效果：

<div class="mytag">
<p style="margin:25px">
   <b>"少年贪玩，青年迷恋爱情，壮年汲汲于成名成家，暮年自安于自欺欺人。人寿几何，顽铁能炼成的精金，能有多少？但不同程度的锻炼，必有不同程度的成绩；不同程度的纵欲放肆，必积下不同程度的顽劣。"<br />上苍不会让所有幸福集中到某个人身上，得到爱情未必拥有金钱；拥有金钱未必得到快乐；得到快乐未必拥有健康；拥有健康未必一切都会如愿以偿。保持知足常乐的心态才是淬炼心智、净化心灵的最佳途径。一切快乐的享受都属于精神，这种快乐把忍受变为享受，是精神对于物质的胜利，这便是人生哲学。"</b>
</p>
<div style="text-align:right;margin:15px" ><footer>——<cite>杨绛</cite></footer></div>
</div>


## 文字渐变色 {#文字渐变色}

在文件 `~/assets/scss/custom/_custom.scss` 中添加 _渐变_ 样式：

```css
.colorfulfont {
  background: linear-gradient(to right, red,#45ed63);
  -webkit-background-clip: text;
  color: transparent;
}
```

代码：

```html
<font class = "colorfulfont">
毕竟西湖六月中<br>风光不与四时同<br>接天莲叶无穷碧<br>映日荷花别样红
</font>
```

<font class = "colorfulfont">
毕竟西湖六月中<br>风光不与四时同<br>接天莲叶无穷碧<br>映日荷花别样红
</font>


## 添加博客已运行时间 {#添加博客已运行时间}

在文件 `~/asserts/js/custom.js` 中添加以下内容：

```js
//计算博客运行时间（2020.06.03添加）
function siteTime(){
    window.setTimeout("siteTime()", 1000);
    var seconds = 1000
    var minutes = seconds * 60
    var hours = minutes * 60
    var days = hours * 24
    var years = days * 365
    var today = new Date()
    var todayYear = today.getFullYear()
    var todayMonth = today.getMonth() + 1
    var todayDate = today.getDate()
    var todayHour = today.getHours()
    var todayMinute = today.getMinutes()
    var todaySecond = today.getSeconds()
    var t1 = Date.UTC(2019, 11, 26, 19, 06, 00)
    var t2 = Date.UTC(todayYear,todayMonth,todayDate,todayHour,todayMinute,todaySecond)
    var diff = t2-t1
    var diffYears = Math.floor(diff/years)
    var diffDays = Math.floor((diff/days)-diffYears*365)
    var diffHours = Math.floor((diff-(diffYears*365+diffDays)*days)/hours)
    var diffMinutes = Math.floor((diff-(diffYears*365+diffDays)*days-diffHours*hours)/minutes)
    var diffSeconds = Math.floor((diff-(diffYears*365+diffDays)*days-diffHours*hours-diffMinutes*minutes)/seconds)

    if(diffYears==0){
        document.getElementById("sitetime").innerHTML=" "+diffDays+" 天 "+diffHours+" 小时 "+diffMinutes+" 分钟 "+diffSeconds+" 秒"
    }else{
        document.getElementById("sitetime").innerHTML=" "+diffYears+" 年 "+diffDays+" 天 "+diffHours+" 小时 "+diffMinutes+" 分钟 "+diffSeconds+" 秒"
    }
}
    siteTime()
```

其中 `var t1 = Date.UTC(2019, 11, 26, 19, 06, 00)` 设置为需要计算的起始日期，如时间是：2020 年 01 月 01 日 00 时 00 分 00 秒则设置为：

```js
var t1 = Date.UTC(2020, 01, 01, 00, 00, 00)
```

代码：

```html
运行时间<span id="sitetime" style="color:#fb7312"></span>
```

不再使用该功能


## 字体配置 {#字体配置}

[添加 Google Fonts 思源宋体](https://immmmm.com/noto-serif-sc-by-google-fonts/)

---
参考资料

1.  <https://io-oi.me/tech/documentation-of-hugo-theme-meme/>
2.  [自定义 Hugo Shortcodes 简码](https://ztygcs.github.io/posts/%E5%8D%9A%E5%AE%A2/%E8%87%AA%E5%AE%9A%E4%B9%89-hugo-shortcodes-%E7%AE%80%E7%A0%81/)