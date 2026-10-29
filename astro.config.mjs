// @ts-check
import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import pagefindIndex from "./src/integrations/pagefind.mjs";
import pruneFontFaces from "./src/integrations/prune-font-faces.mjs";
import { rehypeProse } from "./src/plugins/rehype-prose.mjs";
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs";

export default defineConfig({
	site: "https://blog.textline.top",
	trailingSlash: "always",
	integrations: [sitemap(), pruneFontFaces(), pagefindIndex()],
	markdown: {
		remarkPlugins: [remarkReadingTime],
		// 先生成标题 id（Astro 默认在用户插件之后才生成），再加锚点和外链处理
		rehypePlugins: [rehypeHeadingIds, [rehypeProse, { siteHost: "blog.textline.top" }]],
		shikiConfig: {
			// 深浅两套代码配色，由 CSS 变量切换（见 src/styles/prose.css）
			themes: { light: "github-light", dark: "github-dark-dimmed" },
			defaultColor: false,
			wrap: false,
		},
	},
	prefetch: { prefetchAll: true, defaultStrategy: "hover" },
	vite: { build: { assetsInlineLimit: 0 } },
});
