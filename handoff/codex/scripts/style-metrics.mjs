// 背景图的风格量化指标：饱和度、明度、细节密度（边缘占比），按区域计算
// 用法：node handoff/codex/scripts/style-metrics.mjs <图片> [day|night]
// check-handoff.mjs 也会调用 measure() 对每张背景图做检查
import sharp from "sharp";

const WIDTH = 1280; // 统一缩放到这个宽度再测，保证不同尺寸的图可以比较

// 区域：x0,x1,y0,y1 都是 0–1 的比例。横屏和竖屏不同
export const ZONES = {
	landscape: {
		content: [0.2, 0.72, 0.4, 1], // 会被文章卡片盖住的区域
		sky: [0, 0.65, 0, 0.4],
		character: [0.7, 1, 0, 1],
	},
	portrait: {
		content: [0, 1, 0.38, 1],
		sky: [0, 1, 0.38, 0.7],
		character: [0, 1, 0, 0.35],
	},
};

export async function measure(file) {
	const img = sharp(file).removeAlpha();
	const meta = await img.metadata();
	const h = Math.round((meta.height / meta.width) * WIDTH);
	const { data } = await img.resize(WIDTH, h).raw().toBuffer({ resolveWithObject: true });
	const W = WIDTH;
	const H = h;
	const n = W * H;
	const sat = new Float32Array(n);
	const lum = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		const r = data[i * 3] / 255;
		const g = data[i * 3 + 1] / 255;
		const b = data[i * 3 + 2] / 255;
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		sat[i] = max === 0 ? 0 : (max - min) / max; // HSV 饱和度
		lum[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
	}
	// 拉普拉斯边缘：|8·中心 − 周围 8 个| > 0.2 记为边缘像素
	const edge = new Uint8Array(n);
	for (let y = 1; y < H - 1; y++) {
		for (let x = 1; x < W - 1; x++) {
			const i = y * W + x;
			let s = 8 * lum[i];
			s -= lum[i - 1] + lum[i + 1] + lum[i - W] + lum[i + W];
			s -= lum[i - W - 1] + lum[i - W + 1] + lum[i + W - 1] + lum[i + W + 1];
			edge[i] = Math.abs(s) > 0.2 ? 1 : 0;
		}
	}
	const orientation = meta.width >= meta.height ? "landscape" : "portrait";
	const zone = ([x0, x1, y0, y1]) => {
		const sv = [];
		const lv = [];
		let e = 0;
		const xa = Math.floor(x0 * W);
		const xb = Math.floor(x1 * W);
		const ya = Math.floor(y0 * H);
		const yb = Math.floor(y1 * H);
		for (let y = ya; y < yb; y++) {
			for (let x = xa; x < xb; x++) {
				const i = y * W + x;
				sv.push(sat[i]);
				lv.push(lum[i]);
				e += edge[i];
			}
		}
		const count = sv.length;
		sv.sort((a, b) => a - b);
		lv.sort((a, b) => a - b);
		const pct = (arr, p) => arr[Math.min(arr.length - 1, Math.floor(arr.length * p))];
		const mean = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
		const r3 = (v) => Math.round(v * 1000) / 1000;
		return {
			satMean: r3(mean(sv)),
			satP90: r3(pct(sv, 0.9)),
			lumMean: r3(mean(lv)),
			lumP5: r3(pct(lv, 0.05)),
			lumP95: r3(pct(lv, 0.95)),
			edge: r3(e / count),
		};
	};
	const z = ZONES[orientation];
	return {
		orientation,
		whole: zone([0, 1, 0, 1]),
		content: zone(z.content),
		sky: zone(z.sky),
		character: zone(z.character),
	};
}

// 阈值：day = 浅色模式（高明度），night = 深色模式（明亮的夜）
export const LIMITS = {
	day: {
		"whole.satMean": ["<=", 0.25],
		"whole.satP90": ["<=", 0.45],
		"whole.lumMean": [">=", 0.72],
		"content.lumP5": [">=", 0.6],
		"content.edge": ["<=", 0.04],
		"sky.satMean": ["<=", 0.3],
	},
	night: {
		"whole.satMean": ["<=", 0.35],
		"whole.satP90": ["<=", 0.55],
		"whole.lumMean": [">=", 0.2],
		"whole.lumMean ": ["<=", 0.45],
		"content.edge": ["<=", 0.04],
	},
};

export function evaluate(metrics, mode) {
	const fails = [];
	for (const [key, [op, limit]] of Object.entries(LIMITS[mode])) {
		const [zone, field] = key.trim().split(".");
		const v = metrics[zone][field];
		const ok = op === "<=" ? v <= limit : v >= limit;
		if (!ok) fails.push(`${zone}.${field} = ${v}，要求 ${op} ${limit}`);
	}
	// 视觉焦点：角色区的细节必须明显多于内容区
	if (metrics.character.edge < metrics.content.edge * 2) {
		fails.push(`角色区细节 ${metrics.character.edge} 不到内容区 ${metrics.content.edge} 的 2 倍，画面没有焦点`);
	}
	return fails;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const [file, mode = "day"] = process.argv.slice(2);
	if (!file) {
		console.error("用法：node style-metrics.mjs <图片> [day|night]");
		process.exit(2);
	}
	const m = await measure(file);
	console.log(JSON.stringify(m, null, 2));
	const fails = evaluate(m, mode);
	console.log(fails.length ? `\n不通过：\n- ${fails.join("\n- ")}` : "\n通过");
	process.exit(fails.length ? 1 : 0);
}
