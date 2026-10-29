// 项目页数据：按顺序展示
export type Project = {
	name: string;
	description: string;
	status: "进行中" | "已上线" | "已归档";
	tags: string[];
	url?: string; // 在线地址
	repo?: string; // 仓库地址
};

export const projects: Project[] = [];
