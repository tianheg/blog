---
title: Firefox for Android 的 Secret Settings
status: draft
date: 2026-10-02T11:04:27+08:00
header: Tools
---

Firefox for Android（源码名 Fenix）里有一页隐藏的开发者开关：**Secret Settings**。里面全是 Mozilla 内部用来灰度、试验、调试的布尔开关——同一个版本号上，两个人看到的行数可能不一样（有些项只在 Nightly / Beta / Debug 渠道出现，另一些受 Nimbus 实验影响），也没有任何正式支持。

打开方式：设置 → 关于 Firefox → 连点 Firefox logo，直到出现 `Debug menu: (#) click(s) left to enable`，返回设置页就会多出 Secret Settings 与 Secret Debug Info。

本文条目取自 Firefox 源码（main 分支的 `SecretSettingsFragment.kt`、`secret_settings_preferences.xml`、`static_strings.xml`），不是从界面抄的：截图里的行会随渠道和实验变，源码才是全集。

## 页面结构

九個分类，另有顶栏一行与底部一个按钮：

- **Show debug info**（顶栏）——点开是调试信息面板（子页面）
- **Toolbar / Search / Homepage / Tabs / Network / Performance / Terms of Service / Features / Debug** —— 九个分类
- **Reset switches to defaults**（底部，紫色按钮）——把所有开关恢复默认

## Toolbar

- Use a minimal bottom toolbar while entering text in a website —— 网页里输入时收起底栏。源码里当前被强制隐藏（Bug 1943053 暂时禁用）
- Animate dynamic toolbars based on website scroll data —— 动态工具栏跟着页面滚动数据动
- Enable Custom Tab Extension List —— 自定义标签页扩展列表
- Enable Google Lens Integration —— Google Lens
- Show Voice Search in Display Toolbar —— 工具栏显示语音搜索
- Enable focus mode —— focus 模式下也显示工具栏
- Enable menu customization —— 菜单自定义

## Search

- Enable Firefox Suggest —— 地址栏搜索建议（带赞助项）。开关会连带启停后台的 suggestions 数据摄取任务
- Enable Remote Search Configuration (requires restart) —— 搜索引擎清单改从 Mozilla 的 Remote Settings 服务器同步，而不是只用客户端内置那份。现在默认走这条路
- Search Optimization Feature / …Flight cards / …Sport cards / …Stock cards —— 搜索优化卡片（航班/体育/股票）

## Homepage

- Enable Homepage as a New Tab —— 新标签页直接开首页
- Enable universal edge-to-edge wallpapers —— 壁纸铺满整屏（含状态栏区域）
- Enable Ads Client for Stories —— 首页 Stories 内容流的广告客户端
- Enable Private Mode and Stories Entry Point —— 私密模式与 Stories 的入口
- Enable Add Shortcuts Improvement —— 快捷方式管理的改进实现
- Enable Homepage Weather Widget —— 首页天气小组件
- Show More Shortcuts —— 首页显示更多快捷方式（默认只放一小排）
- Enable Homepage Customization —— 首页自定义（拖动/增删）
- Hide Collections UI —— 隐藏「集合」入口
- Migrate Collections to Tab Groups —— 把旧的 Collections 迁移成 Tab Groups。**涉及标签数据，别顺手打开**

## Tabs

- Enable Tab Manager opening animation —— 标签管理器打开动画，纯视觉
- Enable Tab Groups Drag and Drop —— 标签组拖放
- Enable Live Reorder for Drag and Drop —— 拖放时实时重排
- Enable Tab Groups Onboarding —— 标签组引导
- Enable Tab Groups Strip —— 标签组条
- Enable Tab Groups In Menu —— 菜单里显示标签组
- Enable tab reload cover —— 重载标签时先盖一层
- Enable scroll-aware capture (requires tab reload cover) —— 上面那层的滚动感知截图

## Network

- Enable DNS over HTTPS settings —— 把 DoH 的配置入口放回常规设置（不是直接开启 DoH，只是让那个设置项可见）
- Enable LNA blocking feature overall (required for anything LNA) —— Local Network Access 总开关，其他 LNA 项都依赖它
- Enable LNA request blocking —— 拦网页向本地网络发起的请求
- Enable LNA tracker blocking —— 拦 LNA 相关的跟踪

## Performance

- Enable Isolated Content Process (requires restart) —— 独立内容进程
- Enable Isolated Processes with Zygote Preloading (requires restart) —— 带 Zygote 预加载的独立进程（另需 Android 10+）
- Enable Power Saving Mode automatically (follows OS battery saver) —— 跟随系统的省电模式
- Enable Power Saving Mode manually —— 手动开省电模式

## Terms of Service

用来测条款流程的三个开关：标记 ToU 已接受、把「最新更新日期」改成现在（触发条款已更新的流程）、打开 30 秒倒计时。

## Features

- Use Nimbus Preview Collection (requires restart) —— 提前订阅尚未全量推送的 Nimbus 实验集合，等于自愿当实验对象
- Enable Address Sync for supported regions —— 地址（含电话/邮箱）同步
- Show onboarding on each app cold open —— 每次冷启动都重放引导
- Enable Native Android Share Sheet —— 用 Android 原生分享面板替代 Firefox 自绘的（**Android 14 以上才显示这一项**）
- Shake to summarize / Listen to page —— 摇一摇总结、朗读页面
- Enable Weekly Privacy Notification Feature / Force weekly privacy report notification trackers over threshold —— 每周隐私报告通知，以及强制触发它
- Enable Microsurvey Feature —— 应用内微调查
- Use third party CA certificates —— 除 Firefox 自带根证书库外，再信任 Android 系统 CA 库（含用户自己导入的证书）。给企业内网 PKI / 自签代理用；代价是信任集合变大，凡是系统信任的中间人证书都能解密你的 HTTPS。**保持关闭**
- Enable Import Bookmarks / Enable Import Passwords —— 从别的浏览器导入书签/密码，只在该项目的 Debug 渠道可见
- Enable Longfox —— 还在早期开发的实验功能，默认关。源码里有 peek animation 的显示计数与 game state；Bug 里明说是"悄悄开发、不让用户注意到"，后来又把开关暴露到所有渠道，好让被实验选中的人能关掉
- Enable IP Protection UI / Locations selection / Use GPI authentication —— 内置 VPN（IP Protection）的界面、地区选择与认证
- Show Archived Version Button On Error Pages —— 出错页给一个「看 Wayback 存档」按钮
- Enable Uninstall Survey —— 卸载后调查
- Show OLED Theme option —— 暴露纯黑 OLED 主题选项
- Use New PDF Tools —— 新的内置 PDF 工具
- Use new Account Settings UI —— 新版账户设置界面

## Debug

- Enable Debug Drawer —— 调试抽屉
- Enable New Crash Flow —— 新版崩溃处理界面
- Keep Debug Menu revealed —— 保持调试菜单常驻可见
- Never show Crash Pull —— 不再显示崩溃上报提示
- Custom Glean server URL (requires restart) —— 把遥测（Glean）上报指向自建服务器
- Remote Settings Server (requires restart) —— 点进去改 Remote Settings 的数据来源服务器

## 两个细节

**Reset 按钮不重置文本框类设置。** 它的确认弹窗写得很清楚：把所有开关恢复默认，但 Custom Glean Server 与 Remote Settings Server 不受影响——那两个不是开关，是子页面/文本框。

**只在 Nightly / Debug（部分含 Beta）才出现的项**：动态工具栏、自定义标签页扩展、Google Lens（含 Beta）、语音搜索、地址同步、Wayback 按钮、新标签页首页、标签组全套、LNA 三项、两个「独立进程」、IP Protection 成套、Shake to summarize、Listen to page、每周隐私通知、Terms of Service 三项、搜索优化（含 Beta）、Custom Glean server。「导入书签/密码」只在 Debug 渠道。Release 渠道能看到的其余项，就是普通实验开关——能开，但没人保证下个版本还在。

**开发构建的另一个口子**：debug 构建可以在 `local.properties` 里用 `secretSettings.<pref_key>=true|false` 预设这批开关，每次重编译都会重新应用（也就是说手动改过的这几项会被重置）。

## 哪些真值得开

- **Enable DNS over HTTPS settings** —— 想配加密 DNS，就靠它把入口露出来
- **Show OLED Theme option** —— 有 OLED 屏的话
- 其余保持默认。这页的定位是「给实验开的口子」，不是「隐藏的高级设置」，多开只会让浏览器行为和别人的不一样

## 参考

- [Debug settings menu instructions — Firefox Source Docs](https://firefox-source-docs.mozilla.org/mobile/android/fenix/Secret-settings-debug-menu-instructions.html)
- [SecretSettingsFragment.kt — mozilla-firefox/firefox](https://github.com/mozilla-firefox/firefox/blob/main/mobile/android/fenix/app/src/main/java/org/mozilla/fenix/settings/SecretSettingsFragment.kt)
- [secret_settings_preferences.xml — 页面上的分类与条目顺序](https://github.com/mozilla-firefox/firefox/blob/main/mobile/android/fenix/app/src/main/res/xml/secret_settings_preferences.xml)
- [static_strings.xml — 各项的界面文案](https://github.com/mozilla-firefox/firefox/blob/main/mobile/android/fenix/app/src/main/res/values/static_strings.xml)
- [Bug 2022529 — Add longfox secret setting](https://bugzilla.mozilla.org/show_bug.cgi?id=2022529)
- [Bug 2048200 — Expose longfox secret setting to all release types](https://github.com/mozilla-firefox/firefox/commit/44d22b4bad306c0db1c77ff474122e94a2a1f80e)
