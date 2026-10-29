# 工作包 01：背景图

**动手前先读 `STYLE.md`（背景美术风格规范）。** 这份文件只说要交什么、按什么顺序做；画成什么样由 STYLE.md 决定，数值由 `pnpm check:handoff` 检查。

## 要做什么

一组含角色的全屏背景插画：**同一个场景，白天和夜晚各一版，每版 6 种屏幕比例，外加 1 张分享卡片，共 13 张。** 博客的文章列表和侧栏会盖在画面中间，所以画面中间只能是天空。

## 场景设定

- **地点**：天台。角色倚着栏杆。
- **白天**：晴朗的下午，天空占画面绝大部分，2–3 团柔边积云，地平线上一条很淡的城市和山的剪影。
- **夜晚**：同一画面的晚上。明亮的蓝紫色夜空、稀疏的小星星、左上方一弯月亮，地平线上一点暖色窗灯。
- **角色**：以 `input/character/` 的参考图为准，发型、发色、瞳色、服装、饰品一样都不能改。姿势沿用第一次的「倚栏托腮」，脸朝向画面中间。
- **不要**：见 STYLE.md 第 10 节。

## 交付文件

全部放 `src/assets/bg/`，JPG（质量 90 以上）或 PNG，单张不超过 3 MB，尺寸必须完全一致。

| 文件 | 尺寸 | 来源 |
| --- | --- | --- |
| `bg-day-21x9.jpg` | 3440×1440 | **母版**，最先做 |
| `bg-day-16x9.jpg` | 2560×1440 | 母版左右裁切，角色仍在水平 70%–95% |
| `bg-day-16x10.jpg` | 2560×1600 | 16:9 向上扩图（扩出来的是天空） |
| `bg-day-4x3.jpg` | 2048×1536 | 16:10 左侧裁切 + 向上扩图 |
| `bg-day-3x4.jpg` | 1536×2048 | 竖屏重新构图，见提示词 2 |
| `bg-day-9x19.jpg` | 1290×2796 | 3:4 向上下扩图（上方天空，下方地平线） |
| `bg-night-*.jpg`（6 张） | 同上 | 每张从对应白天版用提示词 4 改时间，构图不变 |
| `public/og/og-default.jpg` | 1200×630 | 从 `bg-day-16x9` 缩放裁切，≤ 150 KB |

## 做法

1. **收集参考**：按 STYLE.md 第 2 节找 5–8 张正面参考，用 `style-metrics.mjs` 测过、合格的才放进 `input/style-refs/`。
2. **构图小稿**：先出一张 3440×1440 的黑白明暗小稿（只有大色块：天空、云、地平线、角色剪影），确认地平线高度、角色位置、内容区留白符合 STYLE.md 第 8 节。小稿给博客作者看。
3. **白天母版**：用提示词 1 + 角色参考图（+ 合格的风格参考图）生成。**每张候选图都要跑 `node handoff/codex/scripts/style-metrics.mjs <图> day`**，不通过就调整提示词或参数重来。模型出不了 3440×1440 时，先生成最接近的横幅比例，再扩图到 21:9，最后用动漫专用放大模型（例如 Real-ESRGAN anime）放大，不要直接拉伸。
4. **停下确认**：挑 2–3 张指标合格的候选给博客作者选。确认前不要做后面的。
5. **其余比例**：按交付表裁切或扩图，扩图用提示词 3。竖屏用提示词 2 重新构图。
6. **夜晚版**：每张白天图用提示词 4 编辑，测指标时用 `night`。
7. **记录**：每张图的模型、提示词、种子、指标数值写进 `handoff/codex/work/backgrounds-log.md`。
8. **验收**：`pnpm check:handoff -- --only backgrounds` 零错误，再按下方清单人工检查。

## 提示词

自然语言版适合 GPT / Gemini / Midjourney 一类模型；标签版适合 Stable Diffusion 系的动漫模型。两种都按 STYLE.md 的术语写，不要自己加形容词。

### 提示词 1：白天横幅母版

自然语言：

```text
High-key Japanese anime illustration, translucent and airy, pastel low-saturation palette.
Low-angle shot from a rooftop, the sky fills almost the whole frame, horizon line very low at about 85% of the image height.
Soft gradient sky from pale blue #BFDDF5 at the top to near-white #F4F8FC at the horizon, two or three soft-edged cumulus clouds with lavender-blue shadows.
A thin, pale silhouette of distant city and mountains on the horizon, single value, no windows, dissolved by atmospheric perspective.
The character from the reference image leans on the rooftop railing at the far right of the frame, between 70% and 95% of the width,
resting her chin on her hand, knee shot, her face turned toward the left side of the image.
Keep exactly the same hairstyle, hair color, eye color, outfit and accessories as the reference.
Soft warm sunlight from the upper left, blue-violet shadows, a thin warm rim light on her right edge, subtle diffusion glow on highlights.
Cel shading with soft gradients and colored line art on the character, smooth painterly sky with no texture.
The left two thirds of the image are empty sky, negative space, low detail.
No floating feathers or petals, no particles, no power lines, no water tower, no scaffolding, no vines, no lens flare, no text, no watermark, no neon, no other people.
```

标签版：

```text
1girl, solo, leaning on railing, hand on own chin, knee shot, from below, looking to the side,
rooftop, railing, sky, cumulus, day, horizon, distant city, silhouette, atmospheric perspective,
high-key, pastel colors, light blue sky, white clouds, soft lighting, rim light, bloom, diffusion,
negative space, simple background, wide shot, scenery, very aesthetic
负面：feathers, petals, falling leaves, particles, power lines, utility pole, water tower, scaffolding, vines, plants on foreground,
lens flare, chromatic aberration, vignette, hdr, oversaturated, cyan sky, dark, high contrast, text, watermark, signature, multiple girls
```

### 提示词 2：竖屏（3:4）

```text
High-key Japanese anime illustration, translucent and airy, pastel low-saturation palette, vertical composition.
Same rooftop, sky and lighting as the second reference image.
Low-angle shot, the character from the first reference image leans on the railing at the top of the frame, between 3% and 35% of the image height,
knee shot, face turned down and to the left. Keep exactly the same hairstyle, hair color, eye color, outfit and accessories as the reference.
Below her, the rest of the image is open gradient sky with one or two soft clouds, and a thin pale silhouette of distant city at the very bottom.
Soft warm sunlight from the upper left, blue-violet shadows, thin rim light, subtle diffusion glow.
No floating particles, no power lines, no scaffolding, no lens flare, no text, no watermark, no neon, no other people.
```

### 提示词 3：扩图

```text
Extend the image seamlessly in the same high-key pastel style, lighting and perspective.
Fill the new area only with {smooth gradient sky and soft clouds | a thin pale silhouette of distant city}, low detail.
Do not add people, particles, text or new objects. Do not change the existing pixels.
```

### 提示词 4：白天改夜晚

```text
Change this image to a bright, calm night. Keep the composition, the character's pose, outfit and position exactly the same.
Blue-violet night sky from #2B3350 at the top to #7A7FA3 at the horizon, small sparse stars, a thin crescent moon in the upper left.
Cool moonlight from the upper left with a soft blue rim light on the character.
A few small warm window lights #FFD9A0 only on the distant city silhouette at the horizon.
Keep it high-key for a night scene: no pure black, low saturation, soft diffusion glow.
No neon, no particles, no text, no watermark, no new objects.
```

## 人工验收（逐条写进 REPORT.md）

- [ ] `pnpm check:handoff -- --only backgrounds` 零错误（包括风格指标）。
- [ ] 和参考图对比：角色的发型、发色、瞳色、服装、饰品一致；手指、五官正常。
- [ ] 对照 STYLE.md 第 10 节禁止清单逐条检查，一项都没有。
- [ ] 6 种比例是同一个场景和姿势；白天、夜晚构图一致。
- [ ] `pnpm dev` 后在 1920×1080、1440×900、390×844 三种窗口、深浅两种模式下看过：角色没被卡片、侧栏、导航栏挡住，卡片上的字清楚。
