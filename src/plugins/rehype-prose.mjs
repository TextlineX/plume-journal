// 正文 HTML 后处理（构建时，不依赖第三方插件）：
// 1. h2/h3 后面加一个「#」锚点，悬停时出现，方便复制某一节的链接
// 2. 站外链接在新标签页打开，并加 rel="noopener noreferrer"
export function rehypeProse({ siteHost = "" } = {}) {
	const walk = (node, fn) => {
		fn(node);
		if (node.children) for (const c of node.children) walk(c, fn);
	};
	return (tree) => {
		walk(tree, (node) => {
			if (node.type !== "element") return;
			if ((node.tagName === "h2" || node.tagName === "h3") && node.properties?.id) {
				node.children.push({
					type: "element",
					tagName: "a",
					properties: { href: `#${node.properties.id}`, className: ["h-anchor"], ariaLabel: "本节链接" },
					children: [{ type: "text", value: "#" }],
				});
			}
			if (node.tagName === "a" && typeof node.properties?.href === "string") {
				const href = node.properties.href;
				if (/^https?:\/\//.test(href) && (!siteHost || !href.includes(siteHost))) {
					node.properties.target = "_blank";
					node.properties.rel = ["noopener", "noreferrer"];
					node.properties.className = [...(node.properties.className || []), "ext"];
				}
			}
		});
	};
}
