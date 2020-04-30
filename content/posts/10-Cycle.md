---
title: 10循环
toc: true
date: 2020-04-08T20:12:42+08:00
categories: ["技术"]
tags: ["循环", "Python"]
---

for ... in  while  break  continue

<!--more-->

#### for ... in

依次把list或tuple中的每个元素迭代出来

```
names = ['Michael', 'Bob', 'Tracy']
for name in names:
    print(name)
```

所以for x in ...循环就是把每个元素代入变量x，然后执行缩进块的语句。

```python
sum = 0
for x in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]:
    sum = sum + x
print(sum)
```

range()——生成整数序列

#### while

只要条件满足，就不断循环，条件不满足时退出循环

```python
sum = 0
n = 99
while n > 0:
    sum = sum + n
    n = n - 2
print(sum)
```

#### break

提前退出循环

```python
n = 1
while n <= 100:
    if n > 10: # 当n = 11时，条件满足，执行break语句
        break # break语句会结束当前循环
    print(n)
    n = n + 1
print('END')
```

#### continue

```python
n = 0
while n < 10:
    n = n + 1
    if n % 2 == 0: # 如果n是偶数，执行continue语句
        continue # continue语句会直接继续下一轮循环，后续的print()语句不会执行
    print(n)
```

注意：

要特别注意，不要滥用break和continue语句。break和continue会造成代码执行逻辑分叉过多，容易出错。大多数循环并不需要用到break和continue语句，上面的两个例子，都可以通过改写循环条件或者修改循环逻辑，去掉break和continue语句。

**参考资料**

https://www.liaoxuefeng.com/wiki/1016959663602400/1017100774566304