// 友链数据。avatar 可以填图片地址；不填就用名字首字显示
export type Friend = {
	name: string;
	url: string;
	description: string;
	avatar?: string;
};

export const friends: Friend[] = [
	{
		name: "Astro",
		url: "https://astro.build/",
		description: "这个博客用的框架（示例友链，可替换）",
	},
];

// 别人申请友链时复制的本站信息
export const myLinkCard = {
	name: "我的博客",
	url: "https://your-domain.com/",
	avatar: "https://your-domain.com/avatar.png",
	description: "记录、折腾与思考",
};
