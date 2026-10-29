// 分享卡片（Open Graph 图）：构建时用 satori 排版成 SVG，再用 resvg 转成 1200×630 PNG。
// 视觉与站点一致：薰衣草夜底、左侧扇贝蕾丝、金菱形；不放角色立绘。
// 字体：宋体只加载标题实际用到的 Fontsource 分片（satori 不支持 woff2，用同包里的 woff）。
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

const FONT_DIR = path.resolve("node_modules/@fontsource/noto-serif-sc");
const LATIN_DIR = path.resolve("node_modules/@fontsource/cormorant-garamond/files");

type Slice = { file: string; ranges: [number, number][] };
let slices: Slice[] | null = null;
function loadSlices(): Slice[] {
	if (slices) return slices;
	const css = fs.readFileSync(path.join(FONT_DIR, "600.css"), "utf8");
	slices = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].flatMap((m) => {
		const url = m[1].match(/url\(\.\/files\/([^)]+?)\.woff2\)/);
		const ur = m[1].match(/unicode-range:\s*([^;]+);/);
		if (!url || !ur) return [];
		const ranges = ur[1].split(",").map((r) => {
			const [a, b] = r.trim().replace(/^U\+/i, "").split("-");
			return [parseInt(a, 16), parseInt(b ?? a, 16)] as [number, number];
		});
		return [{ file: path.join(FONT_DIR, "files", `${url[1]}.woff`), ranges }];
	});
	return slices;
}
const cache = new Map<string, Buffer>();
const read = (f: string) => {
	if (!cache.has(f)) cache.set(f, fs.readFileSync(f));
	return cache.get(f)!;
};

function serifFontsFor(text: string) {
	const cps = [...new Set([...text].map((c) => c.codePointAt(0)!))];
	const files = loadSlices()
		.filter((s) => cps.some((cp) => s.ranges.some(([a, b]) => cp >= a && cp <= b)))
		.map((s) => s.file);
	// satori 对同名字体不做逐字回退，所以每个分片单独命名，再用 font-family 列表串起来
	return files.map((f, i) => ({ name: `Serif${i}`, data: read(f), weight: 600 as const, style: "normal" as const }));
}

// 左侧蕾丝条：纸面 + 扇贝齿 + 针孔 + 金色虚线（与 Portrait 组件同一套比例：齿半径 10、节距 20）
function laceSvg(h: number) {
	const w = 88;
	let teeth = "";
	let holes = "";
	for (let y = 10; y < h + 20; y += 20) {
		teeth += `<circle cx="${w - 10}" cy="${y}" r="10" fill="#2a2645"/>`;
		holes += `<circle cx="${w - 26}" cy="${y}" r="1.6" fill="#17152a"/>`;
	}
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w - 10}" height="${h}" fill="#2a2645"/>${teeth}${holes}<line x1="${w - 34}" y1="0" x2="${w - 34}" y2="${h}" stroke="#d9bc78" stroke-opacity="0.6" stroke-dasharray="6 4"/></svg>`;
	return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

type El = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): El => ({
	type,
	props: { style, children, ...extra },
});

export type Card = { eyebrow: string; meta: string; title: string; desc?: string; site: string; host: string };

export async function renderCard(c: Card): Promise<Buffer> {
	const allText = `${c.title}${c.desc ?? ""}${c.site}${c.eyebrow}${c.meta}${c.host}`;
	const serifFonts = serifFontsFor(allText);
	// 拉丁字母优先用 Cormorant，汉字落到各个宋体分片
	const SERIF = ["Latin", ...serifFonts.map((f) => f.name)].join(", ");
	const W = 1200;
	const H = 630;
	const titleSize = [...c.title].length > 22 ? 56 : 64;
	const tree = h(
		"div",
		{ width: W, height: H, display: "flex", background: "linear-gradient(160deg, #2a2645 0%, #1f1c37 45%, #17152a 100%)", color: "#f3f1fa" },
		[
			h("img", { width: 88, height: H }, undefined, { src: laceSvg(H), width: 88, height: H }),
			h("div", { display: "flex", flexDirection: "column", flex: 1, padding: "72px 96px 64px 72px" }, [
				h("div", { display: "flex", alignItems: "baseline", gap: 20 }, [
					h("div", { fontFamily: "Latin", fontStyle: "italic", fontSize: 34, color: "#b8afe6" }, c.eyebrow),
					h("div", { fontFamily: "Latin", fontSize: 26, color: "#aba4cc", letterSpacing: 1 }, c.meta),
				]),
				h(
					"div",
					{ marginTop: 28, fontFamily: SERIF, fontSize: titleSize, lineHeight: 1.3, letterSpacing: 2, color: "#f3f1fa", display: "block", lineClamp: 3 },
					c.title,
				),
				c.desc
					? h("div", { marginTop: 24, fontFamily: SERIF, fontSize: 28, lineHeight: 1.6, color: "#cfc9e6", display: "block", lineClamp: 2 }, c.desc)
					: h("div", {}, ""),
				h("div", { marginTop: "auto", display: "flex", alignItems: "center", gap: 20 }, [
					h("div", { width: 56, height: 1, background: "#d9bc78" }),
					h("div", { width: 12, height: 12, background: "#d9bc78", transform: "rotate(45deg)" }),
					h("div", { flex: 1, height: 1, background: "rgba(217,188,120,0.5)" }),
				]),
				h("div", { marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "baseline" }, [
					h("div", { fontFamily: SERIF, fontSize: 30, color: "#e2def2", letterSpacing: 2 }, c.site),
					h("div", { fontFamily: "Latin", fontSize: 26, color: "#aba4cc" }, c.host),
				]),
			]),
		],
	);
	const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
		width: W,
		height: H,
		fonts: [
			{ name: "Latin", data: read(path.join(LATIN_DIR, "cormorant-garamond-latin-500-normal.woff")), weight: 500, style: "normal" },
			{ name: "Latin", data: read(path.join(LATIN_DIR, "cormorant-garamond-latin-500-italic.woff")), weight: 500, style: "italic" },
			...serifFonts,
		],
	});
	return new Resvg(svg, { fitTo: { mode: "width", value: W } }).render().asPng();
}
