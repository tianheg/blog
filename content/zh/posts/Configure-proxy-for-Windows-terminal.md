---
title: 给 Windows 的终端配置代理
date: 2020-04-03T22:34:17+08:00
categories: ["技术"]
tech: ["Win10"]
slug: 
toc: true
tocNum: true
---

给 Win10 终端配置代理这个问题，以前遇到过几次，但都略过了。就连这篇文章都拖了很久。我把参考链接那篇文章总结下来，我觉得自己以后一定会用到。

命令和 **Linux** 下没什么区别。

```bash
set http_proxy=http://127.0.0.1:1080

set https_proxy=http://127.0.0.1:1080

set http_proxy_user=user
set http_proxy_pass=pass

set https_proxy_user=user
set https_proxy_pass=pass

# 恢复
set http_proxy=

set https_proxy=

# Ubuntu 下命令为 export
# export http_proxy=http://127.0.0.1:1080
```

</br>

## 要点

1. 一定要加 `http://`，直接写域名或者 IP 不行。
2. **http** 和 **https** 都要设置。

然后如果想验证是否成功配置了代理的话，用 `ping` 命令是不可以的

## ping 还是不行的原因

ping 的协议不是 http，也不是 https，是 ICMP 协议。

## 验证方式

使用 `curl -vv http://www.google.com` 验证，如果返回如下结果表示代理设置成功。

```bash
$ curl -vv http://www.google.com                                                                               ⬢ 14.5.0
* Rebuilt URL to: http://www.google.com/
*   Trying 127.0.0.1...
* TCP_NODELAY set
* Connected to 127.0.0.1 (127.0.0.1) port 1080 (#0)
> GET http://www.google.com/ HTTP/1.1
> Host: www.google.com
> User-Agent: curl/7.58.0
> Accept: */*
> Proxy-Connection: Keep-Alive
>
< HTTP/1.1 200 OK
< Date: Sat, 03 Oct 2020 11:59:55 GMT
< Expires: -1
< Cache-Control: private, max-age=0
< Content-Type: text/html; charset=ISO-8859-1
< P3P: CP="This is not a P3P policy! See g.co/p3phelp for more info."
< Server: gws
< X-XSS-Protection: 0
< X-Frame-Options: SAMEORIGIN
< Set-Cookie: 1P_JAR=2020-10-03-11; expires=Mon, 02-Nov-2020 11:59:55 GMT; path=/; domain=.google.com; Secure
< Set-Cookie: NID=204=VgbhaHCkLUb_cbvUfD4iUcErz-i_lJi_2-MPd0kxvaU1-pF_Asx4T5FXWIPeQ7Aaz23mow1qWCfftjY_2YKiLY4IpgSa0ZnPO5WF-iUR0l5nrtdRCbvMWVFYTykN1HbSy8NUpdG2UgzcNqnNBSHrL_Jk5re76X0M08GBrqZLMRQ; expires=Sun, 04-Apr-2021 11:59:55 GMT; path=/; domain=.google.com; HttpOnly
< Accept-Ranges: none
< Vary: Accept-Encoding
< Connection: close
< Transfer-Encoding: chunked
< Proxy-Connection: keep-alive
<
<!doctype html><html itemscope="" itemtype="http://schema.org/WebPage" lang="zh-TW"><head><meta content="text/html; charset=UTF-8" http-equiv="Content-Type"><meta content="/images/branding/googleg/1x/googleg_standard_color_128dp.png" itemprop="image"><title>Google</title><script nonce="cOGkqQRjvyJ/9NFw9h1lrQ==">(function(){window.google={kEI:'u2d4X7PRKMq2mAXJkZ3ABA',kEXPI:'0,202160,2,1151585,5662,730,224,5105,206,3204,10,1226,364,1499,612,205,383,246,5,1129,225,648,653,2799,314,3,65,308,678,283,868,113,451,319,97,41,88,189,793,238,1118818,1197731,551,328985,13677,4855,32692,16114,2236,26448,9188,8384,1326,3533,1361,9290,3026,4742,11033,1808,4998,7931,5297,2054,920,873,4192,6430,7432,7095,4519,2776,919,2277,8,570,2226,1593,1279,2212,530,149,1103,840,517,1466,56,4258,312,1137,2,2669,2025,542,1233,520,1947,2229,93,329,1283,16,2927,2246,1814,1786,3227,2845,7,6068,6286,4455,641,6134,1405,337,4929,108,3407,908,2,941,2614,2397,7468,231,10,1465,1571,3,346,230,970,865,4625,149,43,3458,2488,2252,4072,1661,4,1528,1696,608,217,1019,271,874,405,42,1818,2487,443,43,930,281,52,2377,464,459,1555,4,5098,1316,2019,92,175,997,1426,69,1667,948,2811,1753,690,1968,3903,1,259,80,358,2,158,914,563,463,40,185,431,30,469,832,2553,138,1671,1213,211,874,116,52,1774,1009,247,255,1220,994,850,81,367,1,1006,638,146,519,829,130,360,115,2,567,1008,33,2021,740,284,326,1747,612,55,450,11,286,610,986,698,1404,100,42,7,160,606,2,476,464,17,303,30,314,50,363,11,731,43,21,107,494,96,17,141,105,63,862,3,763,95,1305,83,2,1083,523,686,948,250,245,110,676,301,57,275,660,521,1934,4,5751655,6000699,2801217,549,333,444,1,2,80,1,900,896,1,9,2,2551,1,748,936,4,6,553,1,4265,1,1,2,1017,9,305,3299,248,595,1,420,109,1,34,114,60,5,40,3,2,47,23,13,3,2,2,1,6,4,1,7,1,1,5,8,23959348,2716138,12107',kBL:'_x1E'};google.sn='webhp';google.kHL='zh-TW';})();(function(){google.lc=[];google.li=0;google.getEI=function(a){for(var c;a&&(!a.getAttribute||!(c=a.getAttribute("eid")));)a=a.parentNode;return c||google.kEI};google.getLEI=function(a){for(var c=null;a&&(!a.getAttribute||!(c=a.getAttribute("leid")));)a=a.parentNode;return c};google.ml=function(){return null};google.time=function(){return Date.now()};google.log=function(a,c,b,d,g){if(b=google.logUrl(a,c,b,d,g)){a=new Image;var e=google.lc,f=google.li;e[f]=a;a.onerror=a.onload=a.onabort=function(){delete e[f]};google.vel&&google.vel.lu&&google.vel.lu(b);a.src=b;google.li=f+1}};google.logUrl=function(a,c,b,d,g){var e="",f=google.ls||"";b||-1!=c.search("&ei=")||(e="&ei="+google.getEI(d),-1==c.search("&lei=")&&(d=google.getLEI(d))&&(e+="&lei="+d));d="";!b&&google.cshid&&-1==c.search("&cshid=")&&"slh"!=a&&(d="&cshid="+google.cshid);b=b||"/"+(g||"gen_204")+"?atyp=i&ct="+a+"&cad="+c+e+f+"&zx="+google.time()+d;/^http:/i.test(b)&&"https:"==window.location.protocol&&(google.ml(Error("a"),!1,{src:b,glmm:1}),b="");return b};}).call(this);(function(){google.y={};google.x=function(a,b){if(a)var c=a.id;else{do c=Math.random();while(google.y[c])}google.y[c]=[a,b];return!1};google.lm=[];google.plm=function(a){google.lm.push.apply(google.lm,a)};google.lq=[];google.load=function(a,b,c){google.lq.push([[a],b,c])};google.loadAll=function(a,b){google.lq.push([a,b])};}).call(this);google.f={};(function(){
document.documentElement.addEventListener("submit",function(b){var a;if(a=b.target){var c=a.getAttribute("data-submitfalse");a="1"==c||"q"==c&&!a.elements.q.value?!0:!1}else a=!1;a&&(b.preventDefault(),b.stopPropagation())},!0);document.documentElement.addEventListener("click",function(b){var a;a:{for(a=b.target;a&&a!=document.documentElement;a=a.parentElement)if("A"==a.tagName){a="1"==a.getAttribute("data-nohref");break a}a=!1}a&&b.preventDefault()},!0);}).call(this);
var a=window.location,b=a.href.indexOf("#");if(0<=b){var c=a.href.substring(b+1);/(^|&)q=/.test(c)&&-1==c.indexOf("#")&&a.replace("/search?"+c.replace(/(^|&)fp=[^&]*/g,"")+"&cad=h")};</script><style>#gbar,#guser{font-size:13px;padding-top:1px !important;}#gbar{height:22px}#guser{padding-bottom:7px !important;text-align:right}.gbh,.gbd{border-top:1px solid #c9d7f1;font-size:1px}.gbh{height:0;position:absolute;top:24px;width:100%}@media all{.gb1{height:22px;margin-right:.5em;vertical-align:top}#gbar{float:left}}a.gb1,a.gb4{text-decoration:underline !important}a.gb1,a.gb4{color:#00c !important}.gbi .gb4{color:#dd8e27 !important}.gbf .gb4{color:#900 !important}
</style><style>body,td,a,p,.h{font-family:arial,sans-serif}body{margin:0;overflow-y:scroll}#gog{padding:3px 8px 0}td{line-height:.8em}.gac_m td{line-height:17px}form{margin-bottom:20px}.h{color:#36c}.q{color:#00c}em{color:#c03;font-style:normal;font-weight:normal}a em{text-decoration:underline}.lst{height:25px;width:496px}.gsfi,.lst{font:18px arial,sans-serif}.gsfs{font:17px arial,sans-serif}.ds{display:inline-box;display:inline-block;margin:3px 0 4px;margin-left:4px}input{font-family:inherit}body{background:#fff;color:#000}a{color:#11c;text-decoration:none}a:hover,a:active{text-decoration:underline}.fl a{color:#36c}a:visited{color:#551a8b}.sblc{padding-top:5px}.sblc a{display:block;margin:2px 0;margin-left:13px;font-size:11px}.lsbb{background:#eee;border:solid 1px;border-color:#ccc #999 #999 #ccc;height:30px}.lsbb{display:block}#WqQANb a{display:inline-block;margin:0 12px}.lsb{background:url(/images/nav_logo229.png) 0 -261px repeat-x;border:none;color:#000;cursor:pointer;height:30px;margin:0;outline:0;font:15px arial,sans-serif;vertical-align:top}.lsb:active{background:#ccc}.lst:focus{outline:none}</style><script nonce="cOGkqQRjvyJ/9NFw9h1lrQ=="></script></head><body bgcolor="#fff"><script nonce="cOGkqQRjvyJ/9NFw9h1lrQ==">(function(){var src='/images/nav_logo229.png';var iesg=false;document.body.onload = function(){window.n && window.n();if (document.images){new Image().src=src;}
if (!iesg){document.f&&document.f.q.focus();document.gbqf&&document.gbqf.q.focus();}
}
})();</script><div id="mngb"><div id=gbar><nobr><b class=gb1>&#25628;&#23563;</b> <a class=gb1 href="http://www.google.com.tw/imghp?hl=zh-TW&tab=wi">&#22294;&#29255;</a> <a class=gb1 href="http://maps.google.com.tw/maps?hl=zh-TW&tab=wl">&#22320;&#22294;</a> <a class=gb1 href="https://play.google.com/?hl=zh-TW&tab=w8">Play</a> <a class=gb1 href="http://www.youtube.com/?gl=TW&tab=w1">YouTube</a> <a class=gb1 href="https://news.google.com/?tab=wn">&#26032;&#32862;</a> <a class=gb1 href="https://mail.google.com/mail/?tab=wm">Gmail</a> <a class=gb1 href="https://drive.google.com/?tab=wo">&#38642;&#31471;&#30828;&#30879;</a> <a class=gb1 style="text-decoration:none" href="https://www.google.com.tw/intl/zh-TW/about/products?tab=wh"><u>&#26356;&#22810;</u> &raquo;</a></nobr></div><div id=guser width=100%><nobr><span id=gbn class=gbi></span><span id=gbf class=gbf></span><span id=gbe></span><a href="http://www.google.com.tw/history/optout?hl=zh-TW" class=gb4>&#32178;&#38913;&#35352;&#37636;</a> | <a  href="/preferences?hl=zh-TW" class=gb4>&#35373;&#23450;</a> | <a target=_top id=gb_70 href="https://accounts.google.com/ServiceLogin?hl=zh-TW&passive=true&continue=http://www.google.com/&ec=GAZAAQ" class=gb4>&#30331;&#20837;</a></nobr></div><div class=gbh style=left:0></div><div class=gbh style=right:0></div></div><center><br clear="all" id="lgpd"><div id="lga"><img alt="Google" height="92" src="/images/branding/googlelogo/1x/googlelogo_white_background_color_272x92dp.png" style="padding:28px 0 14px" width="272" id="hplogo"><br><br></div><form action="/search" name="f"><table cellpadding="0" cellspacing="0"><tr valign="top"><td width="25%">&nbsp;</td><td align="center" nowrap=""><input name="ie" value="ISO-8859-1" type="hidden"><input value="zh-TW" name="hl" type="hidden"><input name="source" type="hidden" value="hp"><input name="biw" type="hidden"><input name="bih" type="hidden"><div class="ds" style="height:32px;margin:4px 0"><input class="lst" style="margin:0;padding:5px 8px 0 6px;vertical-align:top;color:#000" autocomplete="off" value="" title="Google &#25628;&#23563;" maxlength="2048" name="q" size="57"></div><br style="line-height:0"><span class="ds"><span class="lsbb"><input class="lsb" value="Google &#25628;&#23563;" name="btnG" type="submit"></span></span><span class="ds"><span class="lsbb"><input class="lsb" id="tsuid1" value="&#22909;&#25163;&#27683;" name="btnI" type="submit"><script nonce="cOGkqQRjvyJ/9NFw9h1lrQ==">(function(){var id='tsuid1';document.getElementById(id).onclick = function(){if (this.form.q.value){this.checked = 1;if (this.form.iflsig)this.form.iflsig.disabled = false;}
else top.location='/doodles/';};})();</script><input value="AINFCbYAAAAAX3h1y3XmyKNBd3NgKBJomnOVS2Y2J07s" name="iflsig" type="hidden"></span></span></td><td class="fl sblc" align="left" nowrap="" width="25%"><a href="/advanced_search?hl=zh-TW&amp;authuser=0">&#36914;&#38542;&#25628;&#23563;</a></td></tr></table><input id="gbv" name="gbv" type="hidden" value="1"><script nonce="cOGkqQRjvyJ/9NFw9h1lrQ==">(function(){var a,b="1";if(document&&document.getElementById)if("undefined"!=typeof XMLHttpRequest)b="2";else if("undefined"!=typeof ActiveXObject){var c,d,e=["MSXML2.XMLHTTP.6.0","MSXML2.XMLHTTP.3.0","MSXML2.XMLHTTP","Microsoft.XMLHTTP"];for(c=0;d=e[c++];)try{new ActiveXObject(d),b="2"}catch(h){}}a=b;if("2"==a&&-1==location.search.indexOf("&gbv=2")){var f=google.gbvu,g=document.getElementById("gbv");g&&(g.value=a);f&&window.setTimeout(function(){location.href=f},0)};}).call(this);</script></form><div id="gac_scont"></div><div style="font-size:83%;min-height:3.5em"><br></div><span id="footer"><div style="font-size:10pt"><div style="margin:19px auto;text-align:center" id="WqQANb"><a href="/intl/zh-TW/ads/">&#24291;&#21578;&#26381;&#21209;</a><a href="http://www.google.com.tw/intl/zh-TW/services/">&#21830;&#26989;&#35299;&#27770;&#26041;&#26696;</a><a href="/intl/zh-TW/about.html">&#38364;&#26044; Google</a><a href="http://www.google.com/setprefdomain?prefdom=TW&amp;prev=http://www.google.com.tw/&amp;sig=K_3O4MYreYR8_IUvjTp_XlZFyiVVg%3D">Google.com.tw</a></div></div><p style="font-size:8pt;color:#767676">&copy; 2020 - <a href="/intl/zh-TW/policies/privacy/">&#38577;&#31169;&#27402;</a> - <a href="/intl/zh-TW/policies/terms/">&#26381;&#21209;&#26781;&#27454;</a></p></span></center><script nonce="cOGkqQRjvyJ/9NFw9h1lrQ==">(function(){window.google.cdo={height:0,width:0};(function(){var a=window.innerWidth,b=window.innerHeight;if(!a||!b){var c=window.document,d="CSS1Compat"==c.compatMode?c.documentElement:c.body;a=d.clientWidth;b=d.clientHeight}a&&b&&(a!=google.cdo.width||b!=google.cdo.height)&&google.log("","","/client_204?&atyp=i&biw="+a+"&bih="+b+"&ei="+google.kEI);}).call(this);})();(function(){var u='/xjs/_/js/k\x3dxjs.hp.en.yTT6eQ_hd0E.O/m\x3dsb_he,d/am\x3dAJ4gDg/d\x3d1/rs\x3dACT90oEedLlCOoLfcG6VO8azxlCp05vxrw';
setTimeout(function(){var b=document;var a="SCRIPT";"application/xhtml+xml"===b.contentType&&(a=a.toLowerCase());a=b.createElement(a);a.src=u;google.timers&&google.timers.load&&google.tick&&google.tick("load","xjsls");document.body.appendChild(a)},0);})();(function(){window.google.xjsu='/xjs/_/js/k\x3dxjs.hp.en.yTT6eQ_hd0E.O/m\x3dsb_he,d/am\x3dAJ4gDg/d\x3d1/rs\x3dACT90oEedLlCOoLfcG6VO8azxlCp05vxrw';})();function _DumpException(e){throw e;}
function _F_installCss(c){}
(function(){google.jl={dw:false,em:[],emw:false,lls:'default',pdt:0,snet:true,uwp:true};})();(function(){var pmc='{\x22d\x22:{},\x22sb_he\x22:{\x22agen\x22:true,\x22cgen\x22:true,\x22client\x22:\x22heirloom-hp\x22,\x22dh\x22:true,\x22dhqt\x22:true,\x22ds\x22:\x22\x22,\x22ffql\x22:\x22zh-TW\x22,\x22fl\x22:true,\x22host\x22:\x22google.com\x22,\x22isbh\x22:28,\x22jsonp\x22:true,\x22msgs\x22:{\x22cibl\x22:\x22&#28165;&#38500;&#25628;&#23563;\x22,\x22dym\x22:\x22&#24744;&#26159;&#19981;&#26159;&#35201;&#26597;&#65306;\x22,\x22lcky\x22:\x22&#22909;&#25163;&#27683;\x22,\x22lml\x22:\x22&#30637;&#35299;&#35443;&#24773;\x22,\x22oskt\x22:\x22&#36664;&#20837;&#24037;&#20855;\x22,\x22p* Closing connection 0
src\x22:\x22&#24050;&#24478;&#24744;&#30340;&#12300;\\u003Ca href\x3d\\\x22/history\\\x22\\u003E&#32178;&#38913;&#35352;&#37636;\\u003C/a\\u003E&#12301;&#20013;&#31227;&#38500;&#36889;&#31558;&#25628;&#23563;&#35352;&#37636;\x22,\x22psrl\x22:\x22&#31227;&#38500;\x22,\x22sbit\x22:\x22&#20197;&#22294;&#25628;&#23563;\x22,\x22srch\x22:\x22Google &#25628;&#23563;\x22},\x22ovr\x22:{},\x22pq\x22:\x22\x22,\x22refpd\x22:true,\x22refspre\x22:true,\x22rfs\x22:[],\x22sbpl\x22:16,\x22sbpr\x22:16,\x22scd\x22:10,\x22stok\x22:\x22jLWj_H7n-p5zFF7zmsuFX1KY5ok\x22,\x22uhde\x22:false}}';google.pmc=JSON.parse(pmc);})();</script>        </body></html>%
```

问题：一次 Ubuntu20.04 的代理设置，可以 ping 得通，0% 丢包。但是 `curl -vv http://www.google.com` 返回：

```bash
➜ curl -vv http://www.google.com
* Uses proxy env variable no_proxy == 'localhost,127.0.0.0/8,::1'
* Uses proxy env variable http_proxy == 'http://127.0.0.1:1080'
*   Trying 127.0.0.1:1080...
* TCP_NODELAY set
* Connected to 127.0.0.1 (127.0.0.1) port 1080 (#0)
> GET http://www.google.com/ HTTP/1.1
> Host: www.google.com
> User-Agent: curl/7.68.0
> Accept: */*
> Proxy-Connection: Keep-Alive
> 
* Received HTTP/0.9 when not allowed

* Closing connection 0
curl: (1) Received HTTP/0.9 when not allowed
```

不知道是什么原因造成的。

未完待续

---

参考链接：

给 Windows 的终端配置代理：[https://zcdll.github.io/2018/01/27/proxy-on-windows-terminal/](https://zcdll.github.io/2018/01/27/proxy-on-windows-terminal/) [mirror](https://web.archive.org/web/20201003115641/https://zcdll.github.io/2018/01/27/proxy-on-windows-terminal/)