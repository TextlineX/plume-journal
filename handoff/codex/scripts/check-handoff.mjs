#!/usr/bin/env node
// 按 handoff/codex/manifest.json 检查 Codex 交付的素材
// 用法：pnpm check:handoff [-- --only backgrounds|live2d|stickers|icons|input]
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import sharp from "sharp";
import { evaluate, measure } from "./style-metrics.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const manifest = JSON.parse(readFileSync(join(root, "handoff/codex/manifest.json"), "utf8"));

const args = process.argv.slice(2);
const onlyIdx = args.indexOf("--only");
const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null;
const SECTIONS = ["input", "backgrounds", "live2d", "stickers", "icons"];
if (only && !SECTIONS.includes(only)) {
	console.error(`--only 只能是：${SECTIONS.join("、")}`);
	process.exit(2);
}

const errors = [];
const warnings = [];
let okCount = 0;
const rel = (p) => relative(root, p);
const kb = (bytes) => Math.round(bytes / 1024);

function findFile(item) {
	for (const ext of item.ext) {
		const p = join(root, `${item.path}.${ext}`);
		if (existsSync(p)) return p;
	}
	return null;
}

async function checkImage(file, item, label) {
	const size = statSync(file).size;
	if (item.maxKB && size > item.maxKB * 1024) {
		errors.push(`${label}：${kb(size)} KB，超过上限 ${item.maxKB} KB`);
	}
	if (/\.(md|json|txt)$/.test(file)) return;
	let meta;
	try {
		meta = await sharp(file).metadata();
	} catch (e) {
		errors.push(`${label}：无法读取图片（${e.message}）`);
		return;
	}
	if (item.width && item.height && (meta.width !== item.width || meta.height !== item.height)) {
		errors.push(`${label}：尺寸 ${meta.width}×${meta.height}，要求 ${item.width}×${item.height}`);
	}
	if (item.minHeight && meta.height < item.minHeight) {
		errors.push(`${label}：高度 ${meta.height}px，至少要 ${item.minHeight}px`);
	}
	if (item.alpha && !meta.hasAlpha) {
		errors.push(`${label}：需要透明背景，但图片没有透明通道`);
	}
}

async function checkList(name, list) {
	console.log(`\n[${name}]`);
	for (const item of list) {
		const label = `${item.path}.{${item.ext.join(",")}}`;
		const file = findFile(item);
		if (!file) {
			(item.required ? errors : warnings).push(`${label}：缺少文件`);
			continue;
		}
		const before = errors.length;
		await checkImage(file, item, rel(file));
		// 背景图额外检查风格指标（见 STYLE.md 第 7 节）
		const bgMode = /\/bg-(day|night)-/.exec(item.path)?.[1];
		if (bgMode && errors.length === before) {
			const fails = evaluate(await measure(file), bgMode);
			for (const f of fails) errors.push(`${rel(file)}：风格不达标，${f}`);
		}
		if (errors.length === before) {
			okCount++;
			console.log(`  ✓ ${rel(file)}`);
		}
	}
}

async function checkLive2d(cfg) {
	console.log("\n[live2d]");
	const dir = join(root, cfg.dir);
	const mPath = join(dir, cfg.manifest);
	if (!existsSync(mPath)) {
		errors.push(`${rel(mPath)}：缺少看板娘配置文件`);
	} else {
		let m;
		try {
			m = JSON.parse(readFileSync(mPath, "utf8"));
		} catch (e) {
			errors.push(`${rel(mPath)}：不是合法的 JSON（${e.message}）`);
		}
		if (m) {
			const { width, height } = m.canvas || {};
			if (!width || !height) errors.push(`${rel(mPath)}：缺少 canvas.width / canvas.height`);
			if (height && height !== cfg.canvasHeight) {
				warnings.push(`${rel(mPath)}：canvas 高度 ${height}，建议 ${cfg.canvasHeight}`);
			}
			for (const p of cfg.requiredPivots) {
				const v = m.pivots?.[p];
				if (!Array.isArray(v) || v.length !== 2) errors.push(`${rel(mPath)}：缺少 pivots.${p}（[x, y]）`);
			}
			const layers = Array.isArray(m.layers) ? m.layers : [];
			const ids = new Set();
			let total = statSync(mPath).size;
			for (const layer of layers) {
				if (ids.has(layer.id)) errors.push(`图层 ${layer.id}：ID 重复`);
				ids.add(layer.id);
				if (!["body", "head", "face"].includes(layer.part)) {
					errors.push(`图层 ${layer.id}：part 必须是 body / head / face`);
				}
				if ((layer.slot && !layer.value) || (!layer.slot && layer.value)) {
					errors.push(`图层 ${layer.id}：slot 和 value 必须同时出现`);
				}
				const f = join(dir, layer.src || "");
				if (!layer.src || !existsSync(f)) {
					errors.push(`图层 ${layer.id}：找不到文件 ${layer.src}`);
					continue;
				}
				total += statSync(f).size;
				try {
					const meta = await sharp(f).metadata();
					if (width && height && (meta.width !== width || meta.height !== height)) {
						errors.push(`图层 ${layer.id}：尺寸 ${meta.width}×${meta.height}，必须和画布 ${width}×${height} 一致`);
					}
					if (!meta.hasAlpha) errors.push(`图层 ${layer.id}：需要透明通道`);
				} catch (e) {
					errors.push(`图层 ${layer.id}：无法读取（${e.message}）`);
				}
			}
			for (const id of cfg.requiredLayers) {
				if (!ids.has(id)) errors.push(`缺少必需图层 ${id}`);
			}
			const slotValues = {};
			for (const layer of layers) {
				if (layer.slot) (slotValues[layer.slot] ||= new Set()).add(layer.value);
			}
			for (const name of cfg.requiredExpressions) {
				const ex = m.expressions?.[name];
				if (!ex) {
					errors.push(`缺少表情 ${name}`);
					continue;
				}
				for (const [slot, value] of Object.entries(ex)) {
					if (!slotValues[slot]?.has(value)) errors.push(`表情 ${name}：没有 ${slot}=${value} 的图层`);
				}
			}
			if (total > cfg.maxTotalKB * 1024) {
				errors.push(`看板娘素材总共 ${kb(total)} KB，超过上限 ${cfg.maxTotalKB} KB`);
			}
			if (!errors.some((e) => e.includes("图层") || e.includes("mascot") || e.includes("表情"))) {
				okCount++;
				console.log(`  ✓ ${rel(mPath)}：${layers.length} 个图层，共 ${kb(total)} KB`);
			}
		}
	}

	const runtime = join(root, cfg.runtime);
	if (!existsSync(runtime)) {
		errors.push(`${cfg.runtime}：缺少动画组件`);
	} else {
		const src = readFileSync(runtime, "utf8");
		if (!/export\s+(async\s+)?function\s+mountMascot|export\s+\{[^}]*mountMascot/.test(src)) {
			errors.push(`${cfg.runtime}：没有导出 mountMascot`);
		}
		if (src.includes("PLACEHOLDER_RUNTIME")) {
			warnings.push(`${cfg.runtime}：还是占位实现，工作包 02 要求替换`);
		}
		const runtimeDir = dirname(runtime);
		const gz = readdirSync(runtimeDir)
			.filter((f) => /\.(ts|js|mjs)$/.test(f))
			.reduce((sum, f) => sum + gzipSync(readFileSync(join(runtimeDir, f))).length, 0);
		if (gz > cfg.runtimeMaxGzipKB * 1024) {
			warnings.push(`动画组件源码 gzip 后 ${kb(gz)} KB，超过建议的 ${cfg.runtimeMaxGzipKB} KB（以打包结果为准）`);
		}
	}
}

const run = (s) => !only || only === s;
if (run("input")) await checkList("input", manifest.input);
if (run("backgrounds")) await checkList("backgrounds", manifest.backgrounds);
if (run("live2d") && !manifest.live2d?.paused) await checkLive2d(manifest.live2d); // 02 暂停时跳过
if (run("stickers")) await checkList("stickers", manifest.stickers);
if (run("icons")) await checkList("icons", manifest.icons);

console.log("");
for (const w of warnings) console.log(`  ! ${w}`);
for (const e of errors) console.log(`  ✗ ${e}`);
console.log(`\n通过 ${okCount} 项，警告 ${warnings.length} 项，错误 ${errors.length} 项`);
process.exit(errors.length ? 1 : 0);
