// @ts-check
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs";

export default defineConfig({
	site: "https://your-domain.com",
	trailingSlash: "always",
	integrations: [sitemap()],
	markdown: {
		remarkPlugins: [remarkReadingTime],
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
