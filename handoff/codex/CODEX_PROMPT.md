# 发给 Codex 的启动指令

> 用法：在博客项目根目录打开 Codex，把下面分隔线之间的内容整段发给它。

---

你在一个 Astro 个人博客项目里工作，负责制作角色素材。界面和背景已经做好了，你只做角色，不要画背景，也不要改界面代码。

先完整读完这些文件，再开始动手：

1. `handoff/codex/README.md`（总览、可以改和不能改的路径、授权说明）
2. `handoff/codex/input/README.md`、`input/character/palette.md`，并打开 `input/character/fullbody.png` 看清角色
3. `handoff/codex/03-stickers.md`（这次的任务）
4. `handoff/codex/manifest.json`（每个文件的路径、尺寸、体积上限）

规则：

- 角色以 `input/character/fullbody.png` 为准，发色、瞳色、服装、饰品不能改。
- 素材必须用图像生成或图像编辑模型制作。环境里没有可用的图像生成能力时，立刻停下告诉我缺什么，不要用程序画的图形冒充。
- 输出直接是**透明背景**。做不到透明时用纯色 #CFCFD4 平涂背景，并在 REPORT.md 里说明，由我来抠图。
- 不加背景、文字、光晕、粒子。
- 只在 README「你可以改的地方」列出的路径里新增或修改文件。
- 先做 03 的 P0：`reading`、`lost`、`avatar` 和 4 个网站图标。做完运行 `pnpm check:handoff -- --only stickers`、`pnpm check:handoff -- --only icons` 和 `pnpm build`，然后**停下**，把图给我确认，我同意后再做 P1。
- 做完后在 `handoff/codex/REPORT.md` 里写清楚：做了哪些文件、用了什么模型和工具、哪些验收项没达到、需要我决定的事。

---
