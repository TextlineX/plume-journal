import { type CollectionEntry, getCollection } from "astro:content";

export type Post = CollectionEntry<"posts"> & { no: number };

// 草稿什么时候可见：开发模式（pnpm dev），或预览构建（SHOW_DRAFTS=1 pnpm build）。
// 正式构建里草稿不生成页面，也不进 RSS、站点地图和搜索。
export const showDrafts = import.meta.env.DEV || process.env.SHOW_DRAFTS === "1";

// 按发布时间倒序；no 是从最早一篇开始的编号（No. 01 是第一篇），给目录用。草稿不占编号。
export async function getPosts(): Promise<Post[]> {
	const all = await getCollection("posts", ({ data }) => showDrafts || !data.draft);
	const asc = all.sort((a, b) => a.data.published.valueOf() - b.data.published.valueOf());
	let n = 0;
	return asc.map((p) => Object.assign(p, { no: p.data.draft ? 0 : ++n })).reverse();
}

// 首页目录顺序：置顶在前（置顶之间按时间倒序），其余按时间倒序
export function homeOrder(posts: Post[]) {
	return [...posts.filter((p) => p.data.pinned), ...posts.filter((p) => !p.data.pinned)];
}

// 同一系列的文章，按 seriesOrder，其次按发布时间
export function seriesOf(posts: Post[], name: string) {
	return posts
		.filter((p) => p.data.series === name)
		.sort((a, b) => (a.data.seriesOrder ?? 1e9) - (b.data.seriesOrder ?? 1e9) || a.data.published.valueOf() - b.data.published.valueOf());
}

export function allSeries(posts: Post[]) {
	return [...new Set(posts.map((p) => p.data.series).filter(Boolean))] as string[];
}

export const seriesUrl = (s: string) => `/series/${encodeURIComponent(s)}/`;

export const pad = (n: number) => String(n).padStart(2, "0");
// 文章编号：草稿没有编号，目录里显示一条短横线（文章页另有「草稿」标记）
export const postNo = (p: { no: number }) => (p.no > 0 ? pad(p.no) : "—");

export function fmtDate(d: Date, style: "full" | "md" = "full") {
	const y = d.getUTCFullYear();
	const m = pad(d.getUTCMonth() + 1);
	const day = pad(d.getUTCDate());
	return style === "md" ? `${m}-${day}` : `${y}-${m}-${day}`;
}

export const postUrl = (p: { id: string }) => `/posts/${p.id}/`;
export const tagUrl = (t: string) => `/tags/${encodeURIComponent(t)}/`;
export const categoryUrl = (c: string) => `/categories/${encodeURIComponent(c)}/`;

export function countBy(posts: Post[], key: "tags" | "category") {
	const map = new Map<string, number>();
	for (const p of posts) {
		const vals = key === "tags" ? p.data.tags : p.data.category ? [p.data.category] : [];
		for (const v of vals) map.set(v, (map.get(v) ?? 0) + 1);
	}
	return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh"));
}
