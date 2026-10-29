// 导航：过滤掉还没有内容的页面（项目、相册数据为空时不出现在页签里，页面本身仍可访问）
import { photos } from "../data/gallery";
import { projects } from "../data/projects";
import { nav } from "../site.config";

const empty: Record<string, boolean> = {
	"/projects/": projects.length === 0,
	"/gallery/": photos.length === 0,
};

export const visibleNav = nav.filter((item) => !(item.hideWhenEmpty && empty[item.url]));

export function isActive(path: string, url: string) {
	return url === "/" ? path === "/" || /^\/(page|posts|series)\//.test(path) : path.startsWith(url);
}

// 竖排站名：把拉丁字母、数字和汉字分成几段，拉丁段按 clreq 规则横躺（sideways）且不加字距
export function splitTitle(title: string) {
	return title.split(/([A-Za-z0-9][A-Za-z0-9 .\-_]*)/).filter(Boolean).map((t) => ({ text: t, latin: /^[A-Za-z0-9]/.test(t) }));
}
