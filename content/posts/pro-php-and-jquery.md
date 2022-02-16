+++
title = "深入 PHP 与 jQuery 开发"
date = 2022-02-06T00:00:00+08:00
lastmod = 2022-02-16T15:31:27+08:00
tags = ["技术", "jQuery", "PHP"]
draft = false
+++

## 第三章：面向对象编程 {#第三章-面向对象编程}

面向对象编程（OOP）：充分利用代码，将实现同类功能的代码聚合在一起，组织成类。

不要重复自己（DRY，Don't repeat yourself）


### 对象和类 {#对象和类}

-   类的基础组成
-   对象和类各自特点
-   它们的用法


#### 类和对象的差异 {#类和对象的差异}

类，打个比方，就像房子的蓝图。它在纸上清晰地定义了房子的形状，定义了房子各个部分之间的关系，并且计划好了怎么盖，虽然还没盖。

对象就像依据蓝图造好的实实在在的房子。在对象中存储的数据就像组成房子的木头、电线和混凝土，在房子没盖起来之前，它们只是一堆东西。然而，当这些东西组装到一起，就成了一座结构完整且实用的房子。

**数据结构和行为组合到一起构成类，类使用这些信息生成对象。** 同一个类同一时间可生成很多对象，每个对象相对于其他对象都是独立的。

继续使用盖房子比喻，这类似于用同一张蓝图在一大块地上盖房子：150 套不同的住房，看起来相同，但住着不同的家庭，有着不同的装饰。


#### 创建类 {#创建类}

class ClassName


#### 定义类属性 {#定义类属性}

public $prop1 = "I'm a class property!";

箭头（-&gt;）是访问特定对象包含的属性或方法的一个面向对象构造。


#### 定义类方法 {#定义类方法}

方法是只属于某一类的函数。

OOP 使对象个体保持独立，代码的不同部分能很容易地分离成较小且相关的包。

PHP 还提供了一些特殊方法，简化代码（Magic methods are special methods which override PHP's default's action when certain actions are performed on an object.  from [Magic Methods - PHP Manual](https://www.php.net/manual/en/language.oop5.magic.php)）。

1.  构造函数和析构函数
2.  将类输出为字符串

__construct，\__destruct，unset，\__toString


#### 使用类继承 {#使用类继承}

使用 extends 关键字，一个类能够从其他的类继承方法和属性。

1.  覆盖继承来的属性和方法
2.  覆盖时保留被覆盖方法的功能


#### 指定属性或方法的可见度 {#指定属性或方法的可见度}

三个可见度关键字：public（公开的），protected（受保护的），private（私有的）

还有一种可见度：static（静态的），静态的方法和属性无需创建类的实例就可以访问。

为什么没有思考？


#### 文档块注释 {#文档块注释}

```php
/**
 *
 * @author Jim Gao <me@yidajiabei.xyz>
 * @copyright 2022 Jim Gao
 * @license link
 * @var
 * @param
 * @return
 */
```


### 面向对象与面向过程的差异 {#面向对象与面向过程的差异}

为什么在大项目中，采用面向对象方法？

1.  容易实现
2.  更好的组织
3.  更容易维护

面向过程：

```php
<?php

function changeJob($person, $newjob)
{
  $person['job'] = $newjob;
  return $person;
}

function happyBirthday($person)
{
  ++$person['age'];
  return $person;
}

$person1 = array(
  'name' => 'Tom',
  'job' => 'Button-Pusher',
  'age' => 34
);

$person2 = array(
  'name' => 'John',
  'job' => 'Lever-Pusher',
  'age' => 42
);

echo "<pre>Person 1: ", print_r($person1, TRUE), "</pre>";
echo "<pre>Person 2: ", print_r($person2, TRUE), "</pre>";

$person1 = changeJob($person1, 'Box-Mover');
$person1 = happyBirthday($person1);

$person2 = happyBirthday($person2);

echo "<pre>Person 1: ", print_r($person1, TRUE), "</pre>";
echo "<pre>Person 2: ", print_r($person2, TRUE), "</pre>";
```

面向对象：

```php
<?php

class Person
{
  private $_name;
  private $_job;
  private $_age;

  public function __construct($name, $job, $age)
  {
    $this->_name = $name;
    $this->_job = $job;
    $this->_age = $age;
  }

  public function changeJob($newjob)
  {
    $this->_job = $newjob;
  }

  public function happyBirthday()
  {
    ++$this->_age;
  }
}

$person1 = new Person("Tom", "Button-Pusher", 34);
$person2 = new Person("John", "Lever Puller", 41);

echo "<pre>Person 1: ", print_r($person1, TRUE), "</pre>";
echo "<pre>Person 2: ", print_r($person2, TRUE), "</pre>";

$person1->changeJob('Box-Mover');
$person1->happyBirthday();
$person2->happyBirthday();

echo "<pre>Person 1: ", print_r($person1, TRUE), "</pre>";
echo "<pre>Person 2: ", print_r($person2, TRUE), "</pre>";
```


## 第四章：构建活动日程表 {#第四章-构建活动日程表}


### 规划设计 {#规划设计}

由数据库 MySQL 驱动，先定义数据库结构，后规划网站地图（如何从数据库中获取数据和修改数据）。


#### 定义数据库结构 {#定义数据库结构}

对于一个活动日程表来说，需要存储的信息：

-   event_id 一个自增长整数，每个活动用该整数唯一标识
-   event_title 活动标题
-   event_desc 活动详情
-   event_start 活动开始时间 格式为：YYYY-MM-DD HH:MM:SS
-   event_end 活动结束时间 格式同开始时间


#### 创建类映射 {#创建类映射}

主类 Calendar，负责处理与活动日程表有关的所有行为。方法和属性规划：

-   构造函数
    -   保证数据库连接。若未连接，就创建一个连接
    -   设定以下基本属性：数据库对象
    -   显示当前日期，显示当前月份
    -   显示当前年份
    -   这个月有多少天，这个月的起始日是星期几
-   生成活动表单 HTML
    -   检查时候正在修改或创建活动
    -   如果是修改活动，把活动数据载入表单
-   对用户输入进行安全处理后，将新活动保存到数据库
-   从数据库删除活动并请求用户确认
-   载入活动数据
    -   从数据库载入活动数据
    -   将指定月份的每个活动按日期保存到一个数组中
-   输出日历信息 HTML。循环活动数据数组，并附加相应的标题及时间
-   用 HTML 显示活动数据并允许通过活动 ID 载入活动描述和详情


#### 规划项目的目录结构 {#规划项目的目录结构}

出于安全考虑，不要把私密数据放在网站根目录或是公开目录中，其中包括数据库配置文件、程序内核，以及网站运行所需的各个类。

需要两个目录：一个公开目录（public），存放供用户直接访问的文件，比如页面、CSS 文件、JavaScript 脚本等；一个是系统目录（sys），存放不易公开的文件，比如数据库账号密码，一些类文件和核心 PHP 文件。