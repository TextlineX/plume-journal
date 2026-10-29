// 站点配置：改名字、简介、导航、歌单都在这里
import type { ImageMetadata } from "astro";
import avatar from "./assets/images/avatar.png";
import charDay from "./assets/character/day.png";
import charNight from "./assets/character/night.png";

export const site = {
	title: "我的博客",
	subtitle: "记录、折腾与思考",
	// 首页目录上方的一段自我介绍（衬线体）
	intro: "写代码，也写点别的。这里是我的手帐：做过的东西、踩过的坑、偶尔的随想。",
	author: "博主",
	lang: "zh-CN",
	eyebrow: "Plume Journal",
	postsPerPage: 8,
};

export const profile: { avatar: ImageMetadata; links: { name: string; url: string; icon: IconName }[] } = {
	avatar,
	links: [
		{ name: "GitHub", url: "https://github.com/", icon: "github" },
		{ name: "RSS", url: "/rss.xml", icon: "rss" },
	],
};

// 竖排索引签：顺序即显示顺序。文字建议 2 个字，竖排最整齐
export const nav = [
	{ name: "首页", url: "/" },
	{ name: "归档", url: "/archive/" },
	{ name: "项目", url: "/projects/" },
	{ name: "相册", url: "/gallery/" },
	{ name: "友链", url: "/friends/" },
	{ name: "关于", url: "/about/" },
];

// 角色栏立绘：day 浅色模式，night 深色模式（透明底）
// focusX / focusY：立绘裁切时保留的位置（0–1）。她在原图里偏右，所以 X 取 0.74，让脸落在栏的中线附近
export const character = { day: charDay, night: charNight, focusX: 0.74, focusY: 0.06 };

// 音乐：src 放在 public/music/ 下，例如 "/music/song.mp3"
export const music: { enable: boolean; volume: number; playlist: { title: string; artist: string; src: string }[] } = {
	enable: true,
	volume: 0.6,
	playlist: [],
};

// 文章底部许可
export const license = { name: "CC BY-NC-SA 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans" };

export type IconName = "github" | "rss" | "search" | "sun" | "moon" | "music" | "play" | "pause" | "next" | "menu" | "close" | "arrow-left" | "arrow-right" | "external";
