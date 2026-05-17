---
name: wechat-svg-animation
description: 微信公众号纯 SVG 交互动画设计。触发条件：用户需要在微信公众号/小程序环境下构建纯 SVG 交互动画，无 JS、无 id/class、无 defs，使用 SMIL 动画 + CSS 辅助。
---

# 微信公众号 SVG 交互动画 SKILL

## 触发条件

当用户需求匹配以下**任意一条**时激活本 SKILL：

- 微信公众号/小程序 SVG 交互动画
- 纯 SVG 动画，不能用 JS
- 无 id/class 的 SVG 动画方案
- SVG 精灵图/帧动画
- 点击展开/长图展开/卡片翻转/轮播等微信图文效果
- SVG 视差滚动/触摸交互
- 排查 SVG 动画不生效、层级错乱、交互失效等问题

---

## 一、环境约束

微信公众号 SVG 动画必须在以下硬约束内工作：

### 禁止项
- **无 JavaScript**：公众号不支持任何 JS
- **无 `id`/`class`**：SVG 内部不使用 id 和 class（HTML 层可用 class）
- **无 `defs`/`use`**：不使用 SVG 定义引用
- **无外部 CSS 文件**：所有样式必须内联
- **无 `href`/`xlink:href` 做动画目标引用**

### 允许项
- SVG SMIL 动画元素（`<animate>`, `<animateTransform>`, `<animateMotion>`, `<set>`）
- 内联 CSS（`style=""` 属性）
- `<foreignObject>` 嵌套
- HTML `<section>` 容器
- CSS 3D 变换（`perspective`, `translateZ`）

---

## 二、动画属性白名单

### `<animate>` 可用属性

| attributeName | 用途 | 示例 values |
|---------------|------|-------------|
| `opacity` | 透明度 | `"1;0;0"` / `"0;1;1"` / `"1;0.5;1"` |
| `width` | 宽度展开 | `"100%;182%;182%"` / `"0;1080;1080"` |
| `height` | 高度变化 | `"0;500;500"` |
| `x` | 水平位移 | `"88888888"` (移出屏幕) |
| `y` | 垂直位移 | — |
| `r` | 圆半径 | `"25;20;25"` (脉冲圆) |
| `d` | 路径变形 | — |
| `points` | 多边形变形 | — |
| `stroke-width` | 描边粗细 | — |
| `stroke-dashoffset` | 虚线偏移 | — |
| `fill` | 填充色 | — |

### `<animateTransform>` 可用属性

| type | 用途 | 示例 values |
|------|------|-------------|
| `translate` | 平移 | `"0 0;0 30;0 0"` / `"-1000 0;-2000 0;-3000 0"` |
| `scale` | 缩放 | `"0.01;1;1"` / `"0.01;1.1;1"` (回弹) |
| `rotate` | 旋转 | `"0 56 20;360 56 20"` |
| `skewX` | X轴倾斜 | — |
| `skewY` | Y轴倾斜 | — |

### `<set>` 可用属性

| attributeName | 用途 | 示例 |
|---------------|------|------|
| `visibility` | 显示/隐藏 | `from="visible" to="hidden"` |

### `<animateMotion>` 可用属性

| 属性 | 用途 |
|------|------|
| `path` | 运动路径（贝塞尔曲线） |

### 关键控制属性

| 属性 | 值 | 用途 |
|------|----|------|
| `begin` | `"0"` / `"0.2s"` / `"click"` / `"click+1s"` / `"touchstart"` / `"touchend"` | 触发时机 |
| `fill` | `"freeze"` (保持终态) / `"remove"` (恢复初态) | 动画结束后行为 |
| `restart` | `"never"` (一次性) / `"always"` (可重复) / `"whenNotActive"` (非活动时) | 重启动策略 |
| `dur` | `"1000s"` / `"0.001s"` / `"3s"` 等 | 持续时间 |
| `calcMode` | `"discrete"` (离散/逐帧) / `"spline"` (缓动) / `"linear"` (匀速) | 插值模式 |
| `keyTimes` | `"0;0.0003;1"` | 关键帧时间点 |
| `keySplines` | `"0.42 0 0.58 1"` | 贝塞尔缓动曲线 |
| `repeatCount` | `"indefinite"` / 数字 | 重复次数 |
| `additive` | `"sum"` / `"replace"` | 变换叠加模式 |

---

## 三、容器结构规范

### 基础容器（必须）

```html
<section style="overflow:hidden; font-size:0px; line-height:0; pointer-events:none; user-select:none; -webkit-tap-highlight-color:transparent; margin-bottom:0px;">
  <!-- 内容 -->
</section>
```

### 零高度堆叠容器

多屏内容使用 `<section style="height:0">` 配合 `z-index` 堆叠：

```html
<section style="height:0; position:relative; z-index:3;">
  <!-- 第一屏 -->
</section>
<section style="height:0; position:relative; z-index:2;">
  <!-- 第二屏 -->
</section>
<section style="height:0; position:relative; z-index:1;">
  <!-- 第三屏 -->
</section>
```

---

## 四、图片集成方式

### 方式一：SVG 背景图（最常用）

```html
<svg style="width:100%; background:url(https://xxx.jpg) no-repeat center/100% 100%;"></svg>
```

### 方式二：foreignObject 嵌套

```html
<foreignObject width="100%" height="100%">
  <svg xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%; background:url(https://xxx.jpg) no-repeat center/100% 100%;"></svg>
</foreignObject>
```

### 方式三：`<image>` 标签

```html
<image href="https://xxx.jpg" width="1080" height="1920"/>
```

### 图片懒加载

```html
<img src="data:image/svg+xml,...透明占位..." data-src="https://真实图片.jpg" />
```

---

## 五、核心动画模式（含完整代码）

### 模式 1：透明脉冲引导（点击提示）

```html
<circle cx="540" cy="960" r="60" fill="none" stroke="#fff" stroke-width="2">
  <animate attributeName="r" values="60;50;60" dur="1.2s" repeatCount="indefinite" begin="0.2s"/>
  <animate attributeName="opacity" values="0.85;0.2;0.85" dur="1.2s" repeatCount="indefinite" begin="0.2s"/>
</circle>
```

### 模式 2：一次性点击区域

```html
<g>
  <rect width="1080" height="1920" opacity="0" style="pointer-events:visible;">
    <animate attributeName="x" values="88888888" dur="0.001s" begin="click" fill="freeze" restart="never"/>
  </rect>
  <set attributeName="visibility" from="visible" to="hidden" begin="click" fill="freeze" restart="never"/>
</g>
```

### 模式 3：点击触发展开（宽度动画）

```html
<svg width="100%">
  <animate attributeName="width" values="100%;182%;182%" dur="5s" begin="click" fill="freeze" restart="never" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1"/>
</svg>
```

### 模式 4：多阶段点击展开

```html
<!-- 第一阶段 -->
<svg width="100%">
  <animate attributeName="width" values="100%;182%;182%" dur="5s" begin="click" fill="freeze" restart="never"/>
</svg>
<!-- 第二阶段 -->
<svg width="182%">
  <animate attributeName="width" values="182%;247%;247%" dur="5s" begin="click" fill="freeze" restart="never"/>
</svg>
<!-- 第三阶段 -->
<svg width="247%">
  <animate attributeName="width" values="247%;298%;298%" dur="5s" begin="click" fill="freeze" restart="never"/>
</svg>
```

### 模式 5：精灵图/帧动画

```html
<svg width="500%" viewBox="0 0 1080 1920">
  <g>
    <animateTransform type="translate" values="0 0;-1080 0;-2160 0;-3240 0;-4320 0" dur="4s" calcMode="discrete" repeatCount="indefinite" begin="0"/>
    <image href="frame1.jpg" x="0" y="0" width="1080" height="1920"/>
    <image href="frame2.jpg" x="1080" y="0" width="1080" height="1920"/>
    <image href="frame3.jpg" x="2160" y="0" width="1080" height="1920"/>
    <image href="frame4.jpg" x="3240" y="0" width="1080" height="1920"/>
    <image href="frame5.jpg" x="4320" y="0" width="1080" height="1920"/>
  </g>
</svg>
```

### 模式 6：图片轮播（透明度切换）

```html
<svg width="100%" height="500">
  <g opacity="1">
    <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.25;0.25;1" dur="8s" repeatCount="indefinite" begin="0"/>
    <image href="img1.jpg" width="100%" height="100%"/>
  </g>
  <g opacity="0">
    <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.25;0.25;0.5;0.5;1" dur="8s" repeatCount="indefinite" begin="0"/>
    <image href="img2.jpg" width="100%" height="100%"/>
  </g>
  <g opacity="0">
    <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.5;0.5;1" dur="8s" repeatCount="indefinite" begin="0"/>
    <image href="img3.jpg" width="100%" height="100%"/>
  </g>
</svg>
```

### 模式 7：缩放弹出（带回弹）

```html
<g transform="scale(0.01)">
  <animateTransform type="scale" values="0.01;1.1;1" dur="0.6s" begin="click" fill="freeze" restart="never" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1"/>
  <animate attributeName="opacity" values="0;1;1" dur="0.6s" begin="click" fill="freeze" restart="never"/>
  <!-- 内容 -->
</g>
```

### 模式 8：无限滚动（跑马灯）

```html
<svg width="100%" height="500" style="overflow:hidden;">
  <g>
    <animateTransform type="translate" values="0 0;0 -1920;0 0" dur="80s" repeatCount="indefinite" begin="0"/>
    <!-- 内容复制两份，无缝衔接 -->
    <foreignObject width="100%" height="1920"><!-- 第一份 --></foreignObject>
    <foreignObject y="1920" width="100%" height="1920"><!-- 第二份（重复） --></foreignObject>
  </g>
</svg>
```

### 模式 9：CSS 3D 视差滚动

```html
<section style="height:0; overflow:hidden scroll; perspective:1px;">
  <section style="transform-style:preserve-3d;">
    <!-- 远景层 -->
    <section style="transform:translateZ(0.35px) scale(0.65);">
      <!-- 远景内容 -->
    </section>
    <!-- 中景层 -->
    <section style="transform:translateZ(0.15px) scale(0.85);">
      <!-- 中景内容 -->
    </section>
    <!-- 前景层 -->
    <section style="transform:translateZ(0px) scale(1);">
      <!-- 前景内容 -->
    </section>
  </section>
</section>
```

### 模式 10：触摸拖拽视差

```html
<g>
  <!-- 按住时滚动 -->
  <animateTransform type="translate" values="0 0;0 -5000" dur="30s" begin="touchstart" end="touchend" fill="freeze" restart="always" calcMode="spline" keySplines="0.42 0 0.58 1"/>
  <!-- 松手后回弹 -->
  <animateTransform type="translate" to="0 0" dur="0.5s" begin="touchend" fill="freeze" restart="always" calcMode="spline" keySplines="0.42 0 0.58 1"/>
</g>
```

### 模式 11：顺序渐显（延迟触发）

```html
<g opacity="0">
  <animate attributeName="opacity" values="0;1;1" dur="1s" begin="click" fill="freeze" restart="never"/>
</g>
<g opacity="0">
  <animate attributeName="opacity" values="0;1;1" dur="1s" begin="click+1s" fill="freeze" restart="never"/>
</g>
<g opacity="0">
  <animate attributeName="opacity" values="0;1;1" dur="1s" begin="click+2s" fill="freeze" restart="never"/>
</g>
```

### 模式 12：黑白色到彩色揭示

```html
<svg width="100%">
  <!-- 底层彩色图 -->
  <foreignObject width="100%" height="100%">
    <svg style="background:url(color.jpg) no-repeat center/100% 100%;"></svg>
  </foreignObject>
  <!-- 顶层黑白图，点击后宽度收缩 -->
  <foreignObject width="100%" height="100%">
    <svg style="background:url(bw.jpg) no-repeat center/100% 100%;">
      <animate attributeName="width" values="100%;1%;1%" dur="3s" begin="click" fill="freeze" restart="never"/>
    </svg>
  </foreignObject>
</svg>
```

### 模式 13：触摸区分（防误触）

```html
<!-- touchstart 触发，touchmove 不触发（防滚动误触） -->
<g>
  <rect width="1080" height="1920" opacity="0" style="pointer-events:visible;">
    <!-- touchstart 时移走 -->
    <animateTransform type="translate" values="0 0;-2000 0;-2000 0" dur="0.001s" begin="touchstart" fill="freeze" calcMode="discrete"/>
    <!-- touchmove 时留在原位（不触发） -->
    <animateTransform type="translate" values="0 0;0 0" dur="0.001s" begin="touchmove" fill="freeze" calcMode="discrete"/>
  </rect>
</g>
```

### 模式 14：GIF 切换

```html
<g>
  <!-- 静态图在上层 -->
  <foreignObject width="100%" height="100%">
    <svg style="background:url(static.png) no-repeat center/100% 100%;"></svg>
  </foreignObject>
  <!-- 点击后静态图消失，露出下层 GIF -->
  <animate attributeName="opacity" values="1;0;0" begin="click+0.7s" dur="0.001s" fill="freeze" restart="never"/>
  <set attributeName="visibility" from="visible" to="hidden" begin="click+1s" fill="freeze" restart="never"/>
</g>
<!-- GIF 层在下面 -->
<foreignObject width="100%" height="100%">
  <svg style="background:url(animated.gif) no-repeat center/100% 100%;"></svg>
</foreignObject>
```

### 模式 15：折叠/展开卡片

```html
<section style="transform:scale(1, 0.3); transform-origin:left top; height:0;">
  <!-- 卡片内容 -->
  <svg>
    <rect width="1080" height="600" opacity="0" style="pointer-events:visible;">
      <animate attributeName="x" values="88888888" dur="0.001s" begin="click" fill="freeze" restart="never"/>
    </rect>
    <animateTransform type="scale" values="1 0.3;1 1;1 1" dur="0.5s" begin="click" fill="freeze" restart="never" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1"/>
  </svg>
</section>
```

### 模式 16：链接区域

```html
<foreignObject width="300" height="80" x="390" y="1700">
  <a href="https://example.com" style="display:block; width:100%; height:100%;">
    <span style="opacity:0; display:block; width:100%; height:100%;"></span>
  </a>
</foreignObject>
```

### 模式 17：混合模式光晕

```html
<svg style="mix-blend-mode:screen;">
  <animateTransform type="scale" values="0.9;1.1;0.9" dur="3s" repeatCount="indefinite" begin="0"/>
  <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" begin="0"/>
  <image href="glow.png" width="100%" height="100%"/>
</svg>
```

### 模式 18：逐字/逐段落淡入

```html
<g opacity="0">
  <animate attributeName="opacity" values="0;1;1" dur="1s" begin="click" fill="freeze"/>
</g>
<g opacity="0">
  <animate attributeName="opacity" values="0;1;1" dur="1s" begin="click+1s" fill="freeze"/>
</g>
<g opacity="0">
  <animate attributeName="opacity" values="0;1;1" dur="1s" begin="click+2s" fill="freeze"/>
</g>
<g opacity="0">
  <animate attributeName="opacity" values="0;1;1" dur="1s" begin="click+3s" fill="freeze"/>
</g>
```

---

## 六、常用技巧

### 超长时长冻结

`dur="1000s"` + `fill="freeze"` 让动画在触发后瞬间跳到终态并永久保持：

```html
<animate attributeName="width" values="100%;100%" dur="1000s" begin="click" fill="freeze" restart="never"/>
```

### keyTimes 压缩

`keyTimes="0;0.0003;1"` 让实际过渡发生在时长的 0.03% 内，剩余时间都是冻结态：

```html
<animate attributeName="opacity" values="1;0;0" dur="1000s" keyTimes="0;0.0003;1" begin="click" fill="freeze"/>
```

### 离散跳变（calcMode="discrete"）

逐帧精灵图或瞬间状态切换：

```html
<animateTransform type="translate" values="0 0;-1080 0;-2160 0" dur="0.8s" calcMode="discrete" repeatCount="indefinite" begin="0"/>
```

### translateZ 堆叠

不用 z-index，用 CSS `translateZ(0.01px)` 创建堆叠上下文：

```html
<section style="transform:translateZ(0.01px);">
  <!-- 浮在上层 -->
</section>
```

### fill="remove" 的触摸交互

`fill="remove"` 让动画在结束后恢复初态，适合触摸交互（松手后复位）：

```html
<animateTransform type="translate" values="0 0;0 -5000" dur="30s" begin="touchstart" end="touchend" fill="remove" restart="always"/>
```

---

## 七、begin 触发值速查

| 值 | 含义 | 典型场景 |
|----|------|----------|
| `"0"` | 页面加载即开始 | 自动播放、呼吸动画 |
| `"0.2s"` | 延迟 0.2 秒开始 | 错开多个动画的启动时间 |
| `"click"` | 点击时开始 | 所有用户触发的交互 |
| `"click+1s"` | 点击后延迟 1 秒 | 顺序渐显、多阶段展开 |
| `"touchstart"` | 触摸按下时 | 拖拽、长按效果 |
| `"touchend"` | 触摸松开时 | 回弹、复位 |
| `"touchmove"` | 触摸移动时 | 防误触区分 |

---

## 八、restart 策略选择

| 值 | 行为 | 适用场景 |
|----|------|----------|
| `"never"` | 只触发一次 | 一次性点击展开、不可逆状态切换 |
| `"always"` | 可重复触发 | 可反复操作的按钮、循环交互 |
| `"whenNotActive"` | 非活动时才能重触发 | 防止动画重叠冲突 |

---

## 九、缓动曲线速查

```html
<!-- 标准缓入缓出 -->
keySplines="0.42 0 0.58 1"

<!-- 缓入 -->
keySplines="0.42 0 1 1"

<!-- 缓出 -->
keySplines="0 0 0.58 1"

<!-- 线性（默认） -->
keySplines="0 0 1 1"
```

注意：`keySplines` 的段数必须等于 `values` 的段数减一。5 个 values 需要 4 段 keySplines，用分号分隔。

---

## 十、推荐实现顺序

1. **确定交互类型**：自动播放 / 点击触发 / 触摸交互 / 混合
2. **搭容器骨架**：section 容器 + 零高度堆叠 + z-index
3. **放置静态内容**：背景图、前景图、文字图
4. **添加动画层**：选择对应的动画模式，写入 animate/animateTransform
5. **添加交互层**：点击区域、触摸区域、引导提示
6. **测试验证**：逐层检查动画是否生效、交互是否触发、层级是否正确

---

## 十一、排错清单

| 现象 | 可能原因 | 检查项 |
|------|----------|--------|
| 点击无反应 | 点击区域被遮挡 | 检查 z-index 和 pointer-events |
| 点击无反应 | rect 没设 opacity="0" | rect 必须透明但有 pointer-events |
| 动画不播放 | begin 值错误 | 检查 begin 拼写和时机 |
| 动画一闪而过 | fill 未设 freeze | 一次性动画必须 fill="freeze" |
| 动画可重复触发但不应该 | restart 设为 always | 改为 "never" |
| 图片不显示 | 背景图 URL 错误 | 检查 url() 格式和链接 |
| 图片不显示 | foreignObject 缺少 xmlns | 内层 svg 需要 xmlns 声明 |
| 层级错乱 | 缺少 translateZ | 用 translateZ(0.01px) 创建堆叠上下文 |
| 触摸交互不回弹 | fill 设为 freeze | 触摸交互用 fill="remove" |
| 精灵图闪烁 | calcMode 未设 discrete | 帧动画必须 calcMode="discrete" |
| 视差不生效 | 缺少 perspective | 容器需要 perspective:1px |
| 视差层不动 | 缺少 transform-style | 子容器需要 transform-style:preserve-3d |
| 展开后内容溢出 | 缺少 overflow:hidden | 容器必须 overflow:hidden |
| 动画冲突 | 多个 animateTransform 叠加 | 用 additive="replace" 或拆分到不同层级 |

---

## 十二、性能注意事项

- 同时播放的动画数量控制在 20 个以内
- 精灵图帧数过多（>100 帧）会导致文件体积过大
- 纯矢量插画（14.txt 有 843 个动画）在低端设备可能卡顿
- GIF 作为动画手段时注意文件大小
- 使用 `begin="0.2s"` / `begin="0.5s"` 错开启动时间，避免同时触发大量动画

---

## 十三、完整模板示例

### 最小交互图文

```html
<section style="overflow:hidden; font-size:0px; line-height:0; pointer-events:none; user-select:none; -webkit-tap-highlight-color:transparent; margin-bottom:0px;">
  <!-- 预加载区 -->
  <section style="height:0px; visibility:visible;">
    <svg style="width:100%; background:url(preload.jpg) no-repeat center/100% 100%;"></svg>
  </section>

  <!-- 主内容区 -->
  <section style="height:0;">
    <svg viewBox="0 0 1080 1920" width="100%">
      <!-- 背景层 -->
      <foreignObject width="1080" height="1920">
        <svg xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%; background:url(bg.jpg) no-repeat center/100% 100%;"></svg>
      </foreignObject>

      <!-- 脉冲引导 -->
      <circle cx="540" cy="1600" r="60" fill="none" stroke="#fff" stroke-width="2">
        <animate attributeName="r" values="60;50;60" dur="1.2s" repeatCount="indefinite" begin="0.2s"/>
        <animate attributeName="opacity" values="0.85;0.2;0.85" dur="1.2s" repeatCount="indefinite" begin="0.2s"/>
      </circle>

      <!-- 点击区域 -->
      <g>
        <rect width="1080" height="1920" opacity="0" style="pointer-events:visible;">
          <animate attributeName="x" values="88888888" dur="0.001s" begin="click" fill="freeze" restart="never"/>
        </rect>
        <set attributeName="visibility" from="visible" to="hidden" begin="click" fill="freeze" restart="never"/>

        <!-- 点击后展开的内容 -->
        <svg width="1080" height="1920" opacity="0">
          <animate attributeName="opacity" values="0;1;1" dur="1s" begin="click" fill="freeze" restart="never"/>
          <foreignObject width="1080" height="1920">
            <svg xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%; background:url(content.jpg) no-repeat center/100% 100%;"></svg>
          </foreignObject>
        </svg>
      </g>
    </svg>
  </section>
</section>
```
