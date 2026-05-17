# 公众号 SVG 动画完全指南

基于 30 个实际案例整理的微信公众号 SVG 动画技术总结。

---

## 一、基础容器结构

所有公众号 SVG 动画都包裹在 `<section>` 容器中，关键样式：

```html
<section style="overflow: hidden; font-size: 0px; line-height: 0; pointer-events: none; user-select: none; -webkit-tap-highlight-color: transparent; margin-bottom: 0px;">
  <!-- SVG 内容 -->
</section>
```

**要点：**
- `overflow: hidden` — 隐藏超出内容
- `font-size: 0px; line-height: 0` — 消除行内元素间距
- `pointer-events: none` — 容器本身不响应点击
- `user-select: none` — 禁止选中文字
- `margin-bottom: 0px` — 消除底部间距

---

## 二、图片显示方式

### 方式 1：SVG 背景图（最常用）

```html
<svg style="background: url('图片地址') 0 0 / 100% 100% no-repeat;" 
     viewBox="0 0 1000 2000" role="img" aria-label="插图">
</svg>
```

- `background-size: 100% 100%` — 图片铺满
- `viewBox` — 定义宽高比（宽 高）
- 空 SVG + 背景图 是公众号最常见的图片显示方式

### 方式 2：foreignObject 嵌套

```html
<svg viewBox="0 0 3000 2500" width="300%">
  <foreignObject x="0" y="0" width="1000" height="2500">
    <svg style="background: url('图片地址') 0 0 / 100% 100% no-repeat;" 
         viewBox="0 0 1000 2500">
    </svg>
  </foreignObject>
</svg>
```

- 用于在大 SVG 中精确定位子图
- `x`, `y` 控制子图在父 SVG 中的位置
- `width`, `height` 控制子图尺寸

### 方式 3：image 标签

```html
<svg viewBox="0 0 1000 1000">
  <image href="图片地址" width="1000" height="1000" />
</svg>
```

---

## 三、动画元素详解

### 3.1 `<animate>` — 属性动画

用于动画化单个属性（opacity, width, height, x, y 等）。

```html
<!-- 透明度闪烁 -->
<animate attributeName="opacity" 
         values="0.5;1;0.5;1;0.5" 
         dur="2s" 
         repeatCount="indefinite" />

<!-- 宽度展开 -->
<animate attributeName="width" 
         values="0;1080;1080" 
         dur="6s" 
         fill="freeze" />

<!-- 位移（点击后移走） -->
<animate attributeName="x" 
         values="88888888" 
         dur="0.001s" 
         fill="freeze" 
         restart="never" 
         begin="click" />
```

### 3.2 `<animateTransform>` — 变换动画

用于动画化 transform（translate, scale, rotate）。

```html
<!-- 平移动画 -->
<animateTransform attributeName="transform" 
                  type="translate" 
                  values="0 0;200 100;0 0" 
                  dur="30s" 
                  repeatCount="indefinite" />

<!-- 缩放弹出 -->
<animateTransform attributeName="transform" 
                  type="scale" 
                  values="0.01;1;1" 
                  dur="6s" 
                  fill="freeze" />

<!-- 旋转 -->
<animateTransform attributeName="transform" 
                  type="rotate" 
                  values="0 56 20;360 56 20" 
                  dur="3s" 
                  repeatCount="indefinite" />
```

**rotate 参数说明：** `角度 中心X 中心Y`

### 3.3 calcMode 计算模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| `spline` | 贝塞尔曲线缓动 | 平滑过渡动画 |
| `linear` | 匀速 | 持续滚动 |
| `discrete` | 离散/逐帧 | 精灵图帧动画 |

```html
<!-- spline 缓动示例 -->
<animateTransform calcMode="spline" 
                  keySplines="0.42 0 0.58 1;0.42 0 0.58 1" 
                  values="0 0;200 0;0 0" 
                  dur="2s" />

<!-- discrete 逐帧示例（精灵图） -->
<animateTransform attributeName="transform" 
                  type="translate" 
                  values="0 0;-1080 0;-2160 0" 
                  dur="0.8s" 
                  calcMode="discrete" 
                  repeatCount="indefinite" />
```

---

## 四、交互触发方式

### 4.1 触发时机（begin 属性）

| begin 值 | 触发时机 | 用途 |
|----------|----------|------|
| `0` 或不写 | 页面加载立即播放 | 自动动画 |
| `0.2s` | 延迟播放 | 错开多个动画 |
| `click` | 点击时 | 用户交互 |
| `click+1s` | 点击后 1 秒 | 序列动画 |
| `click+2s` | 点击后 2 秒 | 逐步展示 |
| `touchstart` | 触摸开始 | 滚动触发 |
| `touchend` | 触摸结束 | 回弹效果 |
| `touchmove` | 触摸移动中 | 滚动跟随 |

### 4.2 点击区域实现

```html
<g data-name="点击区域">
  <!-- 隐藏点击区域 -->
  <set attributeName="visibility" from="visible" to="hidden" 
       fill="freeze" restart="never" begin="click" />
  
  <!-- 透明矩形作为点击目标 -->
  <rect x="0" y="0" width="1080" height="2000" 
        fill="#39f" opacity="0" 
        style="pointer-events: visible;">
    <!-- 点击后移走，防止重复点击 -->
    <animate attributeName="x" dur="0.001s" fill="freeze" 
             restart="never" values="88888888" begin="click" />
  </rect>
</g>
```

**关键：**
- `opacity="0"` — 看不见但可点击
- `pointer-events: visible` — 即使透明也响应点击
- 点击后 `x="88888888"` 移到屏幕外
- `visibility="hidden"` 隐藏整个组

### 4.3 点击引导提示

```html
<!-- 脉冲圆圈 -->
<circle opacity="0.2" fill="#ffdfa6" cx="600" cy="1024" r="65">
  <animate attributeName="r" values="65;60;65" dur="1s" repeatCount="indefinite" />
</circle>
<circle opacity="0.2" fill="#ffdfa6" cx="600" cy="1024" r="45">
  <animate attributeName="r" values="40;45;40" dur="1s" repeatCount="indefinite" />
</circle>

<!-- 手势 GIF 指引 -->
<foreignObject x="500" y="927" width="190" height="190">
  <svg style="background: url('手势GIF地址') 0 0 / 100% 100% no-repeat;" 
       viewBox="0 0 190 190">
  </svg>
</foreignObject>
```

---

## 五、布局模式

### 5.1 3D 视差滚动

```html
<section style="overflow: scroll; perspective: 1px; transform-style: preserve-3d;">
  <!-- 背景层（最远，移动最少） -->
  <section style="transform: translateZ(0px) scale(1);">
    <!-- 背景图 -->
  </section>
  
  <!-- 中间层 -->
  <section style="transform: translateZ(0.2px) scale(0.8);">
    <!-- 中间内容 -->
  </section>
  
  <!-- 前景层（最近，移动最多） -->
  <section style="transform: translateZ(0.35px) scale(0.65);">
    <!-- 前景内容 -->
  </section>
</section>
```

**深度与缩放关系：**
| translateZ | scale | 效果 |
|------------|-------|------|
| 0px | 1.0 | 基准层 |
| 0.15px | 0.85 | 稍远 |
| 0.25px | 0.75 | 中等 |
| 0.35px | 0.65 | 较远 |

### 5.2 多屏堆叠

```html
<!-- 屏幕 1 -->
<section style="position: relative; z-index: 9;">
  <!-- 第一屏内容 -->
</section>

<!-- 屏幕 2 -->
<section style="position: relative; z-index: 8;">
  <!-- 第二屏内容 -->
</section>

<!-- 屏幕 3 -->
<section style="position: relative; z-index: 7;">
  <!-- 第三屏内容 -->
</section>
```

### 5.3 折叠/展开卡片

```html
<!-- 折叠状态 -->
<section style="height: 0;">
  <!-- 内容被隐藏 -->
</section>

<!-- 压缩预览 -->
<section style="transform: scale(1, 0.3); transform-origin: left top;">
  <!-- 缩略图预览 -->
</section>
```

### 5.4 无限滚动（跑马灯）

```html
<svg>
  <animateTransform attributeName="transform" type="translate" 
                    values="0 0;0 3840;0 0" 
                    dur="80s" repeatCount="indefinite" />
  <!-- 内容重复两份实现无缝 -->
</svg>
```

---

## 六、高级动画技巧

### 6.1 精灵图帧动画

将多帧图片横向排列，通过 translate 切换：

```html
<svg viewBox="0 0 5400 1080">
  <!-- 5 帧，每帧 1080px 宽 -->
  <animateTransform attributeName="transform" type="translate" 
                    values="0 0;-1080 0;-2160 0;-3240 0;-4320 0" 
                    dur="2s" calcMode="discrete" 
                    repeatCount="indefinite" />
  
  <foreignObject x="0" y="0" width="1080" height="1080">
    <svg style="background: url('帧1') 0 0 / 100% 100% no-repeat;" viewBox="0 0 1080 1080"></svg>
  </foreignObject>
  <foreignObject x="1080" y="0" width="1080" height="1080">
    <svg style="background: url('帧2') 0 0 / 100% 100% no-repeat;" viewBox="0 0 1080 1080"></svg>
  </foreignObject>
  <!-- ... 更多帧 -->
</svg>
```

### 6.2 图片轮播

```html
<svg>
  <!-- 图片 1 -->
  <foreignObject>
    <svg style="background: url('图1') 0 0 / 100% 100% no-repeat;">
      <animate attributeName="opacity" values="1;1;0;0;0;0" 
               keyTimes="0;0.15;0.2;0.8;0.85;1" 
               dur="8s" repeatCount="indefinite" />
    </svg>
  </foreignObject>
  
  <!-- 图片 2 -->
  <foreignObject>
    <svg style="background: url('图2') 0 0 / 100% 100% no-repeat;">
      <animate attributeName="opacity" values="0;0;1;1;0;0" 
               keyTimes="0;0.15;0.2;0.35;0.4;1" 
               dur="8s" repeatCount="indefinite" />
    </svg>
  </foreignObject>
  
  <!-- 更多图片... -->
</svg>
```

### 6.3 黑白→彩色切换

```html
<!-- 黑白层（在上） -->
<svg style="background: url('黑白图') 0 0 / 100% 100% no-repeat;">
  <animate attributeName="width" values="100%;100%;1%" 
           dur="10s" fill="freeze" begin="click" />
</svg>

<!-- 彩色层（在下） -->
<svg style="background: url('彩色图') 0 0 / 100% 100% no-repeat;">
</svg>
```

### 6.4 多阶段展开（多次点击）

```html
<!-- 第一次点击：100% → 182% -->
<!-- 第二次点击：182% → 247% -->
<!-- 第三次点击：247% → 298% -->
<animate attributeName="width" 
         values="100%;182%;182%;247%;247%;298%;298%" 
         keyTimes="0;0.15;0.33;0.5;0.66;0.85;1" 
         dur="10s" fill="freeze" begin="click" />
```

### 6.5 GIF 叠加层

```html
<svg style="background: url('GIF地址') 0 0 / 100% 100% no-repeat;" 
     viewBox="0 0 1080 2052">
</svg>
```

GIF 在公众号中会自动播放，适合做手势指引、动态装饰。

### 6.6 混合模式（发光效果）

```html
<svg style="mix-blend-mode: screen;">
  <!-- 太阳/光源图层 -->
</svg>
```

常用值：`screen`（滤色）、`lighten`（变亮）

### 6.7 链接嵌入

```html
<foreignObject x="0" y="0" width="200" height="100">
  <a href="链接地址" target="_blank">
    <span style="display: block; width: 200px; height: 100px;"></span>
  </a>
</foreignObject>
```

---

## 七、常用属性速查

### fill 属性
| 值 | 含义 |
|----|------|
| `freeze` | 动画结束后保持最终状态 |
| `remove` | 动画结束后恢复初始状态（默认） |

### restart 属性
| 值 | 含义 |
|----|------|
| `always` | 随时可重新触发（默认） |
| `never` | 只播放一次 |
| `whenNotActive` | 当前动画结束后才能重新触发 |

### keySplines 缓动曲线
| 曲线 | 值 | 效果 |
|------|----|------|
| ease | `0.42 0 0.58 1` | 先慢后快再慢（最常用） |
| ease-in | `0.42 0 1 1` | 先慢后快 |
| ease-out | `0 0 0.58 1` | 先快后慢 |
| linear | `0 0 1 1` | 匀速 |

---

## 八、完整动画模板结构

```html
<section style="overflow: hidden; font-size: 0px; line-height: 0; pointer-events: none; user-select: none; -webkit-tap-highlight-color: transparent;">
  
  <!-- 1. 预加载区（隐藏） -->
  <section style="height: 0px;">
    <!-- 预加载图片 -->
    <svg style="background: url('preload.png') 0 0 / 100% 100% no-repeat;" 
         viewBox="0 0 1000 1000"></svg>
  </section>
  
  <!-- 2. 主内容区 -->
  <section style="height: 0;">
    <svg viewBox="0 0 1000 2000" style="display: block;">
      
      <!-- 背景层 -->
      <foreignObject x="0" y="0" width="1000" height="2000">
        <svg style="background: url('bg.png') 0 0 / 100% 100% no-repeat;" 
             viewBox="0 0 1000 2000"></svg>
      </foreignObject>
      
      <!-- 动画元素 -->
      <g>
        <animateTransform attributeName="transform" type="translate" 
                          values="0 0;50 0;0 0" dur="3s" 
                          repeatCount="indefinite" />
        <!-- 元素内容 -->
      </g>
      
      <!-- 点击交互区 -->
      <g data-name="点击区域">
        <set attributeName="visibility" from="visible" to="hidden" 
             fill="freeze" restart="never" begin="click" />
        <rect x="0" y="0" width="1000" height="500" fill="#39f" opacity="0" 
              style="pointer-events: visible;">
          <animate attributeName="x" dur="0.001s" fill="freeze" 
                   restart="never" values="88888888" begin="click" />
        </rect>
      </g>
      
    </svg>
  </section>
  
</section>
```

---

## 九、常见动画效果速查

| 效果 | 实现方式 |
|------|----------|
| 闪烁/脉冲 | `animate opacity values="0.5;1;0.5"` |
| 弹出 | `animateTransform scale values="0.01;1;1"` |
| 旋转 | `animateTransform rotate values="0 X Y;360 X Y"` |
| 漂移 | `animateTransform translate values="0 0;200 100;0 0"` |
| 展开 | `animate width values="0;1080;1080"` |
| 平移入 | `animateTransform translate values="-1080 0;0 0"` |
| 回弹 | `animateTransform translate values="0 0;0 20;0 0"` |
| 渐隐 | `animate opacity values="1;0;0"` |
| 逐帧 | `animateTransform translate calcMode="discrete"` |
| 跑马灯 | `animateTransform translate values="0 0;0 H;0 0" repeatCount="indefinite"` |

---

## 十、注意事项

1. **微信限制**：公众号 SVG 不支持 JavaScript，所有交互只能通过 SMIL 动画的 begin 属性实现
2. **点击一次**：大多数交互只能触发一次（`restart="never"`），设计时注意
3. **图片尺寸**：使用 `viewBox` 定义比例，实际显示由容器宽度决定
4. **性能**：过多动画元素会导致卡顿，控制同时播放的动画数量
5. **兼容性**：部分 SMIL 属性在不同浏览器表现略有差异
6. **预加载**：使用 `height: 0px` 的 section 预加载图片，避免动画开始时的闪烁
