# 点击展开

## 原理

点击展开的核心是「层叠 + 宽度放大撑出高度」。

**层叠结构**：用 `height:0` 的零高容器把底层内容叠在上面，初始不显示。再用一个正常高度的 SVG 盖在上面作为交互层（封面）。

**宽度放大撑出高度**：SVG 的 viewBox 会等比缩放。显示层 SVG 的 viewBox 高度决定了初始可见高度。点击后宽度放大到 X%，高度也同步放大 X%，当放大后的高度等于底层内容高度时，底层内容完全露出来。

**点击捕获**：用一个 `opacity:0` + `pointer-events:visible"` 的透明 rect 作为热区。用户看不见但能点击。点击事件冒泡到 SVG 根元素，触发所有 `begin="click"` 的动画。

**动画联动**：多个 SMIL 动画通过同一个 `begin="click"` 触发：
- `opacity` 动画：当前层淡出（视觉过渡）
- `visibility` hidden：当前层消失（让底层显示）
- `width` 放大：展开底层内容

**一次性执行**：`fill="freeze"` 保持最终状态，`restart="never"` 确保动画只播放一次。

## 核心代码

```html
<section style="overflow:hidden;font-size:0;line-height:0;pointer-events:none;user-select:none;-webkit-tap-highlight-color:transparent;">
  <section style="overflow:hidden;margin-top:-1px;">

    <!-- 零高容器：底层展开内容 -->
    <section style="height:0;">
      <svg viewBox="0 0 {W} {EXPAND_H}" style="display:block;width:100%;margin-top:-1px;">
        <!-- 展开后显示的内容（图片或色块） -->
        <rect width="{W}" height="{EXPAND_H}" fill="#27ae60"/>
      </svg>
    </section>

    <!-- 交互层：初始可见的封面 -->
    <svg viewBox="0 0 {W} {COVER_H}"
      style="transform:scale(1) translateZ(1px);display:block;width:100%;max-width:none!important;">

      <!-- 点击后：宽度放大（撑出底层高度） -->
      <animate calcMode="spline" attributeName="width"
        values="100%;{EXPAND_PERCENT}%;{EXPAND_PERCENT}%"
        dur="1s" keyTimes="0;0.9;1"
        keySplines=".42,0,.58,1;.42,0,.58,1"
        fill="freeze" restart="never" begin="click+0.5s"/>

      <!-- 点击后：隐藏交互层 -->
      <set attributeName="visibility" from="visible" to="hidden"
        fill="freeze" restart="never" begin="click+0.5s"/>

      <g>
        <set attributeName="visibility" from="visible" to="hidden"
          fill="freeze" restart="never" begin="click+0.5s"/>

        <!-- 点击后：淡出 -->
        <animate attributeName="opacity" values="1;0;0"
          dur="1s" keyTimes="0;0.5;1"
          fill="freeze" restart="never" begin="click"/>

        <!-- 封面内容 -->
        <rect width="{W}" height="{COVER_H}" fill="#3498db"/>
      </g>

      <g>
        <set attributeName="visibility" from="visible" to="hidden"
          fill="freeze" restart="never" begin="click"/>

        <!-- 透明热区 -->
        <rect x="0" y="{HOT_Y}" width="{W}" height="{HOT_H}" fill="#39f" opacity="0"
          style="pointer-events:visible;">
          <animate attributeName="x" values="88888888" dur="0.001s"
            fill="freeze" restart="never" begin="click"/>
        </rect>
      </g>
    </svg>

  </section>
</section>
```

## 关键参数

### 展开比例公式

```
展开比例 = 实际内容高度 / 显示层viewBox高度 x 100%
```

- 显示层 viewBox 高度 = 封面 SVG 的 viewBox 高度（{COVER_H}）
- 实际内容高度 = 零高容器里 SVG 的 viewBox 高度（{EXPAND_H}）
- 展开比例 = {EXPAND_H} / {COVER_H} x 100%

示例：
- 封面高度 500，内容高度 1080 → 1080/500 = 216%
- 封面高度 300，内容高度 1800 → 1800/300 = 600%

### viewBox 高度选择

- {W}：由设计稿/素材宽度决定，不固定
- {COVER_H}：封面初始可见高度，由设计决定
- {EXPAND_H}：展开后完整内容高度，由设计决定

### 热区位置

- {HOT_Y}：热区起始 Y 坐标（通常在封面底部区域）
- {HOT_H}：热区高度（建议至少 200 设计像素，方便点击）

## 变体

### 触发方式变体

- **点击触发**：`begin="click"` — 最常用
- **自动触发**：`begin="2s"` — 页面加载后延迟自动展开
- **触摸触发**：`begin="touchstart"` — 手指按下即触发

### 放大比例变体

- 小幅度展开：100% → 129%（内容高度约为封面的 1.3 倍）
- 中幅度展开：100% → 216%（内容高度约为封面的 2 倍）
- 大幅度展开：100% → 600%（内容高度约为封面的 6 倍）

### 动画节奏变体

- **快展开慢淡出**：width dur="0.5s"，opacity dur="1s"
- **同步展开淡出**：width 和 opacity 同时开始，相同 dur
- **先淡出再展开**：opacity begin="click"，width begin="click+0.5s"（默认方案）

### 热区隐藏变体

- **移到屏幕外**：animate x 到 88888888（原方案）
- **visibility 隐藏**：set visibility="hidden"
- **两者都用**：双重保险

## 适用场景

- 文件夹/卡片展开详情
- 报告/档案折叠内容展开
- 问答/目录逐级展开
- 任何「点击查看更多」的交互
