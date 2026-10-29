// 用法：pnpm new-post my-post-slug
import fs from "node:fs";
import path from "node:path";

const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
	console.error("用法：pnpm new-post <slug>（只用小写字母、数字和连字符）");
	process.exit(1);
}
const file = path.join("src/content/posts", `${slug}.md`);
if (fs.existsSync(file)) {
	console.error(`已存在：${file}`);
	process.exit(1);
}
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(
	file,
	`---\ntitle: ${slug}\npublished: ${today}\ndescription: ""\ntags: []\ncategory: 随笔\ndraft: true\n---\n\n正文从这里开始。\n`,
);
console.log(`已创建 ${file}（draft: true，写完改成 false 才会出现在网站上）`);
