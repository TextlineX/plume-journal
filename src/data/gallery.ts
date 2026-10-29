// 相册数据：图片放在 src/assets/gallery/，在这里 import 后加入列表
import type { ImageMetadata } from "astro";

export type Photo = {
	src: ImageMetadata;
	title: string;
	date?: string;
};

export const photos: Photo[] = [];
