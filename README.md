# 羽之手帐 · Plume Journal

个人博客，Astro 5 从零搭建，版式和视觉为这个站单独设计（不基于任何现成主题）。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 本地开发，打开 http://localhost:4321（草稿可见） |
| `pnpm build` | 构建到 `dist/`，同时生成搜索索引和分享卡片 |
| `pnpm build:drafts` | 草稿预览构建：草稿也生成页面（带 noindex），用于预览部署 |
| `pnpm preview` | 预览构建结果（搜索只在构建后可用） |
| `pnpm deploy` | 构建并用 wrangler 部署到 Cloudflare |
| `pnpm new-post my-slug` | 新建一篇草稿 |
| `pnpm check:handoff` | 检查 Codex 交付的角色素材（见 `handoff/codex/`） |

## 写文章

文章放在 `src/content/posts/`，frontmatter 字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 标题 |
| `published` | 是 | 发布日期，如 `2026-10-28` |
| `updated` | | 更新日期。填了会在目录、文章页显示「更新于」，首页页边栏列入「最近修订」 |
| `description` | | 摘要，显示在目录和分享卡片上 |
| `category` | | 分类（一个） |
| `tags` | | 标签（数组） |
| `image` | | 封面图，相对路径，如 `./cover.jpg` |
| `pinned` | | `true` 时首页置顶，并标「置顶」 |
| `series` | | 系列名。同名文章在文章页顶部互相链接，并有 `/series/<名字>/` 页面 |
| `seriesOrder` | | 系列内顺序（不填按发布时间） |
| `draft` | | `true` 时只在 `pnpm dev` 和 `pnpm build:drafts` 里出现，不占编号、不进 RSS |

正文里：h2 / h3 悬停会出现 `#` 锚点；站外链接自动在新标签页打开；图片可点击放大。

## 改哪里

- **站名、简介、导航、歌单、评论、许可**：`src/site.config.ts`
- **关于页正文**：`src/content/pages/about.md`
- **项目 / 相册 / 友链数据**：`src/data/`（项目、相册为空时导航里自动隐藏对应页签）
- **角色立绘**：`src/assets/character/day.png`（浅色）、`night.png`（深色），透明底；裁切位置在 `site.config.ts` 的 `character.focusX / focusY`
- **Q 版贴纸**：放进 `src/assets/stickers/reading.webp`、`lost.webp`、`empty.webp`，`src/assets/images/avatar.webp`，重新构建即自动替换占位
- **设计 token**：`src/styles/tokens.css`（颜色、字号阶梯、间距、动效；附对比度实测值；1800 / 2400 px 两档大屏字号）

## 评论（giscus）

1. 准备一个**公开**仓库，开启 Discussions，安装 [giscus App](https://github.com/apps/giscus)。
2. 打开 https://giscus.app ，填仓库，选 Discussion 分类（推荐 Announcements）。
3. 把页面生成的 `data-repo`、`data-repo-id`、`data-category`、`data-category-id` 抄到 `src/site.config.ts` 的 `comments`。

评论区滚动到附近才加载；主题跟随站点深浅模式，线上使用 `public/giscus/` 里的薰衣草主题（`public/_headers` 已为它加跨域头）。

## 部署（Cloudflare Workers）

配置在 `wrangler.toml`。Workers Builds 后台：

- **Build command**：`pnpm run build`（搜索索引和分享卡片都在 `astro build` 流程里生成，填 `npx astro build` 也不会漏）
- **Deploy command**：`npx wrangler deploy`
- Node 版本读 `.node-version`，pnpm 版本读 `package.json` 的 `packageManager`

`public/_headers` 设置了缓存：`/_astro/*` 长期缓存，搜索索引 1 小时。

## 结构与性能

```
[角色栏 | 竖排索引签 | 内容]
```

- 角色栏、音乐、搜索在换页时保留（Astro ClientRouter + `transition:persist`），换页只有内容区淡出淡入，音乐不断。
- 首页、归档等用宽角色栏；文章页、关于页自动收窄，把宽度让给正文和页边目录。≥ 1600 px 版心居中，首页右侧出现页边栏。
- < 1024 px：角色栏和索引签收起，换成顶栏；首页顶部显示带蕾丝下边的立绘封面。

性能上做过的取舍（实测见提交记录）：

- 路由不调用浏览器的 View Transition 整页快照（单帧 115–150 ms 的主要来源），改由 CSS 动画淡入内容区。
- 正文用系统黑体；标题宋体只加载一个字重，构建后按全站实际用字裁掉不需要的分片（`src/integrations/prune-font-faces.mjs`）。字体 CSS 从 428 KB / 420 条规则降到约 45 KB / 20 条。
- 4× CPU 降速下，换页最慢一帧从约 220 ms 降到约 100 ms，渲染帧数约翻倍；滚动与原来持平。
