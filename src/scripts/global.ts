// 全站交互：深浅模式、菜单与搜索弹层、Pagefind 搜索、音乐。
// 页面用 Astro ClientRouter 换页：document 不变，所以这里只绑定一次，用事件委托。

type Track = { title: string; artist: string; src: string };

function getTheme(): "light" | "dark" {
	try {
		return (localStorage.getItem("theme") as "light" | "dark") || "dark";
	} catch {
		return "dark";
	}
}
function applyTheme(t: "light" | "dark") {
	const changed = document.documentElement.dataset.theme !== t;
	document.documentElement.dataset.theme = t;
	if (changed) window.dispatchEvent(new CustomEvent("plume:theme", { detail: t }));
	document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "dark" ? "#17152a" : "#f6f2f8");
}

/* ---------------- 搜索（Pagefind） ---------------- */
type PagefindResult = { data: () => Promise<{ url: string; excerpt: string; meta: { title?: string } }> };
type Pagefind = { search: (q: string) => Promise<{ results: PagefindResult[] }> };
let pagefind: Pagefind | null = null;
let pagefindFailed = false;
async function loadPagefind() {
	if (pagefind || pagefindFailed) return pagefind;
	try {
		const path = "/pagefind/pagefind.js";
		pagefind = (await import(/* @vite-ignore */ path)) as Pagefind;
	} catch {
		pagefindFailed = true;
	}
	return pagefind;
}
let searchSeq = 0;
async function runSearch(q: string) {
	const list = document.getElementById("search-results");
	const hint = document.getElementById("search-hint");
	if (!list || !hint) return;
	const seq = ++searchSeq;
	if (!q.trim()) {
		list.innerHTML = "";
		hint.textContent = "输入关键词开始搜索";
		hint.hidden = false;
		return;
	}
	const pf = await loadPagefind();
	if (!pf) {
		hint.textContent = "搜索索引只在构建后生成：运行 pnpm build 再 pnpm preview。";
		hint.hidden = false;
		return;
	}
	const res = await pf.search(q);
	const items = await Promise.all(res.results.slice(0, 8).map((r) => r.data()));
	if (seq !== searchSeq) return;
	list.innerHTML = items
		.map(
			(it) =>
				`<li><a href="${it.url}"><div class="sr-title">${escapeHtml(it.meta.title || it.url)}</div><div class="sr-excerpt">${it.excerpt}</div></a></li>`,
		)
		.join("");
	hint.hidden = items.length > 0;
	if (!items.length) hint.textContent = `没有找到和「${q}」相关的文章`;
}
function escapeHtml(s: string) {
	return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}
function openSearch() {
	const d = document.getElementById("search-dialog") as HTMLDialogElement | null;
	if (!d || d.open) return;
	d.showModal();
	const input = document.getElementById("search-input") as HTMLInputElement | null;
	input?.focus();
	input?.select();
	loadPagefind();
}

/* ---------------- 音乐 ---------------- */
let trackIndex = 0;
function musicEls() {
	const panel = document.getElementById("music-panel");
	const audio = document.getElementById("bgm") as HTMLAudioElement | null;
	const tracks: Track[] = panel ? JSON.parse(panel.dataset.tracks || "[]") : [];
	return { panel, audio, tracks };
}
function renderMusic() {
	const { panel, audio, tracks } = musicEls();
	if (!panel || !audio) return;
	const t = tracks[trackIndex];
	if (t) {
		panel.querySelector(".mu-title")!.textContent = t.title;
		panel.querySelector(".mu-artist")!.textContent = t.artist;
	}
	const playing = !audio.paused;
	panel.classList.toggle("is-playing", playing);
	panel.querySelector(".mu-play")?.setAttribute("aria-label", playing ? "暂停" : "播放");
}
function loadTrack(i: number) {
	const { audio, tracks } = musicEls();
	if (!audio || !tracks.length) return;
	trackIndex = (i + tracks.length) % tracks.length;
	audio.src = tracks[trackIndex].src;
}

export function initGlobal() {
	applyTheme(getTheme());
	// 换页后新文档的 <html> 属性会覆盖当前值，需要重新应用
	document.addEventListener("astro:after-swap", () => applyTheme(getTheme()));
	// 换页前关掉打开的弹层
	document.addEventListener("astro:before-preparation", () => {
		document.querySelectorAll<HTMLDialogElement>("dialog[open]").forEach((d) => d.close());
	});

	document.addEventListener("click", (e) => {
		const el = (e.target as HTMLElement).closest<HTMLElement>("[data-theme-toggle],[data-open-search],[data-open-menu],[data-close-dialog],[data-open-music],.mu-play,.mu-next");
		if (!el) {
			// 点在音乐面板外：收起
			const panel = document.getElementById("music-panel");
			if (panel && !panel.hidden && !(e.target as HTMLElement).closest("#music-panel")) panel.hidden = true;
			return;
		}
		if (el.matches("[data-theme-toggle]")) {
			const next = getTheme() === "dark" ? "light" : "dark";
			try {
				localStorage.setItem("theme", next);
			} catch {}
			applyTheme(next);
		} else if (el.matches("[data-open-search]")) {
			(document.getElementById("menu-sheet") as HTMLDialogElement | null)?.close();
			openSearch();
		} else if (el.matches("[data-open-menu]")) {
			(document.getElementById("menu-sheet") as HTMLDialogElement | null)?.showModal();
		} else if (el.matches("[data-close-dialog]")) {
			el.closest("dialog")?.close();
		} else if (el.matches("[data-open-music]")) {
			(document.getElementById("menu-sheet") as HTMLDialogElement | null)?.close();
			const panel = document.getElementById("music-panel");
			if (panel) {
				panel.hidden = !panel.hidden;
				e.stopPropagation();
			}
		} else if (el.matches(".mu-play")) {
			const { audio } = musicEls();
			if (!audio) return;
			if (!audio.src) loadTrack(trackIndex);
			if (audio.paused) audio.play().catch(() => {});
			else audio.pause();
		} else if (el.matches(".mu-next")) {
			const { audio } = musicEls();
			loadTrack(trackIndex + 1);
			audio?.play().catch(() => {});
		}
	});

	// 点对话框外的遮罩关闭
	document.addEventListener("click", (e) => {
		const t = e.target as HTMLElement;
		if (t instanceof HTMLDialogElement && t.open) {
			const r = t.getBoundingClientRect();
			const { clientX: x, clientY: y } = e as MouseEvent;
			if (x < r.left || x > r.right || y < r.top || y > r.bottom) t.close();
		}
	});

	document.addEventListener("keydown", (e) => {
		const t = e.target as HTMLElement;
		const typing = t.closest("input, textarea, [contenteditable]");
		if (e.key === "/" && !typing) {
			e.preventDefault();
			openSearch();
		}
		if (e.key === "Escape" && t.id === "search-input") {
			// type=search 的输入框第一下 Esc 默认只清空文字；这里直接关闭面板
			e.preventDefault();
			(document.getElementById("search-dialog") as HTMLDialogElement | null)?.close();
		}
		if (e.key === "Escape") {
			const panel = document.getElementById("music-panel");
			if (panel && !panel.hidden) panel.hidden = true;
		}
	});

	let timer: number | undefined;
	document.addEventListener("input", (e) => {
		const t = e.target as HTMLInputElement;
		if (t.id !== "search-input") return;
		clearTimeout(timer);
		timer = window.setTimeout(() => runSearch(t.value), 160);
	});


	const { audio } = musicEls();
	if (audio) {
		const panel = document.getElementById("music-panel");
		audio.volume = Number(panel?.dataset.volume || 0.6);
		audio.addEventListener("play", renderMusic);
		audio.addEventListener("pause", renderMusic);
		audio.addEventListener("timeupdate", () => {
			const bar = document.querySelector<HTMLElement>("#music-panel .mu-bar span");
			if (bar && audio.duration) bar.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
		});
		audio.addEventListener("ended", () => {
			loadTrack(trackIndex + 1);
			audio.play().catch(() => {});
		});
	}
}
