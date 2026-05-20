# 微信公众号 SVG 动画排版模式库

> 目标：把 `source/` 目录里的公众号 SVG 动画源码沉淀成可持续迭代的布局知识库。后续每新增一批案例，按本文的「迭代记录模板」补充即可。

更新时间：2026-05-19  
样本范围：`source/*.html`，共约 60 篇，8.4MB。  
重点样本：`腕间「蓝」主角.html`、`【SVG】最高检工作报告中的民生答卷.html`、`你好，2026.html`、`点击，给非遗换上新“皮肤”.html`、`2025识典古籍年度数据报告，来了.html`、`Emporio Armani 2026 春夏腕表与配饰系列广告大片.html`、`组队，闯关2020！.html`。

## 1. 总体结论

公众号 SVG 动画的排版逻辑，本质是「用 HTML 容器控流，用 SVG 坐标控画面，用 SMIL 控状态」。常见作品并不依赖 JS，而是把交互拆成：

- 外层 `section` 控制公众号正文流、裁切、滚动、居中、零高度叠层。
- `svg viewBox` 建立设计稿坐标系，通常为 `1080` 宽、`640` 宽、`750` 宽或 `345` 宽。
- 图片资源用 `background-image`、`image href` 或 `foreignObject > svg` 承载。
- 互动用透明 `rect` 或 `a` 热区接收点击/触摸。
- 状态切换用 `animateTransform`、`animate`、`set` 完成，常见触发为 `click`、`touchstart`、`touchmove`。
- 复杂动效常把多帧图片横向排在远处，用 `translate(-1000 0)` 一格一格切帧。
- 文章纵向高度靠 SVG 自身比例、占位空 SVG、`padding-top` 或滚动容器共同撑开。

最重要的工程习惯：所有视觉块都要明确「占位层、视觉层、交互层」三者关系。很多案例看起来混乱，是因为这三层被压成一行导出代码，但结构仍然一致。

## 2. 画布与坐标体系

### 2.1 固定设计宽度

常见宽度：

- `1080`：品牌、电商、长图型案例最常见，适合高清切图，微信内按 `width:100%` 缩放。
- `640`：GIF 或较早素材常见。
- `750`：手写长 SVG 或移动端设计稿常见，如 `组队，闯关2020！.html`。
- `345`：部分编辑器按公众号可视宽度导出，很多 `mmecoa` 案例使用 `viewBox="0 0 345 ..."`。

排版原则：

```html
<svg style="display:block;width:100%;line-height:0;" viewBox="0 0 1080 1920"></svg>
```

`viewBox` 决定比例，`width:100%` 决定响应式缩放，SVG 高度由宽高比自动计算。不要用正文段落间距去控制 SVG 间距。

### 2.2 高度由比例产生

例如 `viewBox="0 0 1080 495"` 在微信正文宽度下自动生成 `495 / 1080` 的高度。长页通常是多个 SVG 纵向拼接：

```html
<svg viewBox="0 0 1080 495" style="display:block;margin-top:-1px"></svg>
<svg viewBox="0 0 1080 985" style="display:block;margin-top:-1px"></svg>
```

`margin-top:-1px` 是高频技巧，用来压掉图片切片之间的 1px 白缝。

### 2.3 `preserveAspectRatio`

常见取值：

- `xMidYMin meet`：保持比例，顶部对齐，完整显示。适合普通长图。
- `xMidYMin slice`：保持比例并裁切，适合覆盖式层叠或全屏视觉。
- `xMinYMin meet`：左上对齐，适合横向长画布滑动。

横滑内容经常写成：

```html
<svg preserveAspectRatio="xMinYMin meet"
     viewBox="0 0 3459 1080"
     style="display:block;max-width:none!important;"
     width="160%">
</svg>
```

关键是 `max-width:none!important`，否则微信正文会把超宽 SVG 限回 100%，横滑失效。

## 3. 基础布局分类

### 3.1 长图拼接型

代表：`【SVG】最高检工作报告中的民生答卷.html`、大量报告/品牌介绍类文章。

结构：

- 外层 `section`：`overflow:hidden;margin-bottom:-1px`。
- 一个或多个 SVG：`display:inline-block;width:100%;vertical-align:top`。
- 每段用 `foreignObject` 或 `image` 放图片。
- 多个切片在一个大 SVG 内通过 `y` 坐标拼接，或多个 SVG 直接堆叠。

适用：

- 信息长图、报告、品牌大片。
- 交互少，重点是顺滑阅读。

注意：

- 每个切片之间 `y` 坐标常故意重叠 1px，如第二段从 `2303` 接上一段 `2304`，避免缝隙。
- 用 `pointer-events:none` 保证滚动不被 SVG 拦截。

### 3.2 零高叠层型

代表：`腕间「蓝」主角.html`、`2025识典古籍年度数据报告，来了.html`、`Emporio Armani...html`。

结构：

```html
<section style="height:0;line-height:0;overflow:visible">
  <!-- 浮在正常文档流上方的视觉或交互层 -->
</section>
<svg viewBox="0 0 1080 1920" style="display:block;pointer-events:none"></svg>
```

逻辑：

- 零高层负责叠加视觉、热区或滚动容器。
- 后面的空 SVG 负责撑开真实高度。
- 这样可以让交互层覆盖在占位层上方，而不额外增加页面高度。

适用：

- 顶层滑动。
- 首屏覆盖点击层。
- 复杂互动的遮罩、提示、状态层。

风险：

- 忘记占位 SVG 会导致后续内容顶上来。
- 零高层 `overflow:hidden` 会裁掉本应露出的叠层。
- 叠层要结合 `pointer-events`，否则会挡住滚动或点击。

### 3.3 原生纵向滚动容器

代表：`腕间「蓝」主角.html`、`2025识典古籍年度数据报告，来了.html`、部分礼品/报告类。

典型写法：

```html
<section style="width:100%;height:160vw;overflow-y:auto;pointer-events:visible;">
  <!-- 内部多张 SVG 纵向拼接 -->
</section>
```

逻辑：

- 外层文章不动，内部局部容器滚动。
- 高度用 `vw` 绑定屏宽，如 `160vw` 接近一屏竖版体验。
- 内部素材仍按 SVG 比例排版。

适用：

- 画中画滚动。
- 手机屏幕/卷轴/档案袋等拟物容器。

注意：

- 容器必须 `pointer-events:visible` 或 `auto`，内部才能拖动。
- 背景或占位层通常设为 `pointer-events:none`。
- iOS 下横/纵滚动容器建议加 `-webkit-overflow-scrolling:touch`。

### 3.4 横向滑动型

代表：`腕间「蓝」主角.html`、`Emporio Armani...html`、`2025识典古籍年度数据报告，来了.html`。

有两种主流：

1. 普通横滑长画布：

```html
<section style="-webkit-overflow-scrolling:touch;overflow-x:scroll;">
  <svg viewBox="0 0 2798 1080" width="150%"
       style="display:block;max-width:none!important"></svg>
</section>
```

2. 吸附分页横滑：

```html
<section style="overflow:scroll hidden;scroll-snap-type:x mandatory;">
  <section style="white-space:nowrap;width:500%!important;display:flex;">
    <section style="width:20%;scroll-snap-align:center"></section>
  </section>
</section>
```

适用：

- 多产品卡片。
- 横向画廊。
- 分页式品牌大片。

注意：

- 横滑容器需要显式超宽内容。
- 子项宽度要和组数匹配，5 组就是 `width:500%` + 子项 `20%`。
- 如果横滑里还有链接，链接热区要设 `pointer-events:visible`。

### 3.5 分栏拼接型

代表：`腕间「蓝」主角.html`、`Emporio Armani...html`。

典型结构：

```html
<section style="display:flex;line-height:0;overflow:hidden;">
  <section style="width:50%;line-height:0">...</section>
  <section style="width:50%;line-height:0">...</section>
</section>
```

常见变体：

- 二分栏：`width:50%`
- 四分栏：`width:25%`
- 等分图标入口、社交媒体入口、产品入口

注意：

- 每个子 SVG 的 `viewBox` 宽度应按列宽设计，例如二分栏用 `540`，四分栏用 `270`，总宽仍对应 `1080`。
- 所有子项 `line-height:0`，避免基线空隙。

## 4. 交互与状态机分类

### 4.1 点击切换型

代表：`腕间「蓝」主角.html`。

结构：

```html
<svg viewBox="0 0 1080 1350" style="overflow:hidden">
  <g>
    <foreignObject x="0" y="0" width="100%" height="100%">初始图</foreignObject>
    <foreignObject x="3240" y="0" width="100%" height="100%">结果图</foreignObject>
    <animateTransform attributeName="transform"
      type="translate"
      values="0 0;-3240 0;-3240 0"
      keyTimes="0;0.0000001;1"
      begin="click"
      dur="100s"
      calcMode="discrete"
      fill="freeze"
      restart="never"/>
  </g>
</svg>
```

逻辑：

- 初始态放在可视区。
- 目标态放在远处，如 `x=1920`、`x=3240`。
- 点击后整组瞬移，把目标态移入视口。
- `dur` 很长，`keyTimes` 极小，实际效果是瞬间切换并冻结。

适用：

- 翻牌。
- 点击换图。
- 点开详情。

### 4.2 透明热区型

代表：`你好，2026.html`、`Emporio Armani...html`。

典型写法：

```html
<rect x="38.29%" y="8.69%" width="12.03%" height="2.90%"
      fill="transparent" pointer-events="visible">
  <animateTransform begin="touchstart" ... />
</rect>
```

逻辑：

- 用透明 `rect` 放在设计图上的按钮位置。
- `pointer-events:visible` 或 `auto` 让它能接收手势。
- 点击后触发同层或父级动画。

注意：

- 百分比热区适合响应式缩放。
- 绝对坐标热区适合同一 `viewBox` 内精准定位。
- 背景图层要 `pointer-events:none`，否则会吞掉事件。

### 4.3 触摸态选择器

代表：`你好，2026.html`、`Emporio Armani...html`。

特征：

- `begin="touchstart"` 显示选择内容。
- `begin="click+0.31s"` 或 `touchmove` 隐藏当前层。
- 通过 `height`、`opacity`、`transform` 同时控制可见性和占位。

典型状态组合：

```html
<animate attributeName="opacity" values="0;0;1;1"
         begin="touchstart" dur="1000s"
         keyTimes="0;0.0003;0.00031;1" fill="freeze"/>
<animate attributeName="height" values="1;1;100%;100%"
         begin="touchstart" dur="1000s"
         keyTimes="0;0.0003;0.00031;1" fill="freeze"/>
<animateTransform attributeName="transform" type="translate"
         values="-1080 0;-1080 0;0 0;0 0"
         begin="touchstart" dur="1000s"
         keyTimes="0;0.0003;0.00031;1" fill="freeze"/>
```

设计意图：

- `opacity` 控制视觉。
- `height` 控制 SVG 是否占位/可触。
- `transform` 控制内容是否进入可视区。

### 4.4 序列动画型

代表：`组队，闯关2020！.html`、`【SVG】最高检工作报告中的民生答卷.html`。

特征：

- 大量 `begin="click+Ns"` 串联。
- `set visibility` 控制阶段切换。
- `animateTransform translate` 控制角色移动。
- `animate opacity` 控制文案/结果出现。

适用：

- 剧情闯关。
- 时间线叙事。
- 长报告逐段揭示。

维护建议：

- 把时间轴拆成表格维护：阶段、触发、开始秒数、持续时间、影响层。
- 避免在同一元素上叠太多互相覆盖的 `animateTransform`，否则调试困难。

### 4.5 帧动画型

代表：`点击，给非遗换上新“皮肤”.html`、`2025识典古籍年度数据报告，来了.html`。

结构：

- 多张帧图按 `translate(0 0)`、`translate(1000 0)`、`translate(2000 0)` 横向排开。
- 父级 `g` 用 `animateTransform` 离散位移。

典型写法：

```html
<g>
  <animateTransform attributeName="transform"
    begin="click"
    calcMode="discrete"
    dur="2s"
    values="-1000 0;-2000 0;-3000 0;..."
    fill="freeze"/>
  <g transform="translate(0 0)">第 0 帧</g>
  <g transform="translate(1000 0)">第 1 帧</g>
  <g transform="translate(2000 0)">第 2 帧</g>
</g>
```

设计原因：

- 微信不能跑 JS。
- SMIL 离散位移可以模拟 GIF/视频帧。
- 每帧仍是普通图片，兼容性比复杂矢量动画稳定。

风险：

- 资源非常重。
- DOM 很长。
- 需要控制帧图尺寸和数量，否则文章加载慢。

### 4.6 链接与小程序热区

常见结构：

```html
<svg viewBox="0 0 1080 916" style="pointer-events:none">
  <a>
    <rect width="100%" height="100%" opacity="0" pointer-events="visible"></rect>
  </a>
</svg>
```

或：

```html
<foreignObject>
  <a xmlns="http://www.w3.org/1999/xhtml" href="...">
    <svg style="pointer-events:visible"></svg>
  </a>
</foreignObject>
```

逻辑：

- 视觉图层不接收事件。
- 透明热区接收事件。
- `foreignObject` 用于嵌 HTML 链接、图片、微信组件。

## 5. 视觉层组织方式

### 5.1 `background-image` 承载

E2/IPAIBAN 案例高频使用：

```html
<svg style="background-size:100%;background-repeat:no-repeat;
            background-image:url(...);"
     viewBox="0 0 1080 1280"></svg>
```

优点：

- 代码短。
- 背景随 SVG 比例缩放。
- 适合纯展示图。

缺点：

- 不如 `<image>` 容易做局部裁切、变换。
- 链接/热区需要另外加透明层。

### 5.2 `<image href>` 承载

复杂帧动画常用：

```html
<image x="0" y="0" width="100%" height="100%" href="..."></image>
```

优点：

- 可和 `g transform`、`clipPath`、`opacity` 动画直接组合。
- 适合多帧动画。

### 5.3 `foreignObject` 承载

常见于：

- 嵌套 SVG。
- 嵌 HTML 链接。
- 嵌微信组件，如 `mp-common-videosnap`、`mp-common-profile`。

注意：

- `foreignObject` 里如果是 XHTML 链接，通常需要 `xmlns="http://www.w3.org/1999/xhtml"`。
- 微信环境对 `foreignObject` 支持依赖编辑器生成结构，手写时要谨慎测试。

## 6. 层级、占位与事件规则

### 6.1 三层模型

建议以后写新作品时按三层理解：

- 占位层：负责撑开正文高度，通常是空 SVG 或普通展示 SVG。
- 视觉层：展示图片、GIF、帧动画，通常 `pointer-events:none`。
- 交互层：透明热区、链接、滚动容器，通常 `pointer-events:visible/auto`。

### 6.2 零高层常用组合

```html
<section style="height:0;line-height:0;overflow:visible;pointer-events:none">
  <svg style="pointer-events:none"></svg>
  <svg style="pointer-events:visible"></svg>
</section>
<svg style="display:block;pointer-events:none" viewBox="0 0 1080 1920"></svg>
```

规则：

- 零高层不占文档流。
- 占位 SVG 必须跟随其后。
- 哪一层需要点击，哪一层才开 `pointer-events`。

### 6.3 防缝隙规则

高频写法：

- `line-height:0`
- `font-size:0`
- `display:block`
- `vertical-align:top`
- `margin-top:-1px`
- `margin-bottom:-1px`

如果上下切图出现白缝，优先检查：

1. 父级是否有默认 `line-height`。
2. SVG 是否 `display:inline` 导致基线空隙。
3. 上下切片是否存在 1px 取整误差。
4. 图片是否被微信加了默认 `max-width` 或 `height:auto`。

## 7. 可复用模式模板

### 7.1 单张全宽图

```html
<section style="line-height:0;font-size:0;overflow:hidden;">
  <svg viewBox="0 0 1080 1200"
       style="display:block;width:100%;background-size:100%;background-repeat:no-repeat;background-image:url('IMAGE_URL');"></svg>
</section>
```

### 7.2 点击换图

```html
<section style="line-height:0;overflow:hidden;">
  <svg viewBox="0 0 1080 1200" style="display:block;width:100%;overflow:hidden;">
    <g>
      <foreignObject x="0" y="0" width="1080" height="1200">
        <svg viewBox="0 0 1080 1200" style="display:block;background-size:100%;background-image:url('BEFORE_URL');"></svg>
      </foreignObject>
      <foreignObject x="2000" y="0" width="1080" height="1200">
        <svg viewBox="0 0 1080 1200" style="display:block;background-size:100%;background-image:url('AFTER_URL');"></svg>
      </foreignObject>
      <animateTransform attributeName="transform" type="translate"
        values="0 0;-2000 0;-2000 0"
        keyTimes="0;0.000001;1"
        begin="click" dur="100s" fill="freeze"
        calcMode="discrete" restart="never"/>
    </g>
  </svg>
</section>
```

### 7.3 横向吸附滑动

```html
<section style="line-height:0;overflow:scroll hidden;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;">
  <section style="display:flex;width:500%!important;max-width:500%!important;line-height:0;">
    <section style="width:20%;scroll-snap-align:center;line-height:0;">
      <svg viewBox="0 0 1080 1280" style="display:block;width:100%;background-size:100%;background-image:url('PAGE_1');"></svg>
    </section>
    <section style="width:20%;scroll-snap-align:center;line-height:0;">
      <svg viewBox="0 0 1080 1280" style="display:block;width:100%;background-size:100%;background-image:url('PAGE_2');"></svg>
    </section>
  </section>
</section>
```

### 7.4 局部纵向滚动

```html
<section style="height:0;line-height:0;overflow:visible;">
  <section style="height:160vw;overflow-y:auto;pointer-events:visible;-webkit-overflow-scrolling:touch;">
    <svg viewBox="0 0 1080 900" style="display:block;width:100%;background-size:100%;background-image:url('SLICE_1');"></svg>
    <svg viewBox="0 0 1080 900" style="display:block;width:100%;margin-top:-1px;background-size:100%;background-image:url('SLICE_2');"></svg>
  </section>
</section>
<svg viewBox="0 0 1080 1728" style="display:block;width:100%;pointer-events:none;"></svg>
```

### 7.5 透明链接热区

```html
<svg viewBox="0 0 1080 300" style="display:block;width:100%;background-size:100%;background-image:url('BUTTON_BG');">
  <a href="TARGET_URL">
    <rect x="120" y="40" width="840" height="220" opacity="0" pointer-events="visible"></rect>
  </a>
</svg>
```

### 7.6 无 ID 冒泡编组

来源：`JZCreative/svg-bubbling-strategy-SVG`。

这个模式解决的是另一类问题：在微信这类强约束环境里，不能依赖 JS、块级 CSS、`id`、`class`、`defs` 或外部选择器时，如何让一次点击同时驱动多层复杂动画。

核心不是“多写几个 `<g>`”，而是建立一条连续不间断的父子链：

```xml
<g> <!-- 世界层：大场景运动 -->
  <animateTransform begin="click" fill="freeze" restart="never" />

  <g> <!-- 遭遇物 A：位移施加层 -->
    <animateTransform begin="click" fill="freeze" restart="never" />

    <g> <!-- 遭遇物 A：姿态层 -->
      <animateTransform begin="click" fill="freeze" restart="never" />
      <image x="0" y="-800" width="609" height="639" href="..." />
      <!-- 对象本体、文本卡、局部闪烁都放在这里或更小的局部组 -->
    </g>

    <g> <!-- 抵消层：把坐标系还给更深层 -->
      <animateTransform begin="click" fill="freeze" restart="never" />

      <g> <!-- 下一个遭遇物或收尾视口层 -->
        <rect width="100%" height="100%" opacity="0" pointer-events="visible" />
      </g>
    </g>
  </g>
</g>
```

关键规则：

- 透明触发器必须在整条父子链的最深处，让点击事件沿祖先链冒泡，触发所有祖先动画。
- 复杂对象按「施加层 -> 姿态层 -> 抵消层」闭环，避免下一个对象继承前一个对象的位移、旋转或透明度。
- `<image>` 是局部视觉载荷，不是独立时间轴节点；运动、旋转、出场、冻结由外层 `<g>` 控制。
- 局部闪烁、尾焰、呼吸光、摇摆等效果要收在最小局部组内，避免 `opacity` 误伤后续深层链路。
- 交互语义要全链统一；如果采用点击触发，就统一 `begin="click"`、`fill="freeze"`、`restart="never"`。
- 收尾字幕即使视觉上像固定 HUD，也应放在最深层补偿后的内部视口坐标层，避免脱链。

## 8. 分类索引

按当前样本可粗分为：

- 长图报告类：`【SVG】最高检工作报告中的民生答卷.html`、`2026年政府工作报告有“画”说！.html`、`写进最高法工作报告的案例.html`
- 品牌大片/产品展示类：`腕间「蓝」主角.html`、`Emporio Armani...html`、`MOVA生活电器...html`、`闭眼入岚图追光L的10大理由.html`
- 节日红包/活动类：`🧧福马迎春，好运加「马」.html`、`开工大吉！央视新闻专属红包封面，送你🥳.html`、`红包封面限量抢！马年好运！.html`
- 点击探索/换装类：`点击，给非遗换上新“皮肤”.html`、`「绝色」档案.html`、`国宝中的巧夺天工.html`
- 闯关/剧情类：`组队，闯关2020！.html`、`玩转都市闯关！.html`
- 数据报告/年度盘点类：`2025识典古籍年度数据报告，来了.html`、`字节跳动2022年终盘点...html`、`「2025年度瞬间」揭晓.html`
- 横滑画廊/多入口类：`Emporio Armani...html`、`腕间「蓝」主角.html`、`2025识典古籍年度数据报告，来了.html`

## 9. 制作新 SVG 排版的决策流程

1. 先定画布宽度：优先 `1080`，如素材来自 750/345 设计稿则保持原宽。
2. 再定页面结构：普通纵向、局部滚动、横滑、零高叠层、剧情状态机。
3. 拆三层：占位层、视觉层、交互层。
4. 所有视觉切片用 `viewBox` 比例控制高度，不用正文空行控制高度。
5. 所有互动先画透明热区，再绑定 SMIL。
6. 对复杂动画，优先用 `translate` 切换远处状态层，减少重排。
7. 对多帧动画，统一帧间距，如每帧相隔 `1000`，便于维护。
8. 最后检查微信兼容项：无 JS、无外部 CSS 依赖、必要样式内联、热区可点、滚动不被拦截。

## 10. 排错清单

- 页面出现白缝：检查 `display:block`、`line-height:0`、`margin-top:-1px`、切片坐标是否重叠 1px。
- 点击无效：检查热区是否有 `pointer-events:visible/auto`，上层是否有透明元素挡住。
- 冒泡链不触发：检查透明触发器是否在最深层，所有要响应的动画是否都在它的祖先链上。
- 后续对象串位：检查当前对象是否缺少抵消层，或 `<image>` 是否挂到了下一个对象的补偿层后面。
- 局部闪烁影响全局：检查 `opacity` 动画是否挂在公共父层，应收缩到最小局部组。
- 页面不能滚动：检查大 SVG 或覆盖层是否误设 `pointer-events:visible`。
- 横滑失效：检查内容是否真的超宽，是否有 `max-width:none!important`。
- 零高层看不到：检查后面是否有占位 SVG，父级是否 `overflow:hidden`。
- 动画触发后回弹：检查 `fill="freeze"`、`restart`、是否多个动画写同一属性。
- 触摸和点击冲突：移动端优先用 `touchstart`，需要兼容时再补 `click` 延迟。
- GIF/图片不显示：检查微信 CDN URL、`background-size`、`image href` 是否被转义。
- 交互层挡住链接：让非交互视觉层 `pointer-events:none`，只给热区打开事件。

## 11. 迭代记录模板

后续新增案例时，按下面格式补充：

```md
### YYYY-MM-DD 案例名

- 文件：`source/xxx.html`
- 类型：长图拼接 / 零高叠层 / 横滑 / 纵向滚动 / 点击切换 / 帧动画 / 剧情状态机 / 链接热区
- 画布：如 `1080x1920`、`345x613`
- 核心结构：
  - 占位层：
  - 视觉层：
  - 交互层：
- 关键技巧：
- 可复用片段：
- 风险与坑：
```

## 12. 本轮学习记录

### 2026-05-19 初始归纳

- 文件：全量扫描 `source/*.html`，重点抽样 7 篇。
- 识别出的核心模式：长图拼接、零高叠层、原生纵向滚动、横向滑动、分栏拼接、点击切换、透明热区、触摸态选择器、序列动画、帧动画、链接热区。
- 最值得复用的逻辑：`viewBox` 控比例，零高层做叠加，空 SVG 做占位，透明热区接事件，SMIL 用长时长加极小 `keyTimes` 做状态冻结。
- 后续建议：继续为每个高质量案例补一条「迭代记录」，并把可运行片段抽成 `works/templates/` 模板。

### 2026-05-20 SVG 冒泡编组策略补充

- 文件/来源：`https://github.com/JZCreative/svg-bubbling-strategy-SVG`
- 类型：无 ID 冒泡编组 / 深层 `<g>` 嵌套 / 复杂剧情状态机 / `<image>` 接入排错
- 核心结构：
  - 世界层：控制全局场景运动。
  - 遭遇层：每个对象使用「施加层 -> 姿态层 -> 抵消层」闭环。
  - 触发层：最深层透明热区，只负责接收事件并向祖先冒泡。
- 关键技巧：
  - 不把平级 `<g>` 误认为父子链。
  - 对象素材、文本卡、局部效果都放回对象自己的局部层。
  - 全链统一 `begin="click"`、`fill="freeze"`、`restart="never"`。
  - 先排查父子链和补偿层，再微调 `x/y/width/height`。
- 公众号链接读取情况：用户给出的 3 个去重微信链接当前均返回微信“环境异常/去验证”页，未可靠读取正文内容；本次未抓取到本地。
