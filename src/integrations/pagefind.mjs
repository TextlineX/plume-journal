// 构建结束时生成 Pagefind 搜索索引。放在 Astro 构建流程里，而不是 package.json 的 build 脚本：
// 这样不管部署平台的构建命令填的是 `astro build`、`npx astro build` 还是 `pnpm build`，索引都会生成。
import { fileURLToPath } from "node:url";
import * as pagefind from "pagefind";

export default function pagefindIndex() {
	return {
		name: "pagefind-index",
		hooks: {
			"astro:build:done": async ({ dir, logger }) => {
				const site = fileURLToPath(dir);
				const { index, errors } = await pagefind.createIndex({});
				if (!index) throw new Error(`Pagefind 初始化失败：${errors.join("; ")}`);
				const added = await index.addDirectory({ path: site });
				if (added.errors.length) throw new Error(`Pagefind 索引失败：${added.errors.join("; ")}`);
				const written = await index.writeFiles({ outputPath: `${site}pagefind` });
				if (written.errors.length) throw new Error(`Pagefind 写入失败：${written.errors.join("; ")}`);
				logger.info(`搜索索引：${added.page_count} 个页面`);
				await pagefind.close();
			},
		},
	};
}
