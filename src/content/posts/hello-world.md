---
title: 你好，世界
published: 2026-10-27
description: "博客开张的第一篇文章，顺便记录一下这个站是怎么搭起来的。"
tags: ["博客", "Astro"]
category: 随笔
draft: false
---

这个博客用 [Astro](https://astro.build/) 搭建，版式是自己设计的，后面会慢慢补内容。

## 怎么写文章

在项目里运行：

```bash
pnpm new-post my-first-post
```

会在 `src/content/posts/` 下生成一个带 front-matter 的 Markdown 文件，改好标题、标签和分类就可以发布。

## 接下来

- 把站点名称、头像和简介换成自己的
- 配置评论、统计等扩展功能
- 继续魔改主题组件
