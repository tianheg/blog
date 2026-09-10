---
title: '用三方的 AI API 服务商时，不确定是否是 OpenAI API 官方正版转发，还是 ChatGPT 逆向'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Programming
---

https://x.com/arvin17x/status/1819346887851626969

```bash
curl https://api.ohmygpt.com/v1/chat/completions \
-H "Content-Type: application/json" \
-H 'Authorization: Bearer XXX' \
-d '{
"messages": [
{
"role": "user",
"content": "写一个10个字的笑话"
}
],
"seed": 1,
"model": "gpt-4o-mini"
}'
```

标准答案，且不会变：为什么鱼不说话？因为它们水里！
