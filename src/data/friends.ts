// 友链数据。avatar 可以填图片地址；不填就用名字首字显示
export type Friend = {
	name: string;
	url: string;
	description: string;
	avatar?: string;
};

export const friends: Friend[] = [];

// 别人申请友链时复制的本站信息
export const myLinkCard = {
	name: "Textline的博客",
	url: "https://blog.textline.top/",
	avatar: "https://blog.textline.top/avatar.png",
	description: "随便写写",
};
