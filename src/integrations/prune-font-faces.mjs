// 构建后裁剪中文字体分片：Fontsource 把一个中文字重切成约 100 个 unicode-range 分片，
// 每页都要下载、解析全部 @font-face 规则（原来 4 个字重共 420 条、428 KB，阻塞渲染）。
// 这里扫描 dist 里所有 HTML 和 JS 的实际用字，只保留覆盖这些字的分片规则；
// 被删掉的分片对应的 woff2 文件也一并删除。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function walk(dir, out = []) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p, out);
		else out.push(p);
	}
	return out;
}

function parseRanges(s) {
	return s.split(",").map((part) => {
		const r = part.trim().replace(/^U\+/i, "");
		if (r.includes("-")) {
			const [a, b] = r.split("-");
			return [parseInt(a, 16), parseInt(b, 16)];
		}
		if (r.includes("?")) return [parseInt(r.replace(/\?/g, "0"), 16), parseInt(r.replace(/\?/g, "F"), 16)];
		const v = parseInt(r, 16);
		return [v, v];
	});
}

export default function pruneFontFaces() {
	return {
		name: "prune-font-faces",
		hooks: {
			"astro:build:done": ({ dir, logger }) => {
				const root = fileURLToPath(dir);
				const files = walk(root);
				const used = new Set();
				for (const f of files) {
					if (!/\.(html|js|xml)$/.test(f)) continue;
					for (const ch of fs.readFileSync(f, "utf8")) used.add(ch.codePointAt(0));
				}
				const usedArr = [...used];
				let kept = 0;
				let removed = 0;
				const keepFiles = new Set();
				const dropFiles = new Set();
				for (const f of files) {
					if (!f.endsWith(".css")) continue;
					const css = fs.readFileSync(f, "utf8");
					if (!css.includes("@font-face")) continue;
					const out = css.replace(/@font-face\s*\{[^}]*\}/g, (block) => {
						const m = block.match(/unicode-range:\s*([^;}]+)/);
						const urls = [...block.matchAll(/url\(([^)]+)\)/g)].map((x) => x[1].replace(/["']/g, ""));
						if (!m) {
							kept++;
							urls.forEach((u) => keepFiles.add(path.basename(u)));
							return block;
						}
						const ranges = parseRanges(m[1]);
						const hit = usedArr.some((cp) => ranges.some(([a, b]) => cp >= a && cp <= b));
						if (hit) {
							kept++;
							urls.forEach((u) => keepFiles.add(path.basename(u)));
							return block;
						}
						removed++;
						urls.forEach((u) => dropFiles.add(path.basename(u)));
						return "";
					});
					fs.writeFileSync(f, out);
				}
				let deleted = 0;
				for (const f of files) {
					const b = path.basename(f);
					if (dropFiles.has(b) && !keepFiles.has(b)) {
						fs.rmSync(f);
						deleted++;
					}
				}
				logger.info(`字体分片：保留 ${kept} 条 @font-face，删除 ${removed} 条（${deleted} 个字体文件）；全站用字 ${used.size} 个`);
			},
		},
	};
}
