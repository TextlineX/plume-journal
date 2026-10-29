// 字数与阅读时间：中文按字计数（每分钟 400 字），英文按词计数（每分钟 200 词）
import { toString } from "mdast-util-to-string";

export function remarkReadingTime() {
	return (tree, { data }) => {
		const text = toString(tree);
		const cjk = (text.match(/[㐀-鿿豈-﫿]/g) || []).length;
		const latin = (text.replace(/[㐀-鿿豈-﫿]/g, " ").match(/[A-Za-z0-9_]+/g) || []).length;
		data.astro.frontmatter.words = cjk + latin;
		data.astro.frontmatter.minutes = Math.max(1, Math.round(cjk / 400 + latin / 200));
	};
}
