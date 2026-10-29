// 分享卡片：/og/index.png（首页及其他页面）和 /og/posts/<slug>.png（每篇文章）
import type { APIRoute } from "astro";
import { fmtDate, getPosts, pad } from "../../lib/posts";
import { renderCard } from "../../lib/og";
import { site } from "../../site.config";

export async function getStaticPaths() {
	const posts = await getPosts();
	return [
		{ params: { slug: "index" }, props: { kind: "home" as const } },
		...posts.map((p) => ({ params: { slug: `posts/${p.id}` }, props: { kind: "post" as const, post: p } })),
	];
}

export const GET: APIRoute = async ({ props, site: siteUrl }) => {
	const host = siteUrl ? siteUrl.host : "";
	const card =
		props.kind === "post"
			? {
					eyebrow: site.eyebrow,
					meta: `${props.post.no > 0 ? `No. ${pad(props.post.no)}` : "草稿"} · ${fmtDate(props.post.data.published)}${props.post.data.category ? ` · ${props.post.data.category}` : ""}`,
					title: props.post.data.title,
					desc: props.post.data.description,
					site: site.title,
					host,
				}
			: { eyebrow: site.eyebrow, meta: "", title: site.subtitle, desc: site.intro, site: site.title, host };
	const png = await renderCard(card);
	return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
