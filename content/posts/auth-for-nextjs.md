+++
title = "为 Next.js 应用添加授权"
date = 2022-04-27T11:16:00+08:00
lastmod = 2022-04-27T13:40:25+08:00
tags = ["技术", "Auth"]
draft = false
+++

模板仓库： [`nextauthjs/next-auth-example`](https://github.com/nextauthjs/next-auth-example/tree/5088c786ba4c9f79bf23a1bff09da679afef8014) 。

我进行的修改：

`package.json` :

```json
{
  "dependencies": {
    "@next-auth/upstash-redis-adapter": "^3.0.0",
    "@upstash/redis": "^1.3.1",
    "dotenv": "^16.0.0",
    "next-auth": "^4.3.3"
  },
  "devDependencies": {
    "@prisma/client": "2.16.1"
  }
}
```

`pages/api/auth/[...nextauth].ts` :

```ts
import NextAuth from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import GithubProvider from 'next-auth/providers/github'
import { UpstashRedisAdapter } from '@next-auth/upstash-redis-adapter'
import { Redis } from '@upstash/redis'

require('dotenv').config()
const redis = Redis.fromEnv()

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export default NextAuth({
  // https://next-auth.js.org/configuration/providers/oauth
  adapter: UpstashRedisAdapter(redis),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Auth0Provider({
      clientId: process.env.AUTH0_ID,
      clientSecret: process.env.AUTH0_SECRET,
      issuer: process.env.AUTH0_ISSUER,
    }),
  ],
  theme: {
    colorScheme: 'light',
  },
  callbacks: {
    async jwt({ token }) {
      token.userRole = 'admin'
      return token
    },
  },
})
```

`.env` :

```env
NEXTAUTH_URL=
NEXTAUTH_SECRET= # Linux: `openssl rand -hex 32` or go to https://generate-secret.now.sh/32

GITHUB_ID=
GITHUB_SECRET=

EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_FROM=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## 需要准备 {#需要准备}

1.  在 [这里](https://github.com/settings/apps) 新建 GitHub App，填写 `Callback URL` （这是你安装 App 后重定向的网址，一般是你登陆站点的首页/控制面板）并勾选 `Request user authorization (OAuth) during installation` ，其他根据你的需求选择。这一步获取 `GITHUB_ID` ， `GITHUB_SECRET` ；
2.  在 [Mailgun](https://www.mailgun.com/)（我使用的邮件服务）中的 Dashboard/Sending/Domain settings 下找到 SMTP credentials，点击 `Add new SMTP user` ，输入你想发送验证邮件的邮箱，比如 `noreply@example.com` ，然后得到密码。这一步获取 `EMAIL_SERVER_USER` 、 `EMAIL_SERVER_PASSWORD` 、 `EMAIL_FROM` ， `EMAIL_SERVER_HOST` 和 `EMAIL_SERVER_PORT` 可在当前新建用户页面找到；
3.  在 [Upstash](https://upstash.com/)（提供 Redis 存储服务）中可得到 `UPSTASH_REDIS_REST_URL` ， `UPSTASH_REDIS_REST_TOKEN` 。
