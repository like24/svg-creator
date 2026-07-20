# 微信公众号 SVG 视差滚动深度分析

> 来源: dongdianjun.com 案例库 (645 个文件)
> 分析日期: 2026-06-06

---

## 一、视差滚动的两种实现方式

### 方式 A：CSS Perspective 视差（2 个文件）

**原理**：利用 CSS 3D 透视（`perspective` + `translateZ`）让不同层以不同速度滚动。

**核心代码：**

```html
<!-- 滚动容器 -->
<section style="overflow: hidden scroll;
                perspective: 1px;           <!-- 关键：透视距离 -->
                pointer-events: painted;">

  <!-- 3D 空间 -->
  <section style="transform-style: preserve-3d;">

    <!-- 前景层（正常速度） -->
    <section style="transform: translateZ(0px) scale(1);">
      <svg viewBox="0 0 1080 8289">
        <!-- 大图内容 -->
      </svg>
    </section>

    <!-- 背景层（慢速，产生视差） -->
    <section style="transform: translateZ(-2.6px) scale(3.6);">
      <svg viewBox="0 0 1080 300">
        <!-- 缩略图内容 -->
      </svg>
    </section>

  </section>
</section>
```

**关键参数：**

| 参数 | 作用 | 公式 |
|------|------|------|
| `perspective: 1px` | 透视距离，控制视差强度 | 值越小视差越强 |
| `translateZ(-Npx)` | 层的深度，负值=更远 | 负值越大，滚动越慢 |
| `scale(M)` | 缩放补偿 | M = 1 + (-translateZ / perspective) |

**计算示例：**
```
perspective = 1px
translateZ = -2.6px
scale = 1 + (2.6 / 1) = 3.6
```

**效果**：前景以正常速度滚动，背景以 1/3.6 的速度滚动，产生深度感。

---

### 方式 B：SMIL 速度差视差（209 个文件）

**原理**：多个元素用不同的 `dur`（时长）做相同的位移动画，速度差产生视差效果。

**核心代码：**

```xml
<!-- 背景层（慢速，10秒完成） -->
<g>
  <animateTransform attributeName="transform" type="translate"
                    values="0 0; -1080 0"
                    dur="10s"
                    repeatCount="indefinite"/>
  <foreignObject>
    <!-- 背景图 -->
  </foreignObject>
</g>

<!-- 前景层（快速，5秒完成） -->
<g>
  <animateTransform attributeName="transform" type="translate"
                    values="0 0; -1080 0"
                    dur="5s"
                    repeatCount="indefinite"/>
  <foreignObject>
    <!-- 前景图 -->
  </foreignObject>
</g>
```

**关键参数：**

| 参数 | 作用 | 公式 |
|------|------|------|
| `dur` | 动画时长 | 值越大，速度越慢 |
| `values` | 位移范围 | 前景和背景用相同的范围 |
| `repeatCount` | 循环次数 | indefinite = 无限循环 |

**速度公式：**
```
速度 = 位移范围 / dur
前景速度 = 1080 / 5s = 216 px/s
背景速度 = 1080 / 10s = 108 px/s
速度比 = 2:1（前景比背景快一倍）
```

---

## 二、SMIL 视差的细分类型

### 2.1 飘落效果（257 个文件）

**场景**：红包雨、雪花飘落、节日装饰

**核心代码：**

```xml
<g>
  <animateTransform attributeName="transform" type="translate"
                    values="700 -200; 700 1800"
                    dur="4.2s"
                    repeatCount="indefinite"
                    begin="-1s"/>
  <foreignObject>
    <!-- 飘落元素 -->
  </foreignObject>
</g>
```

**关键点：**
- `values="X -200; X 1800"` — 从顶部飘到底部
- `begin="-1s"` — 负值让动画提前开始，避免所有元素同时出现
- 不同元素用不同的 `dur` 和 `begin` 值，产生随机感

**参数公式：**
```
X = 随机水平位置 (0-1080)
起始 Y = -200 (屏幕上方)
结束 Y = 1800 (屏幕下方)
dur = 3-7s (飘落速度)
begin = -1 到 -5s (错开起始时间)
```

---

### 2.2 浮动/呼吸效果（288 个文件）

**场景**：装饰元素轻微晃动、云朵飘动

**核心代码：**

```xml
<g>
  <animateTransform attributeName="transform" type="translate"
                    values="0 0; 0 -30; 0 0"
                    dur="1s"
                    repeatCount="indefinite"/>
  <foreignObject>
    <!-- 浮动元素 -->
  </foreignObject>
</g>
```

**关键点：**
- `values="0 0; 0 -30; 0 0"` — 轻微上下移动
- `dur="1s"` — 快速循环
- 位移量小（30px 以内）

**参数公式：**
```
位移范围 = ±30px (可调整)
dur = 1-3s (呼吸频率)
```

---

### 2.3 横向滚动（299 个文件）

**场景**：横向画廊、产品展示

**核心代码：**

```xml
<g>
  <animateTransform attributeName="transform" type="translate"
                    values="0 0; -1080 0"
                    dur="10s"
                    repeatCount="indefinite"/>
  <foreignObject>
    <!-- 横向内容 -->
  </foreignObject>
</g>
```

**关键点：**
- `values="0 0; -1080 0"` — 水平位移一个页面宽度
- `dur="10s"` — 慢速滚动
- 多个元素用不同 `dur` 产生视差

---

### 2.4 入场动画（95 个文件）

**场景**：元素从屏幕外飞入

**核心代码：**

```xml
<g>
  <animateTransform attributeName="transform" type="translate"
                    values="0 0; -2000 0; -2000 0"
                    dur="100s"
                    begin="click"
                    fill="freeze"/>
  <foreignObject>
    <!-- 入场元素 -->
  </foreignObject>
</g>
```

**关键点：**
- `values="0 0; -2000 0; -2000 0"` — 从原位飞到屏幕外
- `begin="click"` — 点击触发
- `fill="freeze"` — 保持最终状态

---

## 三、视差效果的组合使用

### 3.1 多层视差叠加

```xml
<!-- 层1：背景（最慢） -->
<g>
  <animateTransform type="translate" values="0 0; -1080 0" dur="20s" repeatCount="indefinite"/>
  <foreignObject><!-- 背景 --></foreignObject>
</g>

<!-- 层2：中景（中速） -->
<g>
  <animateTransform type="translate" values="0 0; -1080 0" dur="10s" repeatCount="indefinite"/>
  <foreignObject><!-- 中景 --></foreignObject>
</g>

<!-- 层3：前景（最快） -->
<g>
  <animateTransform type="translate" values="0 0; -1080 0" dur="5s" repeatCount="indefinite"/>
  <foreignObject><!-- 前景 --></foreignObject>
</g>
```

**效果**：三层以不同速度移动，产生深度感。

### 3.2 飘落 + 浮动组合

```xml
<!-- 飘落元素 -->
<g>
  <animateTransform type="translate" values="700 -200; 700 1800" dur="4.2s" repeatCount="indefinite"/>
  <!-- 叠加旋转 -->
  <animateTransform type="rotate" values="0 35 31; 360 35 31" dur="2s" repeatCount="indefinite"/>
  <foreignObject><!-- 飘落物 --></foreignObject>
</g>
```

**效果**：元素飘落的同时旋转，更自然。

---

## 四、技术细节

### 4.1 begin 负值的作用

```xml
begin="-1s"
```

**作用**：让动画提前 1 秒开始，避免页面加载时所有元素同时出现。

**公式**：`begin = -N`，N 越大，元素出现越早。

### 4.2 values 的三段式

```xml
values="0 0; -2000 0; -2000 0"
```

**含义**：
- 第 1 段：`0 0` → 起始位置
- 第 2 段：`-2000 0` → 飞到屏幕外
- 第 3 段：`-2000 0` → 保持在屏幕外

**用途**：让元素飞出后不再回来。

### 4.3 additive="sum"

```xml
<animateTransform type="translate" ... additive="sum"/>
<animateTransform type="rotate" ... additive="sum"/>
```

**作用**：多个 animateTransform 叠加，而不是替换。

**效果**：元素同时位移和旋转。

### 4.4 calcMode="spline"

```xml
calcMode="spline"
keySplines="0.42 0 0.58 1"
```

**作用**：控制动画的缓动曲线，让运动更自然。

**常用曲线：**
- `0.42 0 0.58 1` — ease（默认）
- `0 0 1 1` — linear（线性）
- `0.25 0.1 0.25 1` — ease-in-out

---

## 五、CSS 视差 vs SMIL 视差对比

| 特性 | CSS 视差 | SMIL 视差 |
|------|----------|-----------|
| 实现方式 | perspective + translateZ | 不同 dur 的 translate |
| 滚动触发 | 用户滚动页面 | 自动播放或点击触发 |
| 视差强度 | 通过 perspective 控制 | 通过 dur 比值控制 |
| 性能 | GPU 加速，流畅 | 依赖浏览器 SMIL 支持 |
| 兼容性 | 现代浏览器 | 微信内置浏览器支持 |
| 文件数 | 2 个 | 209 个 |

---

## 六、总结

### 核心规律

1. **SMIL 速度差是主流**：209/212 个视差文件使用 SMIL，仅 2 个用 CSS
2. **飘落效果最常见**：257 个文件，用于节日装饰、红包雨
3. **浮动/呼吸次之**：288 个文件，用于装饰元素
4. **横向滚动第三**：299 个文件，用于画廊展示
5. **begin 负值是关键**：让元素错开出现，避免同时出现

### 速度差公式

```
视差效果 = 相同位移范围 + 不同 dur 值

前景速度 = 位移 / dur_foreground
背景速度 = 位移 / dur_background
速度比 = dur_background / dur_foreground
```

### 设计原则

- **三层原则**：背景（慢）、中景（中）、前景（快）
- **错开原则**：用 begin 负值让元素错开出现
- **循环原则**：repeatCount="indefinite" 实现无限循环
- **自然原则**：用 calcMode="spline" 让运动更自然
