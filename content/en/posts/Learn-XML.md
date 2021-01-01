---
title: Learn XML
date: 2020-06-10T08:48:56+08:00
tags: ["xml","测试"]
slug: learn xml
---

## Introduction to XML

{{<notice notice-info>}}

XML stands for  eXtensible Markup Language.

XML was designed to store and transport data.

XML was designed to be both human-readable and machine-readable.

{{</notice>}}

### What is XML?

* XML stands for eXtensible Markup Language
* XML is a markup language much like HTML
* XML was designed to store and transport data
* XML was designed to be self-descriptive
* XML is a W3C Recommendation

### XML Does Not DO Anything

This note is a note to Tove from Jani, stored as XML:

```xml
<note>
    <to>Tove</to>
    <from>Jani</from>
    <heading>Reminder</heading>
    <body>Don't forget me this weekend!</body>
</note>
```

But still, the XML above does not DO anything. XML is just information wrapped in tags.

Someone must write a piece of software to send, receive, store, or display it:

<div  class="mytag">
<h2 style="margin:25px">Note</h2>
<p style="margin:25px">
To: Tove</br>
From: Jani</p>
<h3 style="margin:25px">Reminder</h3>
<p style="margin:25px">Don't forget me this weekend!</p>
</div>

### The Difference Between XML and HTML

XML and HTML were designed with different goals:

* XML was designed to carry data - with focus on what data is
* HTML was designed to display data - with focus on how data looks
* XML tags are not predefined like HTML tags are

### XML Does Not Use Predefined Tags

The XML language has no predefined tags.

The tags in the example above (like `<to>` and `<from>`) are not defined in any XML standard. These tags are "invented" by the author of the XML document.

HTML works with predefined tags like `<p>`, `<h1>`, `<table>`, etc.

With XML, the author must define both the tags and the document structure.

### XML is Extensible

Most XML applications will work as expected even if new data is added (or removed).

Imagine an application designed to display the original version of note.xml (`<to> <from> <heading> <body>`).

Then imagine a newer version of note.xml with added `<date>` and `<hour>` elements, and a removed `<heading>`.

The way XML is constructed, older version of the application can still work:

```xml
<note>
  <date>2015-09-01</date>
  <hour>08:30</hour>
  <to>Tove</to>
  <from>Jani</from>
  <body>Don't forget me this weekend!</body>
</note>
```

### XML Simplifies Things

* It simplifies data sharing
* It simplifies data transport
* It simplifies platform changes
* It simplifies data availability

Many computer systems contain data in incompatible formats. Exchanging data between incompatible systems (or upgraded systems) is a time-consuming task for web developers. Large amounts of data must be converted, and incompatible data is often lost.

XML stores data in plain text format. This provides a software- and hardware-independent way of storing, transporting, and sharing data.

XML also makes it easier to expand or upgrade to new operating systems, new applications, or new browsers, without losing data.

With XML, data can be available to all kinds of "reading machines" like people, computers, voice machines, news feeds, etc.

### XML is a W3C Recommendation

XML became a W3C Recommendation as early as in February 1998.

## How Can XML be Used?

XML is used in many aspects of web development.

XML is often used to separate data from presentation.

### XML Separates Data from Presentation

XML does not carry any information about how to be displayed.

The same XML data can be used in many different presentation scenarios.

Because of this, with XML, there is a full separation between data and presentation.

### XML is Often a Complement to HTML

In many HTML applications, XML is used to store or transport data, while HTML is used to format and display the same data.

### XML Separates Data from HTML

When displaying data in HTML, you should not have to edit the HTML file when the data changes.

With XML, the data can be stored in separate XML files.

With a few lines of JavaScript code, you can read an XML file and update the data content of any HTML page.

#### Books.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bookstore>

	<book category="cooking">
    	<title lang="en">Everyday Italian</title>
    	<author>Giada De laurentiis</author>
    	<year>2005</year>
    	<price>30.00</price>
    </book>

	<book category="cooking">
    	<title lang="en">Everyday Italian</title>
    	<author>Giada De laurentiis</author>
    	<year>2005</year>
    	<price>30.00</price>
    </book>
</bookstore>
```

### Transaction Data

Thousands of XML formats exists, in many different industries, to describe day-to-day data transactions:

* Stocks and Shares
* Financial transactions
* Medical data
* Mathematical data
* Scientific measurements
* News information
* Weather services

### Example: XML News

**XMLNews is a specification for exchanging news and other information.**

Using a standard makes it easier for both news producers and news consumers to produce, receive, and archive any kind of news information across different hardware, software, and programming languages.

An example XMLNews document:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<nitf>
  <head>
    <title>Colombia Earthquake</title>
  </head>
  <body>
    <headline>
      <hl1>143 Dead in Colombia Earthquake</hl1>
    </headline>
    <byline>
      <bytag>By Jared Kotler, Associated Press Writer</bytag>
    </byline>
    <dateline>
      <location>Bogota, Colombia</location>
      <date>Monday January 25 1999 7:28 ET</date>
    </dateline>
  </body>
</nitf>
```

### Example: XML Weather Service

An XML national weather service from NOAA (National Oceanic and Atmospheric Administration):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<current_observation>

<credit>NOAA's National Weather Service</credit>
<credit_URL>http://weather.gov/</credit_URL>

<image>
  <url>http://weather.gov/images/xml_logo.gif</url>
  <title>NOAA's National Weather Service</title>
  <link>http://weather.gov</link>
</image>

<location>New York/John F. Kennedy Intl Airport, NY</location>
<station_id>KJFK</station_id>
<latitude>40.66</latitude>
<longitude>-73.78</longitude>
<observation_time_rfc822>Mon, 11 Feb 2008 06:51:00 -0500 EST
</observation_time_rfc822>

<weather>A Few Clouds</weather>
<temp_f>11</temp_f>
<temp_c>-12</temp_c>
<relative_humidity>36</relative_humidity>
<wind_dir>West</wind_dir>
<wind_degrees>280</wind_degrees>
<wind_mph>18.4</wind_mph>
<wind_gust_mph>29</wind_gust_mph>
<pressure_mb>1023.6</pressure_mb>
<pressure_in>30.23</pressure_in>
<dewpoint_f>-11</dewpoint_f>
<dewpoint_c>-24</dewpoint_c>
<windchill_f>-7</windchill_f>
<windchill_c>-22</windchill_c>
<visibility_mi>10.00</visibility_mi>

<icon_url_base>http://weather.gov/weather/images/fcicons/</icon_url_base>
<icon_url_name>nfew.jpg</icon_url_name>
<disclaimer_url>http://weather.gov/disclaimer.html</disclaimer_url>
<copyright_url>http://weather.gov/disclaimer.html</copyright_url>

</current_observation>
```

## XML Tree

XML documents form a tree structure that starts at "the root" and branches to "the leaves".

![](https://raw.githubusercontent.com/Gaotianhe/cloudimg/master/img/learn-xml-nodetree.jpg "XML Tree Structure")

### An Example XML Document

The image above represents books in this XML:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="cooking">
    <title lang="en">Everyday Italian</title>
    <author>Giada De Laurentiis</author>
    <year>2005</year>
    <price>30.00</price>
  </book>
  <book category="children">
    <title lang="en">Harry Potter</title>
    <author>J K. Rowling</author>
    <year>2005</year>
    <price>29.99</price>
  </book>
  <book category="web">
    <title lang="en">Learning XML</title>
    <author>Erik T. Ray</author>
    <year>2003</year>
    <price>39.95</price>
  </book>
</bookstore>
```

### XML Tree Structure

XML documents are formed as **element trees**.

An XML tree starts at a **root element** and branches from the root to **child elements**.

All elements can have sub elements (child elements):

```xml
<root>
  <child>
    <subchild>.....</subchild>
  </child>
</root>
```

The terms parent, child, and sibling are used to describe the relationships between elements.

Parents have children. Children have parents. Siblings are children on the same level (brothers and sisters).

All elements can have text content (Harry Potter) and attributes (category="cooking").

### Self-Describing Syntax

XML uses a much self-describing syntax.

A prolog defines the XML version and the character encoding:

```xml
<?xml version="1.0" encoding="UTF-8"?>
```

The next line is the **root element** of the document:

```xml
<bookstore>
```

The next line starts a `<book>` element:

```xml
<book category="cooking">
```

The `<book>` elements have **4 child elements**: `<title>`, `<author>`, `<year>`, `<price>`.

```xml
<title lang="en">Everyday Italian</title>
<author>Giada De Laurentiis</author>
<year>2005</year>
<price>30.00</price>
```

The next line ends the book element:

```xml
</book>
```

You can assume, from this example, that the XML document contains information about books in a bookstore.

## XML Syntax Rules

The syntax rules of XML are very simple and logical. The rules are easy to learn, and easy to use.

### XML Documents Must Have a Root Element

XML documents must contain one **root** element that is the **parent** of all other elements:

```xml
<root>
  <child>
    <subchild>.....</subchild>
  </child>
</root>
```

In this example `<note>` is the root element:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<note>
  <to>Tove</to>
  <from>Jani</from>
  <heading>Reminder</heading>
  <body>Don't forget me this weekend!</body>
</note>
```

### The XML Prolog

This line is called the XML **prolog**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
```

<mark>The XML prolog is optional. If it exists, it must come first in the document.</mark>

XML documents can contain international characters, like Norwegian øæå or French êèé.

To avoid errors, you should specify the encoding used, or save your XML files as UTF-8.

UTF-8 is the default character encoding for XML documents.

Character encoding can be studied in our [Character Set Tutorial](https://www.w3schools.com/charsets/default.asp).

{{<notice notice-note>}}

UTF-8 is also the default encoding for HTML5, CSS, JavaScript, PHP, and SQL.

{{</notice>}}

### All XML Elements Must Have a Closing Tag

In XML, it is illegal to omit the closing tag. All elements **must** have a closing tag:

```xml
<p>This is a paragraph.</p>
<br />
```

{{<notice notice-note>}}

The XML prolog does not have a closing tag! This is not an error. The prolog is not a part of the XML document.

{{</notice>}}

### XML Tags are Case Sensitive

XML tags are case sensitive. The tag `<Letter>` is different from the tag `<letter>`.

Opening and closing tags must be written with the same case:

```xml
<message>This is correct</message>
```

"Opening and closing tags" are often referred to as "Start and end tags". Use whatever you prefer. It is exactly the same thing.

### XML Elements Must be Properly Nested

In HTML, you might see improperly nested elements:

```html
<b><i>This text is bold and italic</b></i>
```

In XML, all elements **must** be properly nested within each other:

```xml
<b><i>This text is bold and italic</i></b>
```

In the example above, "Properly nested" simply means that since the `<i>` element is opened inside the `<b>` element, it must be closed inside the `<b>` element.

### XML Attribute Values Must Always be Quoted

XML elements can have attributes in name/value pairs just like in HTML.

In XML, the attribute values must always be quoted:

```xml
<note date="12/11/2007">
  <to>Tove</to>
  <from>Jani</from>
</note>
```

### Entity References

Some characters have a special meaning in XML.

If you place a character like "<" inside an XML element, it will generate an error because the parser interprets it as the start of a new element.

This will generate an XML error:

```xml
<message>salary < 1000</message>
```

To avoid this error, replace the "<" character with an **entity reference**:

```xml
<message>salary &lt; 1000</message>
```

There are 5 pre-defined entity references in XML:

| Source Code | Display |    Meaning     |
| :---------: | :-----: | :------------: |
|   `&lt;`    |    <    |   less than    |
|   `&gt;`    |    >    |  greater than  |
|   `&amp;`   |    &    |   ampersand    |
|  `&apos;`   |    '    |   apostrophe   |
|  `&quot;`   |    "    | quotation mark |

{{<notice notice-tip>}}

Only < and & are strictly illegal in XML, but it is a good habit to replace > with &gt; as well.

{{</notice>}}

### Comments in XML

The syntax for writing comments in XML is similar to that of HTML:

```xml
<!-- This is a comment -->
```

Two dashes in the middle of a comment are not allowed:

```xml
<!-- This is an invalid -- comment -->
```

### White-space is Preserved in XML

XML does not truncate multiple white-spaces (HTML truncates multiple white-spaces to one single white-space):

|       |                 |
| ----- | --------------- |
| XML | Hello      Tove |
| HTML: | Hello Tove      |

### XML Stores New Line as LF

Windows applications store a new line as: carriage return and line feed (CR+LF).

Unix and Mac OSX use LF.

Old Mac systems use CR.

XML stores a new line as LF.

### Well Formed XML

XML documents that conform to the syntax rules above are said to be "Well Formed" XML documents.

## XML Elements

An XML document contains XML Elements.

### What is an XML Element?

An XML element is everything from (including) the element's start tag to (including) the element's end tag.

```xml
<price>29.99</price>
```

An element can contain:

* text
* attributes
* other elements
* or a mix of the above

```xml
<bookstore>
  <book category="children">
    <title>Harry Potter</title>
    <author>J K. Rowling</author>
    <year>2005</year>
    <price>29.99</price>
  </book>
  <book category="web">
    <title>Learning XML</title>
    <author>Erik T. Ray</author>
    <year>2003</year>
    <price>39.95</price>
  </book>
</bookstore>
```

In the example above:

`<title>`, `<author>`, `<year>`, and `<price>` have **text content** because they contain text (like 29.99).

`<bookstore>` and `<book>` have **element contents**, because they contain elements.

`<book>` has an **attribute** (category="children").

### Empty XML Elements

An element with no content is said to be empty.

In XML, you can indicate an empty element like this:

```xml
<element></element>
```

You can also use a so called self-closing tag:

```xml
<element />
```

The two forms produce identical results in XML software (Readers, Parsers, Browsers).

{{<notice notice-note>}}

Empty elements can have attributes.

{{</notice>}}

### XML Naming Rules

XML elements must follow these naming rules:

* Element names are case-sensitive
* Element names must start with a letter or underscore
* Element names cannot start with the letters xml (or XML, or Xml, etc)
* Element names can contain letters, digits, hyphens, underscores, and periods
* Element names cannot contain spaces

Any name can be used, no words are reserved (except xml).

### Best Naming Practices

Create descriptive names, like this: `<person>, <firstname>, <lastname>`.

Create short and simple names, like this: <book_title> not like this: <the_title_of_the_book>.

Avoid "-". If you name something "first-name", some software may think you want to subtract "name" from "first".

Avoid ".". If you name something "first.name", some software may think that "name" is a property of the object "first".

Avoid ":". Colons are reserved for namespaces (more later).

Non-English letters like éòá are perfectly legal in XML, but watch out for problems if your software doesn't support them.

### Naming Styles

There are no naming styles defined for XML elements. But here are some commonly used:

| Style       | Example        | Description                                          |
| :---------- | :------------- | :--------------------------------------------------- |
| Lower case  | `<firstname>`  | All letters lower case                               |
| Upper case  | `<FIRSTNAME>`  | All letters upper case                               |
| Underscore  | `<first_name>` | Underscore separates words                           |
| Pascal case | `<FirstName>`  | Uppercase first letter in each word                  |
| Camel case  | `<firstName>`  | Uppercase first letter in each word except the first |

If you choose a naming style, it is good to be consistent!

XML documents often have a corresponding database. A common practice is to use the naming rules of the database for the XML elements.

{{<notice notice-note>}}

Camel case is a common naming rule in JavaScripts.

{{</notice>}}

### XML Elements are Extensible

XML elements can be extended to carry more information.

Look at the following XML example:

```xml
<note>
  <to>Tove</to>
  <from>Jani</from>
  <body>Don't forget me this weekend!</body>
</note>
```

Let's imagine that we created an application that extracted the `<to>`, `<from>`, and `<body>` elements from the XML document to produce this output:

https://www.w3schools.com/xml/xml_elements.asp

Imagine that the author of the XML document added some extra information to it:

```xml
<note>
  <date>2008-01-10</date>
  <to>Tove</to>
  <from>Jani</from>
  <heading>Reminder</heading>
  <body>Don't forget me this weekend!</body>
</note>
```

Should the application break or crash?

No. The application should still be able to find the `<to>`, `<from>`, and `<body>` elements in the XML document and produce the same output.

This is one of the beauties of XML. It can be extended without breaking applications.

### XML Attributes

