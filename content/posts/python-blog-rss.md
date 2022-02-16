+++
title = "通过 Python 为博客生成 RSS"
date = 2022-01-26T00:00:00+08:00
lastmod = 2022-02-16T15:30:38+08:00
tags = ["技术", "Python"]
draft = false
+++

生成步骤：

1.  通过 gen-json.js 文件，生成 blogs.json
2.  通过 gen-rss.py 文件，生成 index.xml

`gen-json.js` ：

```js
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// for blogs.json
const url = 'https://www.yidajiabei.xyz/blog/index.html';

async function scrapeData() {
  try {
    // Fetch HTML of the page we want to scrape
    const { data } = await axios.get(url);
    // Load HTML we fetched in the previous line
    const $ = cheerio.load(data);
    // Select all the list items in plainlist class
    const listItems = $('.org-ul li');
    // Stores data for all countries
    const countries = [];
    // Use .each method to loop through the li we selected
    listItems.each((idx, el) => {
      // Object holding data for each country/jurisdiction
      const country = { title: '', link: '', date: '', desp: '' }; // , link: ""
      // Select the text content of a and span elements
      // Store the textcontent in the above object
      country.title = $(el).children('a').text();
      country.link = $(el).children('a').attr('href');
      country.date = $(el)
        .text()
        .replace(/[^0-9][^\s]+/g, '')
        .split('-')
        .join('')
        .match(/.{1,2}/g)
        .join('-');
      if (country.link.split('/')[0] === '2022') {
        country.date = '2022-' + country.date;
      } else if (country.link.split('/')[0] === '2021') {
        country.date = '2021-' + country.date;
      } else if (country.link.split('/')[0] === '2020') {
        country.date = '2020-' + country.date;
      } else if (country.link.split('/')[0] === '2019') {
        country.date = '2019-' + country.date;
      } else if (country.link.split('/')[0] === '2018') {
        country.date = '2018-' + country.date;
      }
      // console.log(country.title);
      // Populate countries array with country data
      country.desp = fs
        .readFileSync('/home/archie/repo/blog/blog/' + country.link)
        .toString()
        .match(/<body[^>]*>([\w|\W]*)<\/body>/im)[1]
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .trim();
      countries.push(country);
    });
    // Logs countries array to the console
    // console.dir(countries);
    // Write countries array in countries.json file
    fs.writeFile('blogs.json', JSON.stringify(countries, null, 2), (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log('Successfully written data to blogs.json');
    });
  } catch (err) {
    console.error(err);
  }
}
// Invoke the above function
scrapeData();
```

`gen-rss.py` ：

```python
#!/usr/bin/env python

import json
import datetime as dt
from datetime import datetime, date, time, timezone

domain = 'www.yidajiabei.xyz'

site = 'https://%s/blog/' % (domain)

def get_end_of_day(date):
    return datetime.strptime(
        f'{date} 08:00:00', '%Y-%m-%d %H:%M:%S').astimezone()

# 读取 json 文件内容,返回字典格式
with open('./scripts/blogs.json','r',encoding='utf8')as fp:
    json_data = json.load(fp)
    itemLines = ["<item><title>" + str(json_data[x]['title']) + "</title><link>" + site + str(json_data[x]['link']) + "</link><guid isPermaLink=\"true\">" + site + str(json_data[x]['link']) + "</guid><pubDate>" + get_end_of_day(str(json_data[x]['date'])).strftime("%a, %d %b %Y %I:%M:%S %Z") + "</pubDate><description type=\"html\">" + str(json_data[x]['desp']) + "</description></item>\n"for x in range(0, len(json_data) -1)]
    # print(itemLines[0:20])


with open('./blog/index.xml', 'w') as fh:
  fh.write("""<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:atom="http://www.w3.org/2005/Atom" version="2.0"><channel>
<title>一大加贝</title>
<link>https://www.yidajiabei.xyz/blog/</link>
<description>学习技术，热爱生活</description>
<generator>Python script wrote by myself</generator>
<language>zh-CN</language>
<managingEditor>me@yidajiabei.xyz (Jim Gao)</managingEditor>
<webMaster>me@yidajiabei.xyz (Jim Gao)</webMaster>
<copyright>在保留本文作者及本文链接的前提下，非商业用途随意转载分享。</copyright>
<lastBuildDate>""")
  fh.write(str(dt.datetime.now().strftime("%a, %d %b %Y %I:%M:%S +0800")))
  fh.write("""</lastBuildDate>
  <atom:link rel="self" type="application/rss+xml" href="https://www.yidajiabei.xyz/blog/index.xml"/>\n""")
  fh.writelines(itemLines[0:20])
  fh.write("""</channel>
</rss>""")
```

参考资料：

1.  <http://johnbokma.com/blog/2019/10/09/hand-coding-an-rss-2-0-feed-in-python.html>
2.  <http://johnbokma.com/blog/2019/10/09/rfc-822-and-rfc-3339-dates-in-python.html>