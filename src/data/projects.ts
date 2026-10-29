// 项目页数据：按顺序展示
export type Project = {
	name: string;
	description: string;
	status: "进行中" | "已上线" | "已归档";
	tags: string[];
	url?: string; // 在线地址
	repo?: string; // 仓库地址
};

export const projects: Project[] = [
	{
		name: "这个博客",
		description: "从零设计的个人博客「羽之手帐」：角色栏、竖排索引、目录式文章列表。",
		status: "进行中",
		tags: ["Astro", "设计"],
		url: "/",
	},
	{
		name: "HowToFish",
		description: "一款 Unity 钓鱼游戏，正在修复和整理，支持 Android 与局域网联机。",
		status: "进行中",
		tags: ["Unity", "C#", "游戏"],
	},
	{
		name: "Textline",
		description: "我的个人网站，准备整体重做视觉和页面。",
		status: "进行中",
		tags: ["网站", "设计"],
	},
];
