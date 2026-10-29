# 羽之手帐 · Plume Journal

个人博客，Astro 5 从零搭建，版式和视觉为这个站单独设计（不基于任何现成主题）。


## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 本地开发，打开 http://localhost:4321 |
| `pnpm build` | 构建到 `dist/`，并生成搜索索引（搜索只在构建后可用） |
| `pnpm preview` | 预览构建结果 |
| `pnpm new-post my-slug` | 新建一篇草稿 |
| `pnpm check:handoff` | 检查 Codex 交付的角色素材（见 `handoff/codex/`） |

## 改哪里

- **站名、简介、导航、歌单、许可**：`src/site.config.ts`
- **文章**：`src/content/posts/*.md`（frontmatter：title、published、description、tags、category、image、draft）
- **关于页正文**：`src/content/pages/about.md`
- **项目 / 相册 / 友链数据**：`src/data/`
- **角色立绘**：`src/assets/character/day.png`（浅色）、`night.png`（深色），透明底；裁切位置在 `site.config.ts` 的 `character.focusX / focusY`
- **Q 版贴纸**：放进 `src/assets/stickers/reading.webp`、`lost.webp`，`src/assets/images/avatar.webp`，重新构建即自动替换占位
- **设计 token**：`src/styles/tokens.css`（颜色、字号阶梯、间距、动效，均附对比度实测值）

## 结构

```
[角色栏 | 竖排索引签 | 内容]
```

- 角色栏和音乐、搜索在换页时保留（Astro ClientRouter + transition:persist），换页只有内容区过渡，音乐不断。
- 首页、归档、项目等用宽角色栏；文章页、关于页自动收窄角色栏，把宽度让给正文和页边目录。
- < 1024 px：角色栏和索引签收起，换成顶栏；首页顶部显示带蕾丝下边的立绘封面。
