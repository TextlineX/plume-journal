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
		}),
});

const pages = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
	schema: z.object({ title: z.string() }),
});

export const collections = { posts, pages };
