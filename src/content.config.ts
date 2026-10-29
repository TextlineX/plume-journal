import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const posts = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			published: z.coerce.date(),
			updated: z.coerce.date().optional(),
			draft: z.boolean().default(false),
			description: z.string().default(""),
			image: image().optional(),
			tags: z.array(z.string()).default([]),
			category: z.string().nullable().default(null),
			/** 置顶：首页目录排在最前，并标「置顶」 */
			pinned: z.boolean().default(false),
			/** 系列名：同名的文章会在文章页顶部互相链接 */
			series: z.string().optional(),
			/** 系列内顺序（不填按发布时间） */
			seriesOrder: z.number().optional(),
		}),
});

const pages = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
	schema: z.object({ title: z.string() }),
});

export const collections = { posts, pages };
