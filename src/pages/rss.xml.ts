import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPosts, postUrl } from "../lib/posts";
import { site } from "../site.config";

export async function GET(context: APIContext) {
	const posts = (await getPosts()).filter((p) => !p.data.draft);
	return rss({
		title: site.title,
		description: site.subtitle,
		site: context.site!,
		items: posts.map((p) => ({
			title: p.data.title,
			pubDate: p.data.published,
			description: p.data.description,
			categories: [p.data.category, ...p.data.tags].filter(Boolean) as string[],
			link: postUrl(p),
		})),
		customData: `<language>${site.lang}</language>`,
	});
}
