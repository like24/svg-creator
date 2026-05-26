---
name: create-svg
description: 生成或修改微信公众号 SVG 交互动画代码。支持从零生成完整 HTML，也支持对已有代码进行修改。
---

# Create SVG

生成或修改微信公众号 SVG 交互动画代码。

## 触发条件

- 用户要求生成微信公众号 SVG
- 用户描述一个交互动画效果
- 用户提供图片素材要求做成 SVG 交互
- 用户给已有代码要求修改（改触发方式、改参数、加效果等）

## 硬性规则

- 不使用 JavaScript
- 不使用外部 CSS，全部 inline style
- HTML 容器只用 `section`，不得使用 div/span/p/a/img 等
- 动画用 SMIL：`animate` / `set` / `animateTransform`
- 图片用 `foreignObject` + CSS `background` 或 `<image href>`
- 交互用 `begin="click"`，通过父子 `<g>` 冒泡触发
- 一次性状态用 `fill="freeze"` + `restart="never"`
- 开发阶段图片用本地相对路径（`./images/xxx.png`）
- 缺图时用同尺寸色块占位

## 禁用语法

- `begin="someId.click"` / `begin="someId.touchstart"`
- `onclick=` / `ontouchstart=` / `onload=` 等 DOM 事件
- `<script>` / `<style>` / `<link rel="stylesheet">`
- `mouseover` / `mouseout` / `dblclick` 作为默认交互
- `class=` / `id=` 作为动画状态依赖
- 白名单外动画属性：`clip-path` / `filter` / `transform-origin` / `background-position` / `margin` / `z-index` / `display`

## 动画属性白名单

`animate` / `set` 可用的 `attributeName`：
`x` / `y` / `width` / `height` / `opacity` / `visibility` / `fill` / `stroke-width` / `stroke-dashoffset`

`animateTransform` 可用的 `type`：
`translate` / `scale` / `rotate` / `skewX` / `skewY`

## 生成流程

1. 确认需求：效果描述、图片素材、触发方式（点击/自动/触摸）
2. 读取 `references/knowledge/` 下相关知识文件
3. **查找参考**：
   - 知识库中有对应模式 → 基于知识生成
   - 知识库没有 → 查看本地 `source/` 目录是否有类似代码
   - 都没有 → **先跟用户沟通思路，列计划，确认方向正确后再动手**
   - 不可凭空编造，不可在错误思路上反复重试
4. 确定画布尺寸：从用户提供的 UI 图/素材获取 `viewBox`
5. 选择动画模式：根据需求匹配知识库中的模式
6. 计算参数：如展开比例 = 实际高度 / 显示层高度 x 100%
7. 输出完整 HTML 文件
8. 自检：
   - 无禁用语法
   - 热区可点击（pointer-events: visible）
   - 动画行为正确（fill="freeze", restart="never"）
   - 切片间 margin-top: -1px 消缝

## 知识库位置

知识文件在 `references/knowledge/` 目录下，按交互模式命名。

生成前必须读取相关知识文件，基于知识生成代码，不凭空编造。

## 修改流程

当用户给已有代码要求修改时：

1. 读取用户给的代码
2. 读取 `references/knowledge/` 下相关知识文件
3. 分析代码中使用了哪些模式
4. 根据用户需求修改对应部分
5. 输出修改后的完整代码（不是只输出 diff）
6. 自检：修改后的代码仍符合硬性规则
