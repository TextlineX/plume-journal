import { type CollectionEntry, getCollection } from "astro:content";

export type Post = CollectionEntry<"posts"> & { no: number };

// 按发布时间倒序；no 是从最早一篇开始的编号（No. 01 是第一篇），给目录用
export async function getPosts(): Promise<Post[]> {
	const all = await getCollection("posts", ({ data }) => import.meta.env.DEV || !data.draft);
	const asc = all.sort((a, b) => a.data.published.valueOf() - b.data.published.valueOf());
	return asc.map((p, i) => Object.assign(p, { no: i + 1 })).reverse();
}

export const pad = (n: number) => String(n).padStart(2, "0");

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
