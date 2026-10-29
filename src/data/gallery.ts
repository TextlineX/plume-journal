// 相册数据：图片放在 src/assets/gallery/，在这里 import 后加入列表
// 现在的 8 张是生成的示例图，换成自己的照片即可
import type { ImageMetadata } from "astro";
import g1 from "../assets/gallery/g1.jpg";
import g2 from "../assets/gallery/g2.jpg";
import g3 from "../assets/gallery/g3.jpg";
import g4 from "../assets/gallery/g4.jpg";
import g5 from "../assets/gallery/g5.jpg";
import g6 from "../assets/gallery/g6.jpg";
import g7 from "../assets/gallery/g7.jpg";
import g8 from "../assets/gallery/g8.jpg";

export type Photo = {
	src: ImageMetadata;
	title: string;
	date?: string;
};

export const photos: Photo[] = [
	{ src: g1, title: "示例图 1", date: "2026-10" },
	{ src: g2, title: "示例图 2", date: "2026-10" },
	{ src: g3, title: "示例图 3", date: "2026-09" },
	{ src: g4, title: "示例图 4", date: "2026-09" },
	{ src: g5, title: "示例图 5", date: "2026-08" },
	{ src: g6, title: "示例图 6", date: "2026-08" },
	{ src: g7, title: "示例图 7", date: "2026-07" },
	{ src: g8, title: "示例图 8", date: "2026-07" },
];
