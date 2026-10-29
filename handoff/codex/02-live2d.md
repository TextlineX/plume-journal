> **暂停（2026-10-28）**：博客 v3「羽之手帐」左侧整栏常驻角色立绘，已经承担看板娘的作用，这个工作包先不做。下文保留作参考，路径以 v2 为准，启用前会重写。

# 工作包 02：看板娘

## 先说清楚做什么

真正的 Live2D 模型（`.moc3`）只能在 Live2D Cubism Editor 里手工绑定后导出，代码代理无法完成。所以这个工作包做的是**分层动画看板娘**：把角色立绘拆成若干图层，用代码做出呼吸、眨眼、视线和头部跟随鼠标、头发摆动、表情切换。网页接口和真正的 Live2D 一样，以后有了 Cubism 模型可以直接替换（见文末附录）。

你要交付两部分：

1. 分层素材 + `mascot.json`，放在 `public/live2d/mascot/`。
2. 动画组件，替换 `src/scripts/mascot/index.ts` 里的占位实现。

## 一、拆层

从 `input/character/fullbody.png` 拆出下面这些图层。只要上半身（从头顶到腰部），全身在网页角落太小。

| 图层 ID | 内容 | 必需 |
| --- | --- | --- |
| `hair_back` | 后发（被头和身体挡住的部分要补画完整） | 是 |
| `body` | 脖子到腰：身体、衣服、手臂 | 是 |
| `head` | 脸和耳朵，不含眼睛、嘴、前发；前发盖住的额头要补画 | 是 |
| `eyes_open` | 睁眼（眼白、瞳孔、睫毛、高光） | 是 |
| `eyes_closed` | 闭眼的眼线 | 是 |
| `eyes_smile` | 笑眼（弯成 ^ ^） | 是 |
| `brows` | 眉毛 | 否 |
| `mouth_closed` | 闭嘴 | 是 |
| `mouth_open` | 张嘴说话（含口腔） | 是 |
| `mouth_smile` | 微笑 | 是 |
| `blush` | 脸红（半透明） | 否 |
| `hair_front` | 前发和侧发 | 是 |
| `accessory_*` | 发饰等会单独摆动的饰品，可以有多个 | 否 |

做法建议：

1. 用分割模型（例如 SAM）把头发、脸、身体分开，得到初始遮罩。
2. 用图像编辑模型在**完全相同的构图**下生成闭眼、笑眼、张嘴、微笑等变体，再只截取眼部或嘴部区域。
3. 用修补（inpaint）补画被遮挡的部分：前发下的额头、头后面的后发、脸下面的脖子。头部转动时这些地方会露出来，不补就会看到空洞。
4. 所有图层导出为**同一画布尺寸、同一坐标对齐**的透明 WebP。网页用的画布高度 1200px（宽度按比例），原始大图留在 `handoff/codex/work/`。
5. 每层边缘要干净，不能有白边或半透明杂边。

## 二、mascot.json

放在 `public/live2d/mascot/mascot.json`，格式如下（`src/scripts/mascot/types.ts` 有对应的 TypeScript 类型）：

```json
{
  "version": 1,
  "name": "角色名",
  "canvas": { "width": 800, "height": 1200 },
  "pivots": {
    "neck": [400, 520],
    "waist": [400, 1150]
  },
  "layers": [
    { "id": "hair_back", "src": "hair_back.webp", "part": "head", "sway": 1 },
    { "id": "body", "src": "body.webp", "part": "body" },
    { "id": "head", "src": "head.webp", "part": "head" },
    { "id": "eyes_open", "src": "eyes_open.webp", "part": "face", "slot": "eyes", "value": "open" },
    { "id": "eyes_closed", "src": "eyes_closed.webp", "part": "face", "slot": "eyes", "value": "closed" },
    { "id": "eyes_smile", "src": "eyes_smile.webp", "part": "face", "slot": "eyes", "value": "smile" },
    { "id": "mouth_closed", "src": "mouth_closed.webp", "part": "face", "slot": "mouth", "value": "closed" },
    { "id": "mouth_open", "src": "mouth_open.webp", "part": "face", "slot": "mouth", "value": "open" },
    { "id": "mouth_smile", "src": "mouth_smile.webp", "part": "face", "slot": "mouth", "value": "smile" },
    { "id": "hair_front", "src": "hair_front.webp", "part": "head", "sway": 0.6 }
  ],
  "expressions": {
    "default": { "eyes": "open", "mouth": "closed" },
    "happy": { "eyes": "smile", "mouth": "smile" },
    "talk": { "eyes": "open", "mouth": "open" },
    "sleepy": { "eyes": "closed", "mouth": "closed" }
  }
}
```

- `layers` 按从后到前的顺序排列。
- `part`：`body` 随呼吸起伏；`head` 和 `face` 绕 `pivots.neck` 转动；`face` 在头部基础上额外随视线偏移。
- `slot` + `value`：同一个 `slot` 里同时只显示一个 `value`，由 `expressions` 决定。
- `sway`：头发和饰品的摆动幅度（0–1），比头部慢半拍。
- 坐标单位是画布像素。
- `handoff/codex/examples/mascot-test/` 是一套用几何图形画的测试素材，只用来演示文件格式和对齐方式，不是交付物。把它复制到 `public/live2d/mascot/` 就能在博客里看到占位动画的效果。

## 三、动画组件

替换 `src/scripts/mascot/index.ts`，保持导出接口不变：

```ts
export async function mountMascot(host: HTMLElement, options: MountOptions): Promise<MascotHandle>;

interface MountOptions {
  manifestUrl: string;      // mascot.json 的地址
  height: number;           // 显示高度，CSS 像素
  reducedMotion: boolean;   // 用户开了「减少动态效果」
}

interface MascotHandle {
  setExpression(name: string): void;  // expressions 里的名字
  say(text: string, ms?: number): void; // 头顶气泡 + 说话时嘴巴开合
  rest(): void;   // 收起（滑出屏幕）
  wake(): void;   // 叫回
  destroy(): void;
}
```

必须有的行为：

| 行为 | 要求 |
| --- | --- |
| 呼吸 | `body` 约 3.5 秒一个周期，纵向起伏 1% 以内 |
| 眨眼 | 每 2–6 秒随机眨一次，闭眼 120ms 左右；偶尔连眨两下 |
| 头部跟随 | 鼠标在屏幕上移动时，头绕脖子转动最多 6°、平移最多 8px，带缓动 |
| 视线 | `face` 层在头部基础上再向鼠标方向偏移最多 4px |
| 头发摆动 | 带 `sway` 的层跟随头部运动，滞后约 150ms，有回弹；最好用网格变形，不行就用斜切 |
| 点击 | 点击角色：切到 `happy`，说一句随机台词，2 秒后恢复 |
| 深浅色切换 | `<html>` 的 `dark` 类变化时：切到夜间时说一句困了的台词，表情 `sleepy` 2 秒 |
| 减少动态效果 | 只保留呼吸和眨眼 |
| 性能 | 60fps；标签页隐藏或角色滑出屏幕时暂停动画 |
| 体积 | 组件代码 gzip 后 ≤ 60 KB；如果用 PixiJS，按需动态加载，整体 ≤ 250 KB |

台词从 `host.dataset.lines`（JSON 数组字符串）读取，博客已经把 `src/custom.config.ts` 里的台词放进去了。

博客端已经处理好：只在宽度 ≥ 1440px 的屏幕上加载、空闲时才加载、切页不重新加载、「让她休息」按钮和访客选择的记忆。你不需要改这些。

## 人工验收（逐条写进 REPORT.md）

- [ ] 头部转到最大角度时，额头、后脑、脖子都没有露出空洞或错位。
- [ ] 各图层边缘没有白边。
- [ ] 眨眼、说话、笑的时候眼睛和嘴的位置完全对齐，不会跳动。
- [ ] Chrome 性能面板里动画稳定 60fps，空闲时 CPU 占用低。
- [ ] 系统开「减少动态效果」后只剩呼吸和眨眼。
- [ ] `pnpm check:handoff -- --only live2d` 通过，`pnpm build` 通过。

## 附录：以后换成真正的 Live2D 模型

如果博客作者之后约稿或自己用 Cubism Editor 做出了模型：

1. 把导出的 `.model3.json`、`.moc3`、贴图、`.physics3.json`、`.exp3.json`、`.motion3.json` 放进 `public/live2d/<角色名>/`。
2. 在 `src/custom.config.ts` 里把 `live2dConfig.mode` 改成 `"cubism"`，`cubism.models[0].path` 改成 `/live2d/<角色名>/<角色名>.model3.json`。

给建模师的参数要求（Live2D 标准参数 ID，共 18 个，免费版 30 个的上限以内）：

`ParamAngleX` `ParamAngleY` `ParamAngleZ` `ParamBodyAngleX` `ParamBreath` `ParamEyeLOpen` `ParamEyeROpen` `ParamEyeLSmile` `ParamEyeRSmile` `ParamEyeBallX` `ParamEyeBallY` `ParamBrowLY` `ParamBrowRY` `ParamMouthOpenY` `ParamMouthForm` `ParamHairFront` `ParamHairSide` `ParamHairBack`

交付：Cubism 4 或 5 格式，1 张 2048px 贴图，6 个表情（开心、惊讶、害羞、生气、犯困、思考），待机动作 2–3 段、打招呼、点头部、点身体各一段，`Head` 和 `Body` 两个点击区域，全部文件 gzip 后 3 MB 以内。
