+++
title = "JavaScript 实现链表"
date = 2022-02-12T00:00:00+08:00
lastmod = 2022-02-12T21:30:23+08:00
tags = ["JavaScript", "技术"]
draft = false
+++

<https://www.freecodecamp.org/news/implementing-a-linked-list-in-javascript/>

```js
class ListNode {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}
class Linkedlist {
  constructor(head=null) {
    this.head = head;
  }
}

let node1 = new ListNode(2);
let node2 = new ListNode(5);
node1.next = node2;

let list = new Linkedlist(node1);

console.log(list.head.next.data)

size() {
  let count = 0;
  let node = this.head;
  while (node) {
    count++;
    node = node.next;
  }
  return count;
}

clear() {
  this.head = null;
}

getLast() {
  let lastNode = this.head;
  if (lastNode) {
    while (lastNode.next) {
      lastNode = lastNode.next;
    }
  }
  return lastNode;
}

getFirst() {
  return this.head;
}
```