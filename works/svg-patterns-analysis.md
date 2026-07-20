# 微信公众号 SVG 交互案例规律总结

> 来源: dongdianjun.com 案例库 (645 个文件)
> 分析日期: 2026-06-06

---

## 一、外层布局结构

### 1.1 整体结构

所有案例的 HTML 结构一致：

```
<body>
  <div>                          ← 642/645 个文件用 div 包裹
    <section>                    ← 微信编辑器的 section 容器
      <section>                  ← 嵌套 section 控制布局
        <svg viewBox="...">      ← 核心 SVG 画布
          <g>                    ← 分组
            <foreignObject>      ← 嵌入图片/内容
            <animate>            ← 动画
          </g>
        </svg>
      </section>
    </section>
  </div>
</body>
```

**关键发现：**
- 642/645 个文件最外层是 `<div>`，仅 3 个用 `<section>`
- 每个"页面"由一个独立的 `<svg>` 标签承载
- 多个 SVG 纵向堆叠，形成完整长页面
- SVG 数量从 1 个到 516 个不等（中位数约 20-30 个）

### 1.2 单个 SVG 的标准结构

```xml
<svg viewBox="0 0 1080 H"
     style="display: block;
            width: 100%;
            margin-top: -1px;
            background-image: url(...);
            background-size: 100% 100%;
            pointer-events: none;">
  <g>
    <foreignObject width="1080" height="H" x="0" y="0">
      <span leaf="">
        <img style="width: 100%; pointer-events: none;">
      </span>
    </foreignObject>
  </g>
  <g>
    <!-- 动画元素 -->
  </g>
</svg>
```

**核心规律：**
- `viewBox` 宽度统一为 `1080`（微信标准宽度）
- `margin-top: -1px` 消除相邻 SVG 之间的间隙
- `background-image` 承载背景图
- `foreignObject` 嵌入图片内容
- `pointer-events: none` 禁止默认交互（需要交互的元素单独设置）

### 1.3 viewBox 高度分布

| 比例类型 | 数量 | 说明 |
|---------|------|------|
| 长图 (1.5-3:1) | 255 | 最常见，适合手机阅读 |
| 方形 (0.8-1.5:1) | 226 | 适合展示类内容 |
| 横向 (<0.8:1) | 95 | 横向滚动/特殊布局 |
| 超长图 (>3:1) | 67 | 极端长图 |

---

## 二、交互方式分类

### 2.1 总览

| 交互类型 | 数量 | 占比 |
|---------|------|------|
| 点击触发动画 (set+animate) | 383 | 59.4% |
| 自动播放动画 | 80 | 12.4% |
| 静态/纯展示 | 74 | 11.5% |
| 点击触发动画 (纯animate) | 69 | 10.7% |
| 其他动画 | 23 | 3.6% |
| 触摸触发 | 16 | 2.5% |

---

### 2.2 点击触发动画 (set+animate) — 383 个文件

**这是最核心、最常用的模式。**

#### 实现原理

```
用户点击 → set 切换 visibility → 触发动画 → 动画结束
```

#### 核心代码模板

```xml
<g>
  <!-- 第一层：点击触发区域 -->
  <rect width="100%" height="100%" style="pointer-events: visiblePainted; opacity: 0;">
    <!-- 点击后隐藏自身 -->
    <set attributeName="height" to="0" begin="click" fill="freeze"/>
  </rect>

  <!-- 第二层：初始隐藏的内容 -->
  <g opacity="0">
    <!-- 点击后显示 -->
    <animate attributeName="opacity" from="0" to="1"
             begin="click" dur="0.3s" fill="freeze"/>
    <!-- 点击后执行动画 -->
    <animateTransform attributeName="transform" type="translate"
                      values="0 0; 0 -100" begin="click" dur="0.5s" fill="freeze"/>
    <foreignObject>
      <!-- 内容 -->
    </foreignObject>
  </g>
</g>
```

#### 关键机制

1. **set 元素**：一次性切换属性值（通常是 visibility 或 height）
2. **animate 元素**：平滑过渡动画
3. **fill="freeze"**：动画结束后保持最终状态
4. **pointer-events**：控制点击区域

#### 常见变体

**变体 A：点击展开（最常见）**
- 点击后 SVG 宽度/高度从 100% 展开到更大值
- 配合 opacity 动画实现淡入效果

**变体 B：点击切换图片**
- 点击后当前图片隐藏，新图片显示
- 使用 visibility 或 opacity 切换

**变体 C：点击触发序列动画**
- 点击后按顺序播放多个动画
- 使用 `begin="click+0.5s"` 延迟触发

---

### 2.3 点击触发动画 (纯animate) — 69 个文件

#### 实现原理

```
用户点击 → animate 直接触发 → 动画播放
```

#### 与 set+animate 的区别

- 不使用 set 元素
- 直接用 animate 的 begin="click" 触发
- 通常用于简单的单步动画

#### 核心代码模板

```xml
<g>
  <animateTransform attributeName="transform" type="translate"
                    values="0 0; 0 -200"
                    begin="click" dur="0.5s" fill="freeze"/>
  <foreignObject>
    <!-- 内容 -->
  </foreignObject>
</g>
```

---

### 2.4 自动播放动画 — 80 个文件

#### 实现原理

```
页面加载 → 动画自动开始 → 循环/播放一次
```

#### 核心代码模板

```xml
<g>
  <!-- 无限循环 -->
  <animateTransform attributeName="transform" type="translate"
                    values="0 0; 0 1000"
                    dur="3s" repeatCount="indefinite"/>

  <!-- 延迟后播放一次 -->
  <animate attributeName="opacity" from="0" to="1"
           begin="2s" dur="1s" fill="freeze"/>
</g>
```

#### 常见应用

1. **飘落效果**：多个元素以不同速度/方向飘落
2. **呼吸效果**：元素持续缩放/透明度变化
3. **入场动画**：页面加载后元素依次出现

---

### 2.5 触摸触发 — 16 个文件

#### 实现原理

```
用户触摸(touchstart) → 触发动画 → 动画播放
```

#### 核心代码模板

```xml
<g>
  <!-- 触摸时缩放 -->
  <animateTransform attributeName="transform" type="scale"
                    values="1; 0.9; 1"
                    begin="touchstart" dur="0.2s"
                    calcMode="spline" keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"/>
</g>
```

#### 与点击的区别

- 使用 `touchstart` 而非 `click`
- 通常用于"按下"效果（缩放、位移）
- 松手后恢复原状

---

### 2.6 静态/纯展示 — 74 个文件

#### 特点

- 无 SMIL 动画
- 纯图片展示
- 可能有 CSS 动画或 JS 交互

---

## 三、动画效果详解

### 3.1 动画属性分布

| 属性 | 文件数 | 用途 |
|------|--------|------|
| transform | 485 | 位移、旋转、缩放 |
| opacity | 480 | 透明度变化 |
| x | 377 | 水平位移 |
| width | 369 | 宽度变化（展开/收起） |
| height | 115 | 高度变化 |
| r | 31 | 圆形半径 |
| stroke-dashoffset | 12 | 路径描边动画 |
| stroke-width | 8 | 线条粗细变化 |

### 3.2 animateTransform 类型分布

| 类型 | 文件数 | 用途 |
|------|--------|------|
| translate | 472 | 位移 |
| scale | 163 | 缩放 |
| rotate | 76 | 旋转 |
| skewY | 4 | 倾斜 |

### 3.3 核心动画模式

#### 模式 A：展开动画

```xml
<animate attributeName="width" from="100%" to="500%"
         begin="click" dur="0.5s" fill="freeze"/>
```

**原理**：改变 SVG 宽度，配合 `overflow: hidden` 实现展开效果。

#### 模式 B：位移动画

```xml
<animateTransform attributeName="transform" type="translate"
                  values="0 0; 0 -500"
                  begin="click" dur="0.5s" fill="freeze"/>
```

**原理**：通过平移让内容"滚出"或"滚入"视野。

#### 模式 C：透明度动画

```xml
<animate attributeName="opacity" from="0" to="1"
         begin="click" dur="0.3s" fill="freeze"/>
```

**原理**：淡入/淡出效果，常与位移配合使用。

#### 模式 D：缩放动画

```xml
<animateTransform attributeName="transform" type="scale"
                  values="1; 1.2; 1"
                  begin="click" dur="0.3s"/>
```

**原理**：点击时的"按压"反馈效果。

#### 模式 E：旋转动画

```xml
<animateTransform attributeName="transform" type="rotate"
                  values="0; 360"
                  dur="2s" repeatCount="indefinite"/>
```

**原理**：持续旋转，常用于 loading 或装饰元素。

#### 模式 F：路径描边动画

```xml
<animate attributeName="stroke-dashoffset" from="1000" to="0"
         dur="2s" fill="freeze"/>
```

**原理**：模拟"画线"效果，常用于轨迹运动。

---

## 四、关键技术细节

### 4.1 foreignObject 的作用

foreignObject 是 SVG 中嵌入 HTML 内容的桥梁：

```xml
<foreignObject width="1080" height="1000" x="0" y="0">
  <span leaf="">
    <img style="width: 100%; pointer-events: none;">
  </span>
</foreignObject>
```

**用途：**
- 在 SVG 中嵌入图片
- 实现图片的精确裁剪和定位
- 配合动画实现图片的移动/缩放

### 4.2 pointer-events 的控制

- `pointer-events: none` — 禁止交互（背景、装饰元素）
- `pointer-events: visiblePainted` — 允许交互（点击区域）
- `pointer-events: painted` — 允许交互（有填充的元素）

### 4.3 fill="freeze" vs fill="remove"

- `fill="freeze"` — 动画结束后保持最终状态（最常用）
- `fill="remove"` — 动画结束后恢复初始状态

### 4.4 calcMode 和 keySplines

```xml
calcMode="spline"
keySplines="0.42 0 0.58 1"
```

**作用**：控制动画的缓动曲线，实现更自然的运动效果。

### 4.5 restart="never"

```xml
<animate ... restart="never" fill="freeze"/>
```

**作用**：防止动画被重复触发，确保一次性效果。

---

## 五、布局模式详解

### 5.1 纵向堆叠模式（最常见）

```
┌─────────────┐
│   SVG #1    │  ← 背景图 + 动画
├─────────────┤
│   SVG #2    │  ← 背景图 + 动画
├─────────────┤
│   SVG #3    │  ← 背景图 + 动画
├─────────────┤
│    ...      │
└─────────────┘
```

**特点：**
- 每个 SVG 独立成"页"
- `margin-top: -1px` 消除间隙
- 宽度统一 1080，高度自适应

### 5.2 嵌套 SVG 模式

```
┌─────────────────────┐
│  外层 SVG (1080×H)  │
│  ┌───────────────┐  │
│  │ 内层 SVG      │  │  ← 动画元素
│  │ (1080×h)      │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │ 内层 SVG      │  │  ← 背景图
│  │ (1080×h)      │  │
│  └───────────────┘  │
└─────────────────────┘
```

**特点：**
- 外层 SVG 控制整体布局
- 内层 SVG 承载具体内容
- 实现图层叠加效果

### 5.3 横向滚动模式

```
┌─────────────────────────────────────┐
│  SVG (宽:高 = 1:3 或更宽)          │
│  ┌─────┬─────┬─────┬─────┐         │
│  │ 图1 │ 图2 │ 图3 │ 图4 │         │
│  └─────┴─────┴─────┴─────┘         │
└─────────────────────────────────────┘
```

**特点：**
- viewBox 宽度远大于高度
- 用户左右滑动浏览
- 常用于产品展示、画廊

---

## 六、常见交互场景

### 6.1 点击展开长图

**场景**：点击后显示完整内容
**实现**：SVG 宽度从 100% 展开到 N%

### 6.2 点击切换图片

**场景**：点击查看下一张图
**实现**：opacity/visibility 切换

### 6.3 点击弹出海报

**场景**：点击后全屏显示图片
**实现**：scale 放大 + position 定位

### 6.4 自动飘落效果

**场景**：节日装饰、红包雨
**实现**：多个元素以不同速度 translate 循环

### 6.5 视差滚动

**场景**：多层背景不同速度移动
**实现**：多个 translate 以不同 dur 值

### 6.6 轨迹运动

**场景**：元素沿路径移动
**实现**：stroke-dashoffset 动画

### 6.7 序列帧动画

**场景**：逐帧播放动画
**实现**：多个 image 依次显示/隐藏

---

## 七、总结

### 核心规律

1. **布局统一**：所有案例都用 div > section > SVG 的结构
2. **宽度固定**：SVG viewBox 宽度统一为 1080
3. **点击为主**：59.4% 的案例使用点击触发
4. **set+animate 是王道**：最常用的交互组合
5. **foreignObject 嵌图**：所有图片都通过 foreignObject 嵌入
6. **fill="freeze"**：动画结束后保持状态

### 技术栈

- **纯 SMIL 动画**：不依赖 JS，兼容性好
- **CSS 辅助**：用于基础样式和简单动画
- **极少量 JS**：仅 1 个文件使用了 JavaScript

### 设计原则

- **一个 SVG 一个"页面"**：模块化设计
- **背景图 + 动画分离**：背景用 background-image，动画用 SMIL
- **点击区域透明**：用 opacity:0 的 rect 做点击热区
- **动画链式触发**：通过 begin="id.end" 实现序列动画
