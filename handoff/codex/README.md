# Codex 工作包：博客角色素材（v3「羽之手帐」）

> 2026-10-28 重写；同日博客改为从零搭建的 v3「羽之手帐」（不再基于 Fuwari），交接路径不变。
> **v2 里 Codex 只做角色。** 背景、横幅、卡片、分隔线等界面全部由博客维护者设计和实现；v1 的背景图工作包和风格规范已移到 `archive/`，不要再看。

| 工作包 | 产出 | 说明文件 | 状态 |
| --- | --- | --- | --- |
| 04 光照版本 | 首页横幅立绘的日光版和夜间版 | `04-lighting.md` | 已完成 |
| 03 贴纸与图标 | 「读完啦」和 404 贴纸、Q 版头像、网站图标；另有可选表情 | `03-stickers.md` | **下一步** |
| 02 看板娘 | 分层角色素材 + 网页动画组件 | `02-live2d.md` | **暂停**：v3 左侧整栏常驻角色立绘，已经承担看板娘的作用；以后若要让立绘有呼吸、眨眼动画再启用 |

顺序：03 的 P0（`reading`、`lost`、`avatar`、4 个网站图标）→ 停下给我看 → 03 的 P1。

## 输入

`input/character/fullbody.png` 是角色基准图（透明底），色号在 `input/character/palette.md`，反面例子在 `input/style-refs/negative/`。所有角色素材的发色、瞳色、服装、饰品都以它为准。

## 授权

角色是 Kiwi Walks 的 Piyorita，**没有授权**，整个网站只在本机自用，不公开发布、不推送到公开仓库。如果以后要公开，所有角色素材都要换成原创角色。

## 你可以改的地方

| 路径 | 放什么 |
| --- | --- |
| `src/assets/stickers/` | Q 版贴纸 |
| `src/assets/images/avatar.webp` | Q 版头像 |
| `public/favicon/` | 网站图标 |
| `handoff/codex/work/` | 中间文件（草稿、提示词记录，不进网站） |
| `handoff/codex/REPORT.md` | 完成报告 |

## 不要改的地方

`src/layouts/`、`src/components/`、`src/pages/`、`src/styles/`、`src/scripts/`、`src/site.config.ts`、`astro.config.mjs`、`package.json`，以及 `handoff/codex/` 下除 `work/` 和 `REPORT.md` 以外的文件。需要改的写进 REPORT.md。

## 网站已经留好的位置

- **贴纸和头像**：文章末尾「读完啦」、404 页、关于页头像会自动读取上面的文件；文件不存在时显示占位记号（金色菱形）。
- **网站图标**：`public/favicon/` 里有 `favicon-32.png` 等文件时自动替换现有图标。
- 改完运行 `pnpm dev`，打开 http://localhost:4321 看效果。

## 验收

- `pnpm check:handoff`（可加 `-- --only stickers|icons|input`）：按 `manifest.json` 检查文件、尺寸、体积、透明通道。
- `pnpm build` 通过。
- 各工作包的「人工验收」逐条自查，结果写进 REPORT.md。
