# 公众号 SVG 动画开发规范与模式库

版本：v0.6  
来源：`source/*.html` 已上线样本、`source/notes/svg-layout-patterns.md`、`source/notes/svg-case-index.md`、JZCreative `svg-bubbling-strategy-SVG` 规则。  
用途：作为后续直接生成公众号 SVG 动画代码的执行规范。本文只把样本中反复出现、或已有明确策略支撑的写法列为默认规则；低频写法会标注风险。

## 0. 总原则

公众号 SVG 动画不是普通 H5。稳定方案应按“微信文章 HTML 容器 + 内联 SVG + SMIL 动画 + 图片资源”来设计。JS、外链 CSS、复杂 DOM API 不是“尽量少依赖”，而是在公众号 SVG 发布规则下默认不可用/不允许作为实现基础。

默认生成策略：

- 首选内联 `svg/g/foreignObject/image/rect/animate/animateTransform/set`。
- 交互首选 `begin="click"`，移动端增强可用 `touchstart`，不得依赖 JS；不要默认使用 `mouseover/mouseout/dblclick`。
- 状态切换首选 `fill="freeze"`、`restart="never"`、极短 `keyTimes` 或 `calcMode="discrete"`。
- 视觉内容尽量使用图片层，动画控制放在外层 `<g>` 上。
- 每个可点区域放透明热区：`<rect width="100%" height="100%" opacity="0" pointer-events="visible"/>`。
- 对严格环境，避免依赖 `id/class/defs/use/script/style`；需要复用时可在源工程里复用，发布稿倾向展开成显式节点。
- 硬性标签规则：文章输出层级里除 `svg` 及 SVG 内部标签外，HTML 容器只允许 `section`。不得生成 `div/span/p/a/img/details/summary/style/button/canvas/input` 等 HTML 标签。
- 嵌套交互和多状态切换必须按父子 `<g>` 组状态机建模，默认使用透明热区 + `begin="click"` 冒泡，不要为了实现方便退回 `id + begin="xxx.click"`。
- 后续所有公众号 SVG 动画默认都按 `<g>` group state machine 实现；状态复杂时扩展 `<g>` 层级，不引入 `id.click` 桥接。
- 开发阶段图片一律优先使用本地相对路径；上线前通过 `packages` 里的 `wechat-svg-cdn` 工具批量上传并替换为微信 CDN 链接。
- 如果用户未提供图片素材，但需求需要图片层结构，仍按 `<image>` 资源层思路设计；开发稿用同尺寸色块占位表达版面、层级和热区，等用户补图后只替换为本地图片路径。

### 0.1 禁用语法清单

后续生成公众号 SVG 动画时，下面语法默认不能写。除非用户明确要求做实验稿，并在交付说明中标注风险。

事件与触发：

- 禁止把核心交互写成 `begin="someId.click"`、`begin="someId.touchstart"`、`begin="someId.mouseover"`。
- 禁止用 `onclick=`、`ontouchstart=`、`onload=` 等 DOM 内联事件。
- 禁止默认使用 `mouseover`、`mouseout`、`mouseenter`、`mouseleave`、`dblclick`。
- 禁止用 `id/class` 作为动画状态机或触发器依赖；`id` 最多作为调试标识，不能是发布稿核心逻辑。
- 禁止在状态变多时退回 `id.click` 桥接；必须继续用父子 `<g>`、热区和冒泡扩展状态机。

脚本与样式：

- 禁止 `<script>`、`querySelector`、`getElementById`、定时器、DOM 增删改、canvas 绘制、表单输入逻辑。
- 禁止外链 CSS：`<link rel="stylesheet">`、`@import`、外部 `.css` 文件。
- 禁止依赖 CSS 选择器、类名选择器、全局样式表来控制 SVG 动画状态。

资源与发布：

- 禁止开发阶段手写微信 CDN URL；开发稿使用本地相对路径，上线前交给 `packages/wechat-svg-cdn` 替换。
- 禁止把缺图场景改成复杂矢量重画；缺图时用同尺寸色块占位，保留后续替换 `<image>` 的结构。

### 0.2 从案例学习到代码生成的抽象方式

这些 `source` 案例的价值不是单个视觉，而是它们共同暴露了一套公众号 SVG 的“交互语法”。后续生成代码时，不按网页组件思路拆，而按下面五层拆：

1. 画布层：根据实际 UI 图尺寸确定 `viewBox` 和切片高度；画布尺寸不预设固定值，必须跟随设计图/导出素材的像素比例。
2. 资源层：把复杂视觉转成图片层，SVG 只负责承载、裁切、位移、透明热区和动画状态。
3. 交互层：用 `click/touchstart/touchmove` 触发，不使用 JS 或桌面专属事件作为实现基础。
4. 状态层：用 `opacity/visibility/transform/width/height` 表达状态，不用 DOM 增删。
5. 时间层：用 `begin="click+Ns"`、`keyTimes`、`dur`、`fill="freeze"` 组织剧情。

案例到生成策略的映射：

| 用户想要的效果 | 默认采用的样本模式 | 生成时的核心结构 | 风险边界 |
| --- | --- | --- | --- |
| 点击换图、换页、换状态 | 远距 `translate` 切换，见腕表类点击切换样本 | A/B 两层放在同一 SVG，B 层放到 `x=2000/3240`，点击后整体位移 | 一般做一次性切换，复杂可逆切换不默认承诺 |
| 点击展开长内容 | `height:0` 隐藏内容 + 点击扩大/隐藏封面 | 外层折叠容器 + 封面热区 + 宽高/透明度动画 | 高度释放在微信里要预览验证 |
| 点击播放一段视频感动画 | 横向排列序列帧 + `calcMode="discrete"` | 每帧一个 `<g transform="translate(n*W 0)">` | 帧数过多会卡，需降帧/裁切 |
| 页面滚动叙事 | 长图切片 + 局部滚动 + 视差层 | 多段 `svg` 切片，局部容器 `overflow-y:auto` | 安卓端 CSS 3D 视差存在差异 |
| 产品画册横滑 | `overflow-x:auto` + 宽画布/scroll snap | 外层横向滚动，内层 SVG 宽度超过 100% | 热区不能盖住滑动手势 |
| 红包/金币/烟花掉落 | 自动循环装饰物 | 多个 `<g>` 分别做 translate + rotate，负延迟错峰 | 同屏循环元素不能太多 |
| 闯关/剧情推进 | `click+Ns` 时间轴 | 多层 `set visibility`、`animate opacity`、`animateTransform` | 时间线长时维护成本高 |
| 长按解锁 | `touchstart+Ns` 延迟触发 | 按压反馈 + 延迟显示成功层 | 不是真实长按检测，只是延迟触发 |
| 跟手/拖尾 | 无 JS 下做触摸触发动画替代 | `touchstart` 触发一段拖尾/飞出动画 | 不能读取手指坐标 |
| 文字逐行/打字机 | 文字转图 + 遮罩/透明度 | 每行图片分别延迟出现，或遮罩矩形收起 | 不默认用真实字体排版 |

### 0.3 后续生成 SVG 时的工作协议

当用户提出一个新 SVG 动画需求时，先按这个协议生成，不重新发明结构：

1. 判断文章结构：单屏交互、长图叙事、局部滚动、横向滑动、多段组合。
2. 判断触发方式：无触发自动播放、点击、触摸、滚动；JS 不作为可选实现路径。
3. 判断状态数量：一次性状态、两页切换、多步骤时间轴、循环装饰。
4. 判断素材形态：整屏图、分层图、序列帧、局部按钮/热区、普通正文。
5. 输出代码骨架：先写容器和 `viewBox`，再写图片层，再写动画层，最后写透明热区。
6. 对嵌套展开、嵌套点击、局部状态机，一律先用“父组动画 + 子组热区 + 事件冒泡”的 `<g>` 结构建模；状态增多时继续扩展 `<g>` 层级，不切回 `id.click`。
7. 做风险声明：如果需求包含真实跟手、真实长按、复杂回退、多状态互斥，要说明微信 SVG 的限制并给替代方案。

生成优先级：

- 先保证符合公众号 SVG 发布规则，并能在微信文章里稳定显示和触发。
- 再保证布局不变形、不白线、不挡点击。
- 最后才叠加复杂动画和装饰。

### 0.4 组合模式与交互岛策略

从案例索引看，真实上线稿很少只用一种模式，常见是“长图切片 + 若干交互岛”的组合。后续生成复杂公众号 SVG 时，默认采用这个结构：

```text
静态切片 1
静态切片 2
交互岛 A：点击切换/序列帧/横滑/展开
静态切片 3
交互岛 B：时间轴/领取按钮/链接热区
安全留白
```

交互岛规则：

- 每个交互岛独立一个 `section + svg`，不要让一个 SVG 管完整篇文章。
- 交互岛内部自带 `viewBox`、图片层、动画层和透明热区。
- 交互岛之间不共享状态，不互相依赖 `id/class`。
- 静态内容尽量切成图片，避免把整篇长文做成巨大 DOM。
- 如果一个需求同时包含横滑和点击，横滑优先保证手势流畅，点击热区只覆盖必要区域。

常见组合：

| 组合 | 适用需求 | 默认做法 |
| --- | --- | --- |
| 长图切片 + 点击展开 | 报告、档案、问答详情 | 静态切片中插入展开交互岛 |
| 横滑 + 链接热区 | 产品画册、活动入口 | 横滑容器内局部 `<a>`，不铺满透明层 |
| 自动循环 + 点击转场 | 红包雨、开屏、节日页 | 循环装饰 `pointer-events:none`，点击热区在顶层 |
| 序列帧 + 解锁按钮 | 换装、开屏动画 | 序列帧播放后用 `click+Ns` 显示下一步按钮 |
| 局部滚动 + 视差 + 点击切换 | 数据报告、文化长卷 | 视差层承载氛围，关键信息放普通图层 |
| 时间轴 + 多节点显隐 | 闯关、剧情推进 | 每个节点独立 `<g>`，超过 5-8 步拆段 |

---

## 1. 微信环境核心限制与兼容规范

### 1.1 标签白名单/黑名单

样本高频可用标签：

- HTML 容器：严格生成规则只允许 `section`。历史样本中出现的 `div`、`span`、`p`、`a`、`img` 只能作为源码学习证据，不得在新生成稿中使用。
- SVG 容器和图形：`svg`、`g`、`foreignObject`、`image`、`rect`、`path`、`polygon`。
- SVG 动画：`animate`、`animateTransform`、`animateMotion`、`set`。
- 少量可用但不作为默认：`defs`、`clipPath`、`use`。
- 微信内置/编辑器节点：`mp-common-videosnap` 等可出现在上线稿中，但属于平台节点，不应在普通生成中滥用。

默认禁用或谨慎使用：

- `script`：样本中未作为交互核心出现，公众号环境会限制或过滤，后续生成不依赖 JS。
- 外链 `link rel="stylesheet"`：不要用。样本依赖内联 `style`。
- `style` 标签：不要作为默认，样本主要是行内样式。
- `details/summary`：禁止用于展开收起。公众号 SVG 交互必须用 `section + svg + SMIL/透明热区` 实现。
- `canvas/video/audio/iframe/form/input`：不作为 SVG 动画方案依赖，微信文章环境不可控。
- `defs/use/clipPath`：个别老稿出现，但 JZCreative 严格策略建议规避。发布前未实测时，不把关键交互放在这些标签上。

标签使用范式：

```html
<section style="line-height:0;overflow:hidden;text-align:center;">
  <svg style="display:block;width:100%;line-height:0;" viewBox="0 0 1080 1600">
    <g>
      <image x="0" y="0" width="1080" height="1600" href="https://mmbiz.qpic.cn/.../640?wx_fmt=png"/>
      <rect width="100%" height="100%" opacity="0" pointer-events="visible"/>
    </g>
  </svg>
</section>
```

### 1.2 SVG 动画属性白名单

后续生成 SVG/SMIL 动画时，`animate`、`set`、`animateTransform`、`animateMotion` 的可动画属性必须从此白名单选择。该表作为微信团队 2016-2025 SVG `attributeName` 白名单参考；不在表内的属性默认禁止作为动画属性。

| 序号 | 元素 | Name / type | 用途与规则 |
| --- | --- | --- | --- |
| 1 | `animate` | `x` | 控制简单几何体 x 轴移动，可用于柱状图、滑块、局部元素位移。 |
| 2 | `animate` | `y` | 控制简单几何体 y 轴移动，可用于柱状图、上下入场。 |
| 3 | `animate` | `width` | 控制宽度变化，适合伸长式图文、宽度自适应、占位释放。 |
| 4 | `animate` | `height` | 控制高度变化，适合伸长式图文、预占位、折叠释放。 |
| 5 | `animate` | `opacity` | 控制透明度，取值 `0` 到 `1`，适合显隐、淡入淡出、序列帧。 |
| 6 | `animate` | `d` | 控制贝塞尔曲线补间，但表现具有随机性；不作为默认方案。 |
| 7 | `animate` | `points` | 控制多边形补间，但表现具有随机性；不作为默认方案。 |
| 8 | `animate` | `stroke-width` | 控制描边宽度，适合线条强调、描边变化。 |
| 9 | `animate` | `stroke-linecap` | 控制描边端点，适合进度线、遮罩线条等；需实测。 |
| 10 | `animate` | `stroke-dashoffset` | 控制描边偏移，适合遮罩动画、饼/分图、进度线。 |
| 11 | `animate` | `fill` | 控制填充色过渡；用于简单色块反馈，不用于复杂 UI 主题切换。 |
| 12 | `set` | `visibility` | 控制可见性，取值 `visible`、`hidden`、`collapse`、`inherit`；适合状态机、防误触。 |
| 13 | `animateTransform` | `translate` | 控制路径和编组位移，是点击切换、嵌套展开、视差入场的默认主力。 |
| 14 | `animateTransform` | `scale` | 控制路径和编组 x/y 缩放，适合按压反馈、放大、伸缩。 |
| 15 | `animateTransform` | `rotate` | 控制路径和编组旋转，适合装饰循环、翻转、指针。 |
| 16 | `animateTransform` | `skewX` | 控制 x 轴倾斜，可用于台历翻阅等倾斜效果；需实测。 |
| 17 | `animateTransform` | `skewY` | 控制 y 轴倾斜，可用于书籍翻阅等倾斜效果；需实测。 |
| 18 | `animateMotion` | `path` | 控制单行/复杂轨迹动画，可通过 `rotate` 定义朝向，适合轨迹飞行。 |

强制规则：

- `attributeName` 只能写白名单中的 `x/y/width/height/opacity/d/points/stroke-width/stroke-linecap/stroke-dashoffset/fill/visibility/transform`。
- `animateTransform type` 只能写白名单中的 `translate/scale/rotate/skewX/skewY`。
- `animateMotion` 只能用于 `path` 轨迹动画，不作为普通位移默认方案。
- `d`、`points`、`stroke-linecap`、`skewX`、`skewY` 属于高风险白名单项；生成时必须有明确需求，且交付说明中提示需微信预览验证。
- 不得生成白名单外动画属性，例如 `clip-path`、`filter`、`transform-origin`、`background-position`、`left/top`、`margin`、`z-index`、`display` 等作为 SMIL 动画目标。

### 1.3 CSS 支持情况

稳定可用的行内 CSS：

- 布局：`display:block`、`display:inline-block`、`width:100%`、`max-width:none!important`、`height:0`、`overflow:hidden`、`overflow-x:auto`、`overflow-y:auto`。
- 排版消缝：`line-height:0`、`font-size:0`、`margin-top:-1px`、`margin-bottom:-1px`。
- 图片：`background-image:url(...)`、`background-size:100%`、`background-size:cover`、`background-repeat:no-repeat`、`background-position`。
- 交互层：`pointer-events:none`、`pointer-events:visible`、`pointer-events:auto`、`-webkit-tap-highlight-color:transparent`。
- 滚动：`-webkit-overflow-scrolling:touch`、`scroll-snap-type:x mandatory`、`scroll-snap-align:center`。
- 变换：`transform:scale(...)`、`transform:translate(...)`、`transform:rotate(...)`，但核心动画优先用 SVG `animateTransform`。
- 视差：`perspective:1px`、`transform:translateZ(...) scale(...)` 在样本中出现，可作为局部滚动视差方案。

不稳定/不建议依赖：

- 外部样式表和全局 CSS 选择器。
- `position:fixed`、复杂 `z-index` 叠层、CSS keyframes。
- CSS 动画作为核心交互。公众号清洗后兼容性不如 SMIL。
- 负 margin 大量叠层会增加排查难度，只用于消除 SVG 切片白缝或覆盖局部层。

消缝模板：

```html
<section style="line-height:0;font-size:0;overflow:hidden;">
  <svg style="display:block;width:100%;line-height:0;margin-top:-1px;" viewBox="0 0 1080 800"></svg>
  <svg style="display:block;width:100%;line-height:0;margin-top:-1px;" viewBox="0 0 1080 900"></svg>
</section>
```

### 1.4 JS 限制

结论：后续生成默认不写 JS。上线样本的核心交互由 SVG SMIL 事件完成：

- 点击：`begin="click"`，出现频率最高。
- 触摸：`begin="touchstart"`、`begin="touchmove"`，可用于按压反馈、长按模拟、滑动中断。
- 桌面预览：`mouseover`、`mouseout` 有样本，但移动微信不稳定。
- 双击：`dblclick` 有样本，但移动微信触发不自然，不作为默认。

稳定点击状态模板：

```html
<g>
  <animateTransform attributeName="transform"
    type="translate"
    values="0 0;-2000 0;-2000 0"
    keyTimes="0;0.000001;1"
    dur="1000s"
    begin="click"
    fill="freeze"
    calcMode="discrete"
    restart="never"/>
  <rect width="100%" height="100%" opacity="0" pointer-events="visible"/>
</g>
```

稳定状态机补充规则：

- 多步骤切换、重复关闭再打开、不同弹框内容轮换，都先抽象成多个父子 `<g>` 状态组。
- 每个状态组内部放自己的可见层、热区和收尾动画；关闭后切到下一个 `<g>` 状态组。
- 不允许为了省节点数量改用 `begin="someId.click"` 做跨状态桥接。

### 1.5 资源引用方式

开发/上线资源规则：

- 开发阶段使用本地图片路径，便于调试、替换和版本管理。
- 生成 SVG/HTML 时，图片引用必须写成 `packages` 工具可扫描的格式。
- 上线前执行 `wechat-svg-cdn`，批量上传本地图片到微信 CDN，并生成替换后的 HTML。
- 已经是 `https://` 或协议相对 CDN URL 的图片，工具会自动忽略。
- 不手工把本地路径逐个改成 CDN；CDN 替换交给工具统一完成。

工具支持的本地图片写法：

```html
<!-- CSS background/background-image -->
<svg style="background-image:url(./images/bg.png);"></svg>
<svg style="background:url(&quot;./images/bg.png&quot;);"></svg>

<!-- SVG image -->
<image href="./images/frame-001.png" width="{W}" height="{H}"/>

<!-- HTML img -->
<img src="./images/photo.jpg" alt=""/>
```

缺图占位协议：

- 用户只给尺寸和交互需求、未给真实图片时，不追问图片也不停止生成；按用户给的画布尺寸继续完成可运行 SVG。
- 占位稿保持“真实图片将来会出现”的结构：需要整屏图、分层图、按钮图、序列帧图的位置，都先用同尺寸 `<rect>` 色块代替。
- 占位色块只用于开发预览，不是发布资源；用户补图后，把色块替换为 `<image href="./images/xxx.png" width="..." height="..."/>`，动画和热区结构不变。
- 占位层命名或注释应说明目标素材，例如 `bg-placeholder`、`button-placeholder`、`frame-01-placeholder`，便于后续替换。
- 不用复杂 SVG 图形临摹真实 UI；占位只表达尺寸、层级、状态和交互范围。

缺图占位模板：

```html
<svg viewBox="0 0 750 1334" style="display:block;width:100%;">
  <!-- TODO: replace with <image href="./images/bg.png" width="750" height="1334"/> -->
  <rect width="750" height="1334" fill="#f3f4f6"/>

  <!-- TODO: replace with <image href="./images/card.png" x="72" y="180" width="606" height="420"/> -->
  <rect x="72" y="180" width="606" height="420" rx="12" fill="#dbeafe"/>

  <rect x="160" y="1080" width="430" height="96" rx="48" fill="#2563eb"/>
  <rect x="160" y="1080" width="430" height="96" opacity="0" pointer-events="visible"/>
</svg>
```

上线命令：

```bash
cd packages
npm start -- ../path/to/article.html
```

或使用已安装的 bin：

```bash
wechat-svg-cdn ./article.html
wechat-svg-cdn draft ./article.html -t "文章标题"
```

样本上线稿主流资源：

- 微信 CDN 图片 URL：`https://mmbiz.qpic.cn/...`、`https://mmecoa.qpic.cn/...`。
- `<image href="...">` 直接放图。
- `foreignObject` 内嵌一个背景图 SVG：用 `background-image:url(...)` 承载视觉。
- `img` 出现在 `foreignObject` 或微信编辑器节点里，但普通生成优先用 `<image>`。

未在样本中形成稳定证据：

- base64 图片：可理论使用，但会放大正文体积，不作为默认。
- `@font-face` 内联字体：未见稳定使用。文字应尽量转为图片或 SVG path，或者使用系统字体且接受差异。

资源规范：

- 开发稿允许本地路径；发布稿必须经过工具替换成本地图片对应的微信 CDN 链接。
- 大图按展示宽度导出，避免 1080 宽全篇超重。
- 序列帧控制帧数，优先 12-30 帧局部动画；超过 50 帧要评估加载和卡顿。

---

## 1A. 交互与动画质量规范

本节吸收外部 SVG 交互设计执行规范，并按公众号 SVG 的可实现范围转成生成检查项。它不替代前面的微信兼容规则；如果发生冲突，优先遵守“无 JS、无外链 CSS、无 ID 触发依赖、父子 `<g>` 冒泡”的规则。

### 1A.1 交互结构

必须存在明确的交互结构，触发来源可为：

- 自动：`begin="0s"`、`repeatCount="indefinite"`、延时自动播放。
- 点击：`begin="click"`，通过透明热区向父级 `<g>` 冒泡。
- 触摸开始：`begin="touchstart"`，适合按压反馈、半自动长按替代。
- 触摸结束：只作为风险写法，不默认依赖；微信环境不如 `touchstart` 稳定。
- 触摸移动/滚动：优先用原生滚动容器、横滑容器、视差滚动，不用 JS 读取坐标。
- 组合触发：`click+Ns`、`touchstart+Ns`、自动循环 + 点击冻结/转场。
- 半自动触发：用户点击/触摸后，后续动画按时间轴自动接续，例如 `click+0.3s`、`click+1.2s`。

生成时必须能回答：

- 用户在哪里触发。
- 哪个透明热区接收事件。
- 事件沿哪条父子链冒泡。
- 触发后哪个视觉状态发生显著变化。

### 1A.2 触发器与触发意符

触发器应结构可靠，默认使用：

- 矩形：`<rect opacity="0" pointer-events="visible"/>`，最稳定。
- 圆形：可用 `<circle opacity="0" pointer-events="visible"/>`，适合圆按钮。
- 多边形：可用 `<polygon opacity="0" pointer-events="visible"/>`，适合不规则但边界清楚的区域。
- 复合路径：可用 `<path opacity="0" pointer-events="visible"/>`，只在需要精细命中区时使用。

触发意符要明确：

- 视觉上应有按钮、箭头、卡片边界、可点击区域、滑动方向提示等线索。
- 透明热区不得大到遮挡横滑/滚动手势。
- 热区不要贴边，移动端建议保留 24-40 设计像素容错。
- 装饰层默认 `pointer-events:none`，交互层单独打开 `pointer-events:visible`。

### 1A.3 反馈设计

交互必须给用户最终明确反馈：

- 点击后视觉变化要显著，不能只有极小透明度变化。
- 反馈位置应可预期，并尽量保留在用户触发时的视窗范围内。
- 展开、伸长、翻页、换图、亮起、消失、按钮状态变化，都应有明确终态。
- 一次性反馈用 `fill="freeze"` 定格，避免播放完回到初始状态造成误解。
- 多步剧情应让下一步入口在当前反馈区域内出现，减少用户找不到下一触发点的风险。

### 1A.4 动画表达与缓动

优先选择具备物理感的动画表达：

- 位移、伸长、入场、回弹类动画宜使用 `calcMode="spline"` 和 `keySplines`。
- 切帧、状态机、瞬时切换类动画宜使用 `calcMode="discrete"` 或极短 `keyTimes`。
- 装饰循环可用线性匀速，但核心交互反馈不宜全部匀速。

常用缓动映射：

```html
<!-- linear: 匀速 -->
<animateTransform calcMode="linear" .../>

<!-- ease-in: 缓入 -->
<animateTransform calcMode="spline" keyTimes="0;1" keySplines="0.42 0 1 1" .../>

<!-- ease-out: 缓出 -->
<animateTransform calcMode="spline" keyTimes="0;1" keySplines="0 0 0.58 1" .../>

<!-- ease-in-out: 缓入缓出 -->
<animateTransform calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1" .../>
```

缓动函数坐标区间必须保持在 `0 0` 到 `1 1` 的合法区间内。复杂动画可分段写多个 `keySplines`，数量必须与 `keyTimes` 分段匹配。

### 1A.5 基本动画承载结构

伸长：

- 适用：点击展开长内容、层层展开、报告/档案/目录详情。
- 公众号 SVG 默认结构：零高容器 + 展开内容 + 封面热区宽高/位移状态切换。
- 可嵌套或接续新一组伸长，但每一层都要有独立父子冒泡链，不共享 `id/class` 状态。

穿透触发：

- 适用：多层覆盖、装饰层与交互层重叠、点击区域需要透过上层视觉。
- 默认通过 `pointer-events:none` / `pointer-events:visible` 管理层响应关系。
- 装饰层关闭事件，透明热区或链接层打开事件。

双层触发：

- 适用：一次点击需要同时带动视觉变化、占位变化、预加载层隐藏、下一状态显示等多个存在冲突的动作。
- 公众号 SVG 默认用双层或多层父子 `<g>`，让同一次 `click` 冒泡触发多个祖先动画。
- 不默认用 `id + begin="xxx.click"` 来指定多个目标。

零高容器/结构：

- 适用：同屏堆叠、点击伸长、覆盖式展开、预加载优化。
- 典型结构：`<section style="height:0;line-height:0;overflow:visible;">` 后接占位 SVG。
- 风险：热区遮挡、后文占位错乱、微信预览高度释放差异；生成后必须检查。

### 1A.6 防误触与重复执行

应采用防误触设计，避免动画预期外重复执行或无法执行：

- 一次性点击状态默认 `restart="never"`。
- 需要终态保留时默认 `fill="freeze"`。
- 透明热区只覆盖必要范围，避免盖住滚动/横滑。
- 已经进入下一状态后，旧热区应通过位移、透明度、`visibility` 或父组远距移动失效。
- 自动循环装饰使用 `pointer-events:none`，避免抢点击。
- 多层展开时，下一层热区只有在父层展开态内才出现。

---

## 2. 常用动画模式库

### 2.1 点击展开/收缩

效果：点击封面/按钮后，原区域消失，展开隐藏内容或把后续内容宽度/高度释放出来。  
触发方式：`click`，移动端可兼容 `touchstart`。  
样本特征：`4 个文件夹，看懂蚂蚁的 2022.html`、`「2025年度瞬间」揭晓.html` 中大量使用 `height:0` 容器、`width` 从 `100%` 扩到几倍、透明热区位移隐藏。

核心模板：点击后把按钮层隐藏，同时让展开层占位。

```html
<section style="line-height:0;overflow:hidden;">
  <section style="height:0;">
    <svg viewBox="0 0 1080 1200" style="display:block;width:100%;">
      <!-- 展开后的长内容，初始被 height:0 的外层压住 -->
      <image href="https://mmbiz.qpic.cn/.../content.png" width="1080" height="1200"/>
    </svg>
  </section>

  <svg viewBox="0 0 1080 300" style="display:block;width:100%;">
    <animate attributeName="width"
      begin="click+0.2s"
      values="100%;400%;400%"
      keyTimes="0;0.001;1"
      dur="1000s"
      fill="freeze"
      restart="never"/>
    <animate attributeName="opacity"
      begin="click"
      values="1;0;0"
      keyTimes="0;0.001;1"
      dur="1000s"
      fill="freeze"
      restart="never"/>
    <image href="https://mmbiz.qpic.cn/.../cover.png" width="1080" height="300"/>
    <rect width="100%" height="100%" opacity="0" pointer-events="visible"/>
  </svg>
</section>
```

常见变体：

- 点击后用 `animateTransform translate` 把遮罩移到 `-2000 0`。
- 点击后用 `set visibility="hidden"` 禁用遮挡层。
- 分段展开：每个折叠块一套独立 SVG，不共享状态。

风险：

- 真正的“收缩回去”难以在无 JS 情况下可靠做双状态切换。默认做一次性展开。
- 外层 `height:0` 和内部宽度扩展容易影响后文流式高度，必须在微信预览里实测。

### 2.2 序列帧动画

效果：多张图按帧播放，模拟视频/换装/开屏动画。  
触发方式：自动 `begin="0s"`、延迟 `begin="7s"`、点击 `begin="click"`。  
样本特征：`点击，给非遗换上新“皮肤”.html` 把帧图按 `translate(1000*n 0)` 横向排布，再用离散 `translate` 逐帧切换。

核心模板：

```html
<svg viewBox="0 0 1000 1600" style="display:block;width:100%;overflow:hidden;">
  <g>
    <animateTransform attributeName="transform"
      type="translate"
      begin="click"
      dur="1.2s"
      values="0 0;-1000 0;-2000 0;-3000 0"
      calcMode="discrete"
      fill="freeze"
      restart="never"/>
    <g transform="translate(0 0)">
      <image href="https://mmbiz.qpic.cn/.../frame_000.png" width="1000" height="1600"/>
    </g>
    <g transform="translate(1000 0)">
      <image href="https://mmbiz.qpic.cn/.../frame_001.png" width="1000" height="1600"/>
    </g>
    <g transform="translate(2000 0)">
      <image href="https://mmbiz.qpic.cn/.../frame_002.png" width="1000" height="1600"/>
    </g>
    <g transform="translate(3000 0)">
      <image href="https://mmbiz.qpic.cn/.../frame_003.png" width="1000" height="1600"/>
    </g>
  </g>
  <rect width="100%" height="100%" opacity="0" pointer-events="visible"/>
</svg>
```

常见变体：

- 自动循环：加 `repeatCount="indefinite"`、`restart="always"`。
- 点击后播放一次：`fill="freeze"`、`restart="never"`。
- 分段序列帧：先播放开场，点击后播放下一组。

风险：

- 帧数越多 DOM 越重。优先压缩图和降帧，不要把长视频完整拆成上百帧。
- 如果每帧都是 1080 全屏大图，首屏加载压力明显。

### 2.3 视差滚动动画

效果：用户在局部容器内上下滑动，前后景以不同速度移动。  
触发方式：用户滚动，不依赖 SMIL。  
样本特征：`2025识典古籍年度数据报告，来了.html` 使用纵向局部滚动、`perspective:1px`、`translateZ(...) scale(...)`。

核心模板：

```html
<section style="height:160vw;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;perspective:1px;line-height:0;">
  <section style="transform:translateZ(-1px) scale(2);transform-origin:top center;">
    <svg viewBox="0 0 1080 1600" style="display:block;width:100%;">
      <image href="https://mmbiz.qpic.cn/.../back.png" width="1080" height="1600"/>
    </svg>
  </section>
  <section style="transform:translateZ(0);">
    <svg viewBox="0 0 1080 1600" style="display:block;width:100%;">
      <image href="https://mmbiz.qpic.cn/.../front.png" width="1080" height="1600"/>
    </svg>
  </section>
</section>
```

常见变体：

- 顶层固定背景 + 内层滚动长图。
- 局部横向滑动和纵向视差混排。

风险：

- 视差依赖 CSS 3D，安卓微信机型差异大。核心信息不能只放在视差层。
- 容器高度常用 `160vw`、`100vh` 类比例，要避免底部操作区被遮挡。

### 2.4 拖尾/跟随手指动画

效果：视觉上像元素跟随手指或拖尾。  
触发方式：真实逐像素跟随需要 JS，不适合作为默认；无 JS 方案只能做“触摸触发的拖尾/抖动/提示”。  
样本证据：有 `touchstart`、`touchmove`，但没有稳定的坐标读取逻辑。

可生成的安全替代：触摸后出现一段拖尾动画，滑动时隐藏或重置。

```html
<g opacity="0">
  <animate attributeName="opacity"
    begin="touchstart"
    values="0;1;1;0"
    keyTimes="0;0.1;0.7;1"
    dur="1s"
    fill="freeze"/>
  <animateTransform attributeName="transform"
    type="translate"
    begin="touchstart"
    values="0 80;0 0;0 -120"
    dur="1s"
    fill="freeze"/>
  <image href="https://mmbiz.qpic.cn/.../trail.png" width="1080" height="1600"/>
</g>
```

常见变体：

- 点击/触摸生成“+1”“烟花”“金币”飞出。
- `touchmove` 触发遮罩移动，模拟滑动擦除。

风险：

- 不要承诺真实跟手轨迹；没有 JS 不能读取手指坐标。

### 2.5 长按触发动画

效果：用户按住一段时间后出现变化。  
触发方式：`touchstart+Ns` 延迟触发，`touchmove` 可作为中断/隐藏。  
样本特征：`begin` 中存在 `touchstart+0.5s`、`touchstart+1.5s`、`touchmove+0s`。

核心模板：

```html
<g>
  <image href="https://mmbiz.qpic.cn/.../idle.png" width="1080" height="1600"/>
  <g opacity="0">
    <animate attributeName="opacity"
      begin="touchstart+1.2s"
      values="0;1;1"
      keyTimes="0;0.001;1"
      dur="1000s"
      fill="freeze"
      restart="never"/>
    <image href="https://mmbiz.qpic.cn/.../success.png" width="1080" height="1600"/>
  </g>
  <rect width="100%" height="100%" opacity="0" pointer-events="visible"/>
</g>
```

常见变体：

- 长按前做缩放反馈：`begin="touchstart"`，`type="scale"`，`dur="0.2s"`。
- 长按后解锁下一屏：延迟触发 `translate` 把遮罩移走。

风险：

- SMIL 无法准确监听“手指仍按住”。`touchstart+1.2s` 更接近延迟触发，不是真正的长按判定。

### 2.6 自动循环动画

效果：掉落、旋转、呼吸、闪烁、轮播。  
触发方式：`begin="0s"` 或负延迟错峰，`repeatCount="indefinite"`。  
样本特征：`10亿来了！.html` 有大量掉落物，`begin="-1s"`、`begin="-3s"` 错开，叠加 `translate` 和 `rotate`。

核心模板：

```html
<g>
  <animateTransform attributeName="transform"
    type="translate"
    values="700 -200;700 1800"
    dur="4.2s"
    begin="-1s"
    repeatCount="indefinite"/>
  <g>
    <animateTransform attributeName="transform"
      type="rotate"
      values="0 35 31;360 35 31"
      dur="2s"
      repeatCount="indefinite"/>
    <image href="https://mmbiz.qpic.cn/.../piece.png" x="0" y="0" width="70" height="63"/>
  </g>
</g>
```

常见变体：

- 呼吸：`scale` 在 `1;0.96;1` 之间循环。
- 闪烁：`opacity` 在 `1;0.5;1` 之间循环。
- 无缝轮播：横向排布多屏，`translate` 循环。

风险：

- 循环动画过多会耗电和卡顿。首屏同时运动元素控制在 10-20 个以内。
- 装饰物必须 `pointer-events:none`，否则会盖住点击区。

### 2.7 时间轴/进度条动画

效果：一次点击后按时间依次出现多个节点，或进度条推进。  
触发方式：`click+Ns`。  
样本特征：`组队，闯关2020！.html` 大量使用 `click+2s`、`click+3s`；属性以 `transform`、`opacity`、`visibility` 为主。

核心模板：

```html
<svg viewBox="0 0 1080 500" style="display:block;width:100%;">
  <rect x="90" y="420" width="900" height="12" fill="#ddd"/>
  <rect x="90" y="420" width="0" height="12" fill="#111">
    <animate attributeName="width"
      begin="click"
      from="0"
      to="900"
      dur="3s"
      fill="freeze"
      restart="never"/>
  </rect>

  <g opacity="0">
    <animate attributeName="opacity" begin="click+0.5s" to="1" dur="0.2s" fill="freeze"/>
    <image href="https://mmbiz.qpic.cn/.../step1.png" width="1080" height="500"/>
  </g>
  <g opacity="0">
    <animate attributeName="opacity" begin="click+1.5s" to="1" dur="0.2s" fill="freeze"/>
    <image href="https://mmbiz.qpic.cn/.../step2.png" width="1080" height="500"/>
  </g>

  <rect width="100%" height="100%" opacity="0" pointer-events="visible"/>
</svg>
```

常见变体：

- `set visibility` 精确控制层显示/隐藏。
- `stroke-dashoffset` 可做描边进度，但样本只出现极少，不作为默认。
- 用多个遮罩矩形依次消失模拟逐行揭示。

风险：

- `click+Ns` 时间轴只能从一次触发事件开始，不适合复杂可逆控制。

### 2.8 文字逐行显示/打字机效果

效果：标题、文案逐行出现。  
触发方式：自动或点击后按延迟显示。  
样本推断：公众号 SVG 稳定方案多把文字烘焙成图片，再用 `opacity`/遮罩控制显示；不依赖真实 HTML 字体排版。

逐行显示模板：

```html
<svg viewBox="0 0 1080 500" style="display:block;width:100%;">
  <image href="https://mmbiz.qpic.cn/.../text-line-1.png" width="1080" height="120" opacity="0">
    <animate attributeName="opacity" begin="click+0.2s" to="1" dur="0.2s" fill="freeze"/>
  </image>
  <image href="https://mmbiz.qpic.cn/.../text-line-2.png" y="120" width="1080" height="120" opacity="0">
    <animate attributeName="opacity" begin="click+0.6s" to="1" dur="0.2s" fill="freeze"/>
  </image>
  <rect width="100%" height="100%" opacity="0" pointer-events="visible"/>
</svg>
```

打字机替代模板：用遮罩矩形逐步移开。

```html
<svg viewBox="0 0 1080 240" style="display:block;width:100%;">
  <image href="https://mmbiz.qpic.cn/.../full-text.png" width="1080" height="240"/>
  <rect x="0" y="0" width="1080" height="240" fill="#fff">
    <animate attributeName="width"
      begin="click"
      values="1080;0;0"
      keyTimes="0;0.08;1"
      dur="1000s"
      fill="freeze"
      restart="never"/>
  </rect>
</svg>
```

风险：

- 真正逐字排版受字体和文本渲染影响，不推荐用 `<text>` 承担关键视觉。

### 2.9 页面转场/淡入淡出

效果：点击后从 A 页面切到 B 页面，带淡出、平移、缩放。  
触发方式：`click`。  
样本特征：`腕间「蓝」主角.html` 点击切换把下一层放在远处，点击后外层 `translate` 到新位置；`10亿来了！.html` 有复杂淡出/位移转场。

核心模板：

```html
<svg viewBox="0 0 1080 1600" style="display:block;width:100%;overflow:hidden;">
  <g>
    <foreignObject width="100%" height="100%" x="0" y="0">
      <svg viewBox="0 0 1080 1600" style="background-image:url(https://mmbiz.qpic.cn/.../page-a.png);background-size:100%;"></svg>
    </foreignObject>
    <foreignObject width="100%" height="100%" x="2000" y="0">
      <svg viewBox="0 0 1080 1600" style="background-image:url(https://mmbiz.qpic.cn/.../page-b.png);background-size:100%;"></svg>
    </foreignObject>
    <animateTransform attributeName="transform"
      type="translate"
      begin="click"
      values="0 0;-2000 0;-2000 0"
      keyTimes="0;0.000001;1"
      dur="100s"
      fill="freeze"
      calcMode="discrete"
      restart="never"/>
  </g>
</svg>
```

常见变体：

- 淡出旧页：旧页 `animate opacity` 到 0。
- 推入新页：新页 `translate` 从下方/右侧进入。
- 放大转场：围绕中心嵌套两层 `<g>`，外层平移、内层缩放。

风险：

- 如果 A、B 两屏都同时加载大图，首屏资源更重。可用低清占位或拆段。

### 2.10 横向滑动/卡片轮播

效果：用户横向滑动浏览多张图或卡片。  
触发方式：原生滚动。  
样本特征：`腕间「蓝」主角.html`、`Emporio Armani 2026 春夏腕表与配饰系列广告大片.html` 使用 `overflow-x:scroll`、`max-width:none!important`、`scroll-snap-type`。

核心模板：

```html
<section style="-webkit-overflow-scrolling:touch;overflow-x:auto;overflow-y:hidden;line-height:0;">
  <svg viewBox="0 0 3240 1080" width="300%" preserveAspectRatio="xMinYMin meet"
    style="display:block;max-width:none!important;">
    <image href="https://mmbiz.qpic.cn/.../panel1.png" x="0" width="1080" height="1080"/>
    <image href="https://mmbiz.qpic.cn/.../panel2.png" x="1080" width="1080" height="1080"/>
    <image href="https://mmbiz.qpic.cn/.../panel3.png" x="2160" width="1080" height="1080"/>
  </svg>
</section>
```

变体：

- 非等宽图片：用多个 `foreignObject` 分别给 `x/width`。
- 吸附滑动：外层用 `display:flex` + 子项 `scroll-snap-align:center`。

风险：

- 横滑区里如果覆盖了透明点击热区，会影响滑动手势；滑动容器内热区需局部放置。

### 2.11 无 ID 冒泡编组

效果：在微信严格过滤环境中，不依赖 `id`/`class`/CSS 选择器，让点击事件沿父子 `<g>` 冒泡触发动画。  
来源：JZCreative `svg-bubbling-strategy-SVG`。

核心结构：

```html
<svg viewBox="0 0 1080 1600" style="display:block;width:100%;">
  <g>
    <!-- 施加层：接收点击后的总运动 -->
    <animateTransform attributeName="transform" type="translate"
      begin="click" values="0 0;0 -300;0 -300"
      keyTimes="0;0.01;1" dur="100s" fill="freeze" restart="never"/>

    <g>
      <!-- 姿态层：自身缩放/旋转 -->
      <animateTransform attributeName="transform" type="scale"
        begin="click" values="1;1.08;1" dur="0.4s" additive="sum"/>

      <g>
        <!-- 抵消层：把视觉资源放回设计坐标 -->
        <image href="https://mmbiz.qpic.cn/.../object.png" x="0" y="0" width="1080" height="1600"/>
        <rect width="100%" height="100%" opacity="0" pointer-events="visible"/>
      </g>
    </g>
  </g>
</svg>
```

规则：

- 保持连续父子链：触发热区必须在被动画控制的 `<g>` 内部。
- 不把交互绑定到 `id`。
- 资源 `<image>` 只是视觉载体，动画尽量施加在外层 `<g>`。
- 点击后定格用 `fill="freeze"`、`restart="never"`。

### 2.12 set visibility 状态机

效果：点击后切换多个状态节点，常见于闯关、剧情、问答、阶段解锁。  
触发方式：`click`、`click+Ns`、`touchstart`。  
样本特征：`组队，闯关2020！.html`、`玩转都市闯关！.html`、`抓 马 马 马 马.html` 大量使用 `set attributeName="visibility"` 管理状态。

核心模板：

```html
<g visibility="hidden">
  <set attributeName="visibility" to="visible" begin="click+{DELAY_SHOW}" dur="0.01s" fill="freeze"/>
  <set attributeName="visibility" to="hidden" begin="click+{DELAY_HIDE}" dur="0.01s" fill="freeze"/>
  <animate attributeName="opacity" begin="click+{DELAY_SHOW}" values="0;1" dur="{FADE_DUR}" fill="freeze"/>
  <image href="{IMG_STEP}" width="{W}" height="{H}"/>
</g>
```

常见变体：

- 显示后同时 `translate` 入场。
- 点击当前热区后隐藏自己，并显示下一组。
- `touchstart` 显示按压反馈，`touchstart+0.2s` 隐藏。

风险：

- 节点多时维护成本高。超过 5-8 个状态节点，拆成交互岛。

### 2.13 opacity 高速序列帧

效果：多张帧图通过透明度依次出现，形成视频感。  
触发方式：自动定时，或点击后按时间出现。  
样本特征：`影像之像.html`、`戳戳Codi！解锁@王一博的一天.html` 存在“高速序列帧_48帧”，大量使用 `animate attributeName="opacity"`。

核心模板：

```html
<g>
  <image href="{FRAME_0}" width="{W}" height="{H}">
    <animate attributeName="opacity" values="1;0;0" keyTimes="0;0.02;1" dur="{DUR}" fill="freeze"/>
  </image>
  <image href="{FRAME_1}" width="{W}" height="{H}" opacity="0">
    <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.02;0.04" dur="{DUR}" fill="freeze"/>
  </image>
</g>
```

选型规则：

- 帧数少、整屏切换：优先横向排布 + `calcMode="discrete"`。
- 帧数多、编辑器已产出 opacity 帧：可保留 opacity 序列。
- 新生成时不优先用 48 帧 opacity 堆叠，除非用户明确需要高帧视觉。

风险：

- 所有帧同时在 DOM 中，资源和渲染压力大。
- `keyTimes` 很密时可维护性差。

### 2.14 编辑器零高容器

效果：把视觉层、交互层或预加载层压到 `height:0` 中，再通过后续 SVG/动画改变流式占位，常用于点击展开、顶层覆盖、预加载优化。  
触发方式：常和 `height`、`width`、`opacity`、`visibility` 动画组合。  
样本特征：大量 E2/135 编辑器生成稿中出现 `height:0`、`line-height:0`、`零高容器`、`加载优化,不占height`。

核心模板：

```html
<section style="line-height:0;font-size:0;overflow:hidden;">
  <section style="height:0;line-height:0;overflow:visible;">
    <svg viewBox="0 0 {W} {H_OVERLAY}" style="display:block;width:100%;">
      <image href="{IMG_OVERLAY}" width="{W}" height="{H_OVERLAY}"/>
    </svg>
  </section>
  <svg viewBox="0 0 {W} {H_PLACEHOLDER}" style="display:block;width:100%;line-height:0;"></svg>
</section>
```

使用规则：

- 只在需要覆盖、展开或预加载时使用。
- 零高层内的点击热区必须确认没有被后续层遮挡。
- 生成时优先保持结构简单，不能为了模仿编辑器而滥用零高容器。

---

## 3. 布局与排版规范

### 3.1 viewBox 与等比缩放

主 SVG 的 `viewBox` 必须来自实际 UI 图或导出素材尺寸。下面只表示写法格式，不代表固定尺寸：

```html
<svg viewBox="0 0 {UI_WIDTH} {UI_HEIGHT}" style="display:block;width:100%;line-height:0;"></svg>
```

规则：

- `viewBox` 用设计稿/图片素材坐标；如果 UI 图是 `750x1334`，就写 `viewBox="0 0 750 1334"`；如果切片是 `1080x1800`，就写 `viewBox="0 0 1080 1800"`。
- 不预设固定画布宽高。`1080`、`750`、`640`、`345` 只是样本里常见的设计宽度，不是生成默认值。
- 宽度交给 CSS：`width:100%`；不要写死屏幕像素。
- 高度由 `viewBox` 比例自然撑开，避免手写 CSS 高度导致变形。
- 横向长画布可用 `width="160%"`、`width="300%"` 配合 `max-width:none!important`。
- 需要裁切时，外层 `section` 或 SVG 设 `overflow:hidden`。

### 3.2 长图切片

长文常拆成多段 SVG/图片，原因是单个超长 SVG 或图片加载慢、容易白屏。

切片模板：

```html
<section style="line-height:0;font-size:0;overflow:hidden;">
  <svg style="display:block;width:100%;margin-top:-1px;" viewBox="0 0 1080 1800">
    <image href="https://mmbiz.qpic.cn/.../part-01.png" width="1080" height="1800"/>
  </svg>
  <svg style="display:block;width:100%;margin-top:-1px;" viewBox="0 0 1080 1800">
    <image href="https://mmbiz.qpic.cn/.../part-02.png" width="1080" height="1800"/>
  </svg>
</section>
```

规范：

- 相邻切片使用 `margin-top:-1px` 防白线。
- 每段高度建议控制在 2000-5000 设计像素以内。
- 有交互的段独立成一个 SVG，避免全篇巨型 DOM。

### 3.3 图文混排

稳定实现方式：

- 主视觉和关键字体烘焙成图片，用 `<image>` 或 `background-image`。
- 需要可选中文本时可在普通 `section/p/span` 中排版，但不要与核心动画强耦合。
- SVG 内真实 `<text>` 不作为默认，因为字体、行高、微信清洗都不可控。

图文混排模板：

```html
<section style="line-height:0;overflow:hidden;">
  <svg viewBox="0 0 1080 900" style="display:block;width:100%;">
    <image href="https://mmbiz.qpic.cn/.../hero-with-text.png" width="1080" height="900"/>
  </svg>
  <section style="line-height:1.75;font-size:16px;color:#222;padding:18px 24px;">
    <p style="margin:0 0 12px;">这里放普通正文，动画不要依赖它。</p>
  </section>
</section>
```

### 3.4 安全区域适配

规则：

- 底部 80-160 设计像素不要放关键按钮，尤其是全屏长图最后一屏。
- 局部滚动容器底部加空白 SVG 或安全留白。
- 点击热区不要贴边，左右至少留 24-40 设计像素容错。
- 如果有“继续阅读/领取/跳转”按钮，底部额外加一段 spacer。

安全留白模板：

```html
<svg viewBox="0 0 1080 160" style="display:block;width:100%;pointer-events:none;"></svg>
```

---

## 4. 代码结构与可维护性建议

### 4.1 文件命名与组织

建议源工程结构：

```text
project/
  index.html
  assets/
    01-cover.png
    02-scene-a.png
    frames/skin-000.png
  src/
    sections.md
    snippets/
      click-switch.svg
      frame-sequence.svg
```

发布稿可以是单 HTML，但源文件应保留模块说明：

- `section-01-cover`
- `section-02-click-expand`
- `section-03-frame-sequence`
- `section-99-safe-spacer`

### 4.2 可复用片段封装

源侧可以用模板复用，发布侧尽量展开。

可复用片段：

- 透明热区。
- 点击后隐藏层。
- 点击后切换到远处页面。
- 自动循环装饰物。
- 横向滑动容器。

透明热区固定写法：

```html
<rect width="100%" height="100%" opacity="0" pointer-events="visible"/>
```

点击隐藏固定写法：

```html
<animateTransform attributeName="transform" type="translate"
  begin="click" values="0 0;-2000 0;-2000 0"
  keyTimes="0;0.000001;1" dur="1000s"
  fill="freeze" calcMode="discrete" restart="never"/>
```

关于 `<defs>`：

- 如果只在自己测试过的公众号编辑器链路中使用，可用于 `clipPath` 或复用图形。
- 默认生成不把关键图形放在 `<defs>/<use>`，因为严格环境可能过滤或引用失效。

### 4.3 注释规范

源文件可以加注释，发布稿尽量少注释。

推荐注释：

```html
<!-- section-02: click switch, one-shot -->
```

不推荐：

- 在注释里保存关键参数但代码不同步。
- 大段中文解释塞进发布 HTML。
- 依赖 `label`、`name`、`id` 承担逻辑。

---

## 5. 避坑指南

### 5.1 白线和错位

现象：多段 SVG 之间出现细白线。  
原因：微信渲染时小数缩放、行高、图片边界抗锯齿。  
处理：

- 外层 `line-height:0;font-size:0`。
- SVG `display:block;width:100%`。
- 相邻段 `margin-top:-1px`。
- 背景色一致时可让图片多出 1-2px 出血。

### 5.2 点击无效

常见原因：

- 热区没有 `pointer-events`。
- 装饰层盖住热区。
- 热区不在触发动画的父子链里，事件没有冒泡到目标 `<g>`。
- 外层写了 `pointer-events:none`，内层没有重新打开。

修复模板：

```html
<g style="pointer-events:visible;">
  <rect width="100%" height="100%" opacity="0" pointer-events="visible"/>
</g>
```

### 5.3 动画只播放一次/重复播放异常

一次性状态切换：

- 使用 `fill="freeze"`。
- 使用 `restart="never"`。
- `dur` 可以很长，例如 `100s/1000s`，配合极短 `keyTimes` 定格。

循环装饰：

- 使用 `repeatCount="indefinite"`。
- `restart="always"` 可用于自动循环，但点击状态不要用。

### 5.4 transform 叠加混乱

问题：同一元素同时平移、缩放、旋转，中心点错。  
规则：

- 分层嵌套，每层只负责一种变换。
- 缩放/旋转围绕中心时，先 `translate(cx cy)`，内部再 `translate(-cx -cy)`。

模板：

```html
<g transform="translate(540 800)">
  <animateTransform attributeName="transform" type="scale"
    values="1;1.1;1" dur="0.4s" begin="click" additive="sum"/>
  <g transform="translate(-540 -800)">
    <image href="https://mmbiz.qpic.cn/.../scene.png" width="1080" height="1600"/>
  </g>
</g>
```

### 5.5 资源太重导致卡顿/白屏

处理优先级：

1. 减少同时存在的全屏大图。
2. 序列帧降帧、裁切到局部、压缩图片。
3. 长图切片，不做单个超长 SVG。
4. 自动循环元素减少数量，装饰层合并成图片。
5. 首屏只加载首屏必要内容，后续交互段拆到后面。

### 5.6 hover/dblclick 不适合移动端默认

样本里有 `mouseover/mouseout/dblclick`，但这更像桌面预览或特殊交互。后续生成：

- 默认不用 `mouseover/mouseout`。
- 默认不用 `dblclick`。
- 如用户明确要“双击”，同时给出移动端风险，并提供单击备选。

### 5.7 foreignObject 风险

`foreignObject` 在样本中非常高频，适合承载嵌套 SVG、背景图、链接区域。但风险是不同客户端对内部 HTML/SVG 清洗可能不同。

默认策略：

- 简单图片优先 `<image>`。
- 需要背景图样式、链接、美化跳转时用 `foreignObject`。
- 不在 `foreignObject` 内放复杂 JS/表单/外部 CSS。

### 5.8 不要把关键逻辑绑定到 id/class

JZCreative 规则强调严格环境下 `id/class/defs/embed` 可能被过滤或失效。后续生成：

- 事件用父子 `<g>` 冒泡，不用 `begin="xxx.click"`。
- 样式用行内，不用类选择器。
- 发布稿少用 ID，最多作为调试标识，不能作为逻辑依赖。
- 不能因为嵌套状态机“更容易指定触发源”就使用 `id + begin="layerTap.click"` 作为默认方案；这属于通用 SVG 思维，不是公众号 source 案例沉淀出的默认规则。
- 如果确实必须绑定具体触发源，先在交付说明里标注它是例外，并给出为什么无 ID 冒泡无法表达。

---

## 6. 后续生成前检查清单

- 是否所有图片都是线上可访问 URL。
- 是否没有外链 CSS、JS；规则不允许把它们作为实现基础。
- 是否主 SVG 都有来自 UI/素材尺寸的 `viewBox` 和 `width:100%`。
- 是否所有切片都 `line-height:0`、`display:block`、必要时 `margin-top:-1px`。
- 是否关键点击区有透明 `rect`，且没有被 `pointer-events:none` 的层挡住。
- 是否点击状态使用 `fill="freeze"`、`restart="never"`。
- 是否避免默认使用 `mouseover/mouseout/dblclick`。
- 是否把关键文案转图或接受系统字体差异。
- 是否控制序列帧数量和首屏资源体积。
- 是否底部关键按钮避开微信操作区。

---

## 7. 可直接复用的文章骨架模板

本章是后续生成代码的起点。所有模板都必须参数化，不能把样本里的 `1080/1600/3240` 等值当固定尺寸。通常由用户直接提供 UI 图尺寸；拿到尺寸后，将 `{W}`、`{H}` 等占位替换为实际值。

通用参数：

| 参数 | 含义 | 来源/派生 |
| --- | --- | --- |
| `{W}` | 当前 SVG 画布宽度 | 用户提供的 UI 图/素材宽度 |
| `{H}` | 当前 SVG 画布高度 | 用户提供的 UI 图/素材高度 |
| `{IMG_*}` | 图片资源地址 | 开发阶段使用本地相对路径，上线前由 `wechat-svg-cdn` 替换为 CDN |
| `{OFFSET_X}` | 远距切换偏移 | 通常为 `{W} * 2`，也可按图层数量取更大值 |
| `{SAFE_H}` | 底部安全留白高度 | 按 UI 需要给定，通常为设计图坐标中的 80-160 |
| `{DUR}` | 动画时长 | 按效果设定 |
| `{DELAY_N}` | 第 N 个节点延迟 | 按时间轴设定 |

占位写法只用于模板文档。正式开发稿输出时必须替换成具体数值和本地图片相对路径；上线稿再由工具替换成本地图片对应的 CDN URL。

### 7.1 单屏点击切换骨架

适用：点击换图、点击开门、点击拆红包、点击查看答案、点击切换产品状态。

```html
<section style="line-height:0;font-size:0;overflow:hidden;text-align:center;">
  <svg viewBox="0 0 {W} {H}" style="display:block;width:100%;line-height:0;overflow:hidden;">
    <g>
      <foreignObject x="0" y="0" width="100%" height="100%">
        <svg viewBox="0 0 {W} {H}"
          style="display:block;width:100%;background-image:url({IMG_A});background-size:100%;background-repeat:no-repeat;"></svg>
      </foreignObject>
      <foreignObject x="{OFFSET_X}" y="0" width="100%" height="100%">
        <svg viewBox="0 0 {W} {H}"
          style="display:block;width:100%;background-image:url({IMG_B});background-size:100%;background-repeat:no-repeat;"></svg>
      </foreignObject>
      <animateTransform attributeName="transform" type="translate"
        begin="click" values="0 0;-{OFFSET_X} 0;-{OFFSET_X} 0"
        keyTimes="0;0.000001;1" dur="1000s"
        fill="freeze" calcMode="discrete" restart="never"/>
      <rect width="100%" height="100%" opacity="0" pointer-events="visible"/>
    </g>
  </svg>
</section>
```

输入参数：

- `{W}`、`{H}`：A/B 两张状态图的共同尺寸。
- `{IMG_A}`、`{IMG_B}`：切换前后两张图。
- `{OFFSET_X}`：远距偏移。

派生规则：

- `{OFFSET_X}` 必须大于 `{W}`；默认取 `{W} * 2`。
- 如果切换后不希望再点，保留 `restart="never"`。
- 如果只想局部按钮可点，把透明热区改为按钮坐标。

### 7.2 长图切片骨架

适用：报告、年终盘点、品牌长文、信息图。

```html
<section style="line-height:0;font-size:0;overflow:hidden;text-align:center;">
  <svg viewBox="0 0 {W} {H_1}" style="display:block;width:100%;line-height:0;margin-top:-1px;">
    <image href="{IMG_1}" x="0" y="0" width="{W}" height="{H_1}"/>
  </svg>
  <svg viewBox="0 0 {W} {H_2}" style="display:block;width:100%;line-height:0;margin-top:-1px;">
    <image href="{IMG_2}" x="0" y="0" width="{W}" height="{H_2}"/>
  </svg>
  <svg viewBox="0 0 {W} {SAFE_H}" style="display:block;width:100%;line-height:0;pointer-events:none;"></svg>
</section>
```

输入参数：

- `{W}`：所有切片统一宽度。
- `{H_1}`、`{H_2}`：每张切片的实际高度。
- `{IMG_1}`、`{IMG_2}`：切片图片。
- `{SAFE_H}`：底部安全留白高度，可按需要省略。

派生规则：

- 每片保持同一宽度坐标系。
- 相邻切片用 `margin-top:-1px`。
- 交互段单独切出来，不要埋在超长静态切片里。

### 7.3 点击展开信息块骨架

适用：文件夹展开、卡片展开、查看详情、折叠目录。

```html
<section style="line-height:0;font-size:0;overflow:hidden;">
  <section style="height:0;line-height:0;overflow:visible;">
    <svg viewBox="0 0 {W} {EXPAND_H}" style="display:block;width:100%;line-height:0;">
      <image href="{IMG_EXPAND}" width="{W}" height="{EXPAND_H}"/>
    </svg>
  </section>

  <svg viewBox="0 0 {W} {COVER_H}" style="display:block;width:100%;line-height:0;overflow:hidden;">
    <animate attributeName="opacity" begin="click"
      values="1;0;0" keyTimes="0;0.001;1"
      dur="1000s" fill="freeze" restart="never"/>
    <animate attributeName="width" begin="click+0.2s"
      values="100%;{EXPAND_WIDTH_PERCENT};{EXPAND_WIDTH_PERCENT}" keyTimes="0;0.001;1"
      dur="1000s" fill="freeze" restart="never"/>
    <image href="{IMG_COVER}" width="{W}" height="{COVER_H}"/>
    <rect width="100%" height="100%" opacity="0" pointer-events="visible"/>
  </svg>
</section>
```

输入参数：

- `{W}`：封面图和展开图共同宽度。
- `{COVER_H}`：封面图高度。
- `{EXPAND_H}`：展开内容高度。
- `{IMG_COVER}`、`{IMG_EXPAND}`：封面和展开内容图片。

派生规则：

- 这是微信 SVG 里常见的“流式高度欺骗”写法。
- `{EXPAND_WIDTH_PERCENT}` 需按展开高度和版面测试取值；常见是 `300%` 到 `800%`，不能固定。
- 展开内容高度越高，越需要微信预览验证。
- 多个展开块不要共享一个触发层。

### 7.4 序列帧播放骨架

适用：换装、开屏、手绘变化、视频感转场、产品拆解。

```html
<section style="line-height:0;font-size:0;overflow:hidden;">
  <svg viewBox="0 0 {W} {H}" style="display:block;width:100%;line-height:0;overflow:hidden;">
    <g>
      <animateTransform attributeName="transform" type="translate"
        begin="{BEGIN}" dur="{DUR}" calcMode="discrete"
        values="{FRAME_VALUES}"
        fill="freeze" restart="never"/>
      <g transform="translate({FRAME_0_X} 0)"><image href="{FRAME_0}" width="{W}" height="{H}"/></g>
      <g transform="translate({FRAME_1_X} 0)"><image href="{FRAME_1}" width="{W}" height="{H}"/></g>
      <g transform="translate({FRAME_2_X} 0)"><image href="{FRAME_2}" width="{W}" height="{H}"/></g>
      <!-- 继续按帧数追加：FRAME_N_X = N * W -->
    </g>
    <rect width="100%" height="100%" opacity="0" pointer-events="visible"/>
  </svg>
</section>
```

输入参数：

- `{W}`、`{H}`：每帧图片尺寸。
- `{FRAME_0...FRAME_N}`：帧图 URL。
- `{BEGIN}`：`click`、`0s` 或其他合法 SMIL 触发。
- `{DUR}`：播放总时长。

派生规则：

- `{FRAME_N_X} = N * {W}`。
- `{FRAME_VALUES}` 是负向位移序列：`0 0;-{W} 0;-{2W} 0...`。
- 循环播放才加 `repeatCount="indefinite"`。

### 7.5 横向滑动画册骨架

适用：产品画册、年度瞬间、卡片列表、横向时间线。

```html
<section style="line-height:0;font-size:0;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;">
  <svg viewBox="0 0 {TOTAL_W} {PANEL_H}" width="{SCROLL_WIDTH_PERCENT}" preserveAspectRatio="xMinYMin meet"
    style="display:block;max-width:none!important;line-height:0;">
    <image href="{PANEL_0}" x="{PANEL_0_X}" y="0" width="{PANEL_0_W}" height="{PANEL_H}"/>
    <image href="{PANEL_1}" x="{PANEL_1_X}" y="0" width="{PANEL_1_W}" height="{PANEL_H}"/>
    <image href="{PANEL_2}" x="{PANEL_2_X}" y="0" width="{PANEL_2_W}" height="{PANEL_H}"/>
  </svg>
</section>
```

输入参数：

- `{PANEL_H}`：横滑画布高度。
- `{PANEL_N}`：每张卡片图片 URL。
- `{PANEL_N_W}`：每张卡片宽度，可等宽也可非等宽。

派生规则：

- 外层负责横向滚动，内层 SVG 宽度超过屏幕。
- `{PANEL_0_X}=0`，`{PANEL_1_X}={PANEL_0_W}`，后续 x 为前面所有 panel 宽度之和。
- `{TOTAL_W}=sum({PANEL_N_W})`。
- `{SCROLL_WIDTH_PERCENT}` 可按 `{TOTAL_W}/{VIEWPORT_BASE_W}*100%` 估算，或者直接给 `width="{TOTAL_W}"` 并配合 `max-width:none!important`。
- 如果每张卡非等宽，用 `foreignObject x/width` 精确排布。
- 不要用全屏透明热区盖住横滑区域。

### 7.6 时间轴剧情骨架

适用：闯关、问答、剧情推进、点击后连续演出。

```html
<section style="line-height:0;font-size:0;overflow:hidden;">
  <svg viewBox="0 0 {W} {H}" style="display:block;width:100%;line-height:0;overflow:hidden;">
    <image href="{IMG_BASE}" width="{W}" height="{H}"/>

    <g opacity="0">
      <animate attributeName="opacity" begin="click+{DELAY_1}" to="1" dur="{FADE_DUR}" fill="freeze" restart="never"/>
      <animateTransform attributeName="transform" type="translate"
        begin="click+{DELAY_1}" values="0 {ENTER_Y};0 0" dur="{ENTER_DUR}" fill="freeze" restart="never"/>
      <image href="{IMG_STEP_1}" width="{W}" height="{H}"/>
    </g>

    <g opacity="0">
      <animate attributeName="opacity" begin="click+{DELAY_2}" to="1" dur="{FADE_DUR}" fill="freeze" restart="never"/>
      <animateTransform attributeName="transform" type="translate"
        begin="click+{DELAY_2}" values="0 {ENTER_Y};0 0" dur="{ENTER_DUR}" fill="freeze" restart="never"/>
      <image href="{IMG_STEP_2}" width="{W}" height="{H}"/>
    </g>

    <rect width="100%" height="100%" opacity="0" pointer-events="visible"/>
  </svg>
</section>
```

输入参数：

- `{W}`、`{H}`：剧情段画布尺寸。
- `{IMG_BASE}`、`{IMG_STEP_N}`：底图和每个剧情节点图。
- `{DELAY_N}`：每个节点相对点击的延迟。
- `{ENTER_Y}`：入场偏移。
- `{FADE_DUR}`、`{ENTER_DUR}`：淡入和位移动画时长。

派生规则：

- 每个剧情节点独立 `<g>`。
- 用 `click+Ns` 控制节奏。
- 剧情超过 5-8 步时，建议拆成多个交互段。

---

## 8. 迭代记录

- v0.1：基于本地 `source/*.html` 样本和 JZCreative 冒泡策略建立初版规范，覆盖微信限制、动画模式、布局排版、维护建议和避坑清单。
- v0.2：补充“案例学习到代码生成的抽象方式”“后续生成 SVG 时的工作协议”“效果到模式映射表”和完整骨架模板，用于把案例库转化为后续可执行生成规则。
- v0.3：吸收 `svg-case-index.md` 的全量案例索引结论，补充组合模式和“静态切片 + 交互岛”的复杂文章生成策略。
- v0.4：将第 7 章骨架模板参数化，移除固定画布尺寸示例，补充输入参数和派生规则。
- v0.5：固化开发阶段使用本地图片、上线前通过 `packages/wechat-svg-cdn` 批量上传并替换 CDN 的资源工作流。
- v0.6：基于全量复读证据补充 `set visibility` 状态机、`opacity` 高速序列帧、编辑器零高容器三类高频代码规则。
