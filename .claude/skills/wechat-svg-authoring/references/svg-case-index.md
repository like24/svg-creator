# 公众号 SVG 动画案例索引表

版本：v0.1  
来源：`source/*.html` 本地上线源码。  
用途：把案例库转化为可检索的交互资产，供后续生成公众号 SVG 动画时快速匹配“需求 -> 布局 -> 交互模式 -> 代码策略”。

## 0. 使用方式

后续遇到新需求时，先按需求关键词查本索引：

- 想做“点击换图/换页/开门/拆红包”：查 `点击切换`、`远距 translate`、`一次性状态`。
- 想做“视频感/换装/开屏动画”：查 `序列帧`、`calcMode=discrete`。
- 想做“报告/年终总结/长图”：查 `长图切片`、`多 SVG 拼接`、`局部滚动`。
- 想做“横滑画册/产品卡片”：查 `横向滑动`、`scroll-snap`、`overflow-x`。
- 想做“闯关/剧情/步骤推进”：查 `时间轴`、`click+Ns`、`visibility`。
- 想做“红包/金币/烟花/漂浮装饰”：查 `自动循环`、`repeatCount=indefinite`。
- 想做“长按/触摸反馈”：查 `touchstart`、`touchmove`、`延迟触发`。

生成前置条件：先拿实际 UI 图/导出素材尺寸确定 `viewBox`，再选择交互模式。不要把 `1080x1600` 等样本尺寸当固定默认值。开发阶段图片使用本地相对路径；上线前通过 `packages` 里的 `wechat-svg-cdn` 工具批量上传并替换 CDN。

索引字段：

- 布局结构：页面如何排版，比如长图切片、局部滚动、横滑、零高度叠层。
- 主要交互：用户看到的互动效果。
- 关键技术：源码里可复用的 SVG/CSS 技术点。
- 复用场景：未来适合套用到什么需求。
- 风险/备注：生成时要规避或复查的地方。

## 1. 模式总览

| 模式 | 典型文件 | 后续生成策略 |
| --- | --- | --- |
| 长图切片/报告叙事 | `【SVG】最高检工作报告中的民生答卷.html`、`2026年政府工作报告有“画”说！.html`、`字节跳动2022年终盘点...html` | 多段 `svg` 拼接，统一 `viewBox` 宽度，切片间 `margin-top:-1px` |
| 点击展开/折叠信息 | `4 个文件夹，看懂蚂蚁的 2022.html`、`「2025年度瞬间」揭晓.html` | `height:0` 容器 + 点击后 `width/height/opacity/translate` 改状态 |
| 点击切换/换页 | `腕间「蓝」主角.html`、`你好，2026.html`、`进 来 寻 人.html` | A/B 状态远距摆放，点击后 `animateTransform translate` |
| 序列帧/视频感 | `点击，给非遗换上新“皮肤”.html`、`抓 马 马 马 马.html`、`🧧速领！一大波“科研福”正在朝你奔来.html` | 帧图横向排列，`calcMode="discrete"` 离散位移 |
| 横向滑动画册 | `腕间「蓝」主角.html`、`Emporio Armani 2026...html`、`「2025年度瞬间」揭晓.html` | 外层 `overflow-x:auto/scroll`，内层超宽 SVG 或 flex + snap |
| 局部滚动/视差 | `2025识典古籍年度数据报告，来了.html`、`如何用豆包一键生成PPT？.html` | 局部容器 `overflow-y:auto`，可叠加 `perspective/translateZ` |
| 自动循环装饰 | `10亿来了！.html`、`进来，我们正在偷放烟花！.html`、`🦞养养养...龙虾.html` | 多个 `animateTransform` 循环，负延迟错峰 |
| 时间轴剧情 | `组队，闯关2020！.html`、`玩转都市闯关！.html` | `click+Ns` 串联 `opacity/visibility/translate` |
| 触摸反馈/长按模拟 | `你好，2026.html`、`10亿来了！.html`、`4 个文件夹...html` | `touchstart` 触发缩放/显隐，`touchstart+Ns` 做延迟 |
| 链接/跳转热区 | `腕间「蓝」主角.html`、`Emporio Armani 2026...html`、`呼～～气～～吸～～气～～.html` | `<a>` + 透明 SVG/rect 热区，注意不要盖住滑动 |

## 2. 全量案例索引

| 文件 | 布局结构 | 主要交互 | 关键技术 | 复用场景 | 风险/备注 |
| --- | --- | --- | --- | --- | --- |
| `10亿来了！.html` | 长图切片 + 首屏叠层 | 金币/物体掉落、旋转、触摸反馈、双击转场 | `repeatCount=indefinite`、负延迟、嵌套 rotate/translate、`touchstart`、`dblclick` | 红包雨、金币雨、开屏动效、抽奖氛围 | `dblclick` 移动端不稳，生成时默认改单击 |
| `2000份新年休闲礼！时光轻启，一起打开2026.html` | 长图/活动页 | 自动循环 + 链接跳转 | 循环动画、链接热区、图片切片 | 活动礼品页、领取入口 | 需复查具体热区坐标 |
| `2025识典古籍年度数据报告，来了.html` | 局部滚动 + 视差 + 数据报告 | 滚动叙事、点击序列帧/展开 | `overflow-y:auto`、`perspective:1px`、`translateZ`、`calcMode=discrete` | 数据报告、文化长卷、滚动视差 | CSS 3D 在安卓端要降级 |
| `2025，你会更_____？.html` | 单屏/多段切换 | hover 预览、点击/高度状态 | `mouseover/mouseout`、`height/width` 动画 | 测试题、选择题、祝福签 | hover 不适合移动端默认 |
| `2025，村里的宝贝藏不住了.html` | 多段长图 + 横滑/触摸 | 点击显隐、触摸反馈、横向内容 | `touchstart`、`calcMode=discrete`、横滑容器 | 乡村/产品展示、地图寻宝 | 交互较杂，复用前需拆段 |
| `2026年政府工作报告有“画”说！.html` | 长图切片/报告 | 点击推进、触摸反馈 | `touchstart`、`height/width` 状态、图片切片 | 政务报告、政策解读 | 正文信息密集，注意可读性 |
| `4 个文件夹，看懂蚂蚁的 2022.html` | 文件夹式零高度叠层 | 点击展开/收缩感、触摸中断 | `height:0`、`width` 扩展、`touchstart/touchmove`、透明热区 | 文件夹展开、卡片展开、目录展开 | 真实收缩不稳定，默认一次性展开 |
| `CHAKA 琉光曲 一封来自自然的邀请函.html` | 品牌长图 | 自动循环/显隐 | `repeatCount=indefinite`、`visibility/opacity` | 品牌邀请函、氛围页 | 需复查是否有链接热区 |
| `Emporio Armani 2026 春夏腕表与配饰系列广告大片.html` | 横向画册 + 产品链接 | 横滑浏览、链接跳转、触摸反馈 | `overflow-x`、`scroll-snap`、`touchstart`、`<a>` 热区 | 产品画册、时尚大片、商品列表 | 热区不能覆盖滑动手势 |
| `MAX&Co. DAILY：今日「星」动头条.html` | 横滑/图文卡片 | 横向浏览、链接 | `overflow-x`、链接热区 | 杂志卡片、新闻头条、产品栏目 | 初级归类，待深挖 |
| `MINI「好故事」独立影展.html` | 视差/切换 | 点击切换、自动循环 | `translateZ`、`calcMode=discrete`、`repeatCount` | 影展、故事切片、海报切换 | 需预览验证视差 |
| `MOVA生活电器｜每一道光，照亮家有新境.html` | 长图 + 视差/链接 | 滚动展示、点击/自动动效 | `translateZ`、循环、链接 | 家电产品卖点页 | 视觉素材依赖较强 |
| `「2025年度瞬间」揭晓.html` | 多段长图 + 横滑 + 展开 | 点击展开、轮播、横滑、触摸 | `height:0`、`scroll-snap`、`calcMode=discrete`、`repeatCount` | 年度盘点、照片墙、卡片合集 | 结构复杂，适合作为组合模式母本 |
| `「绝色」档案.html` | 横滑档案页 | 横向浏览、链接/高度状态 | `overflow-x`、`height` 动画、`<a>` | 档案卡、人物/产品资料卡 | 初级归类，待拆热区 |
| `【SVG】最高检工作报告中的民生答卷.html` | 政务长报告 + SVG 动画 | 点击时间轴/局部动效 | `foreignObject`、`animateTransform`、`click+Ns`、切片 | 报告答卷、长图政策解读 | 长内容需控制性能 |
| `一马当先！做更好的自己 𓃗.html` | 多层 SVG 长页 | 触摸反馈、点击状态、自动循环 | `touchstart`、`calcMode=discrete`、`repeatCount` | 新年祝福、马年主题互动 | 大文件，需二次拆段 |
| `上新！二手玫瑰！接客！.html` | 品牌/活动长页 + 横滑 | 滚动/横滑/点击显隐 | 横滑、`translateZ`、`calcMode=discrete` | 演出活动、品牌上新 | 结构杂，优先抽局部模式 |
| `与美同行，步履不停.html` | 简洁图文/点击态 | 点击显隐/宽高变化 | `calcMode=discrete`、`click+Ns` | 品牌价值页、轻互动海报 | 初级归类 |
| `今天，QQ 27岁了！.html` | 静态或轻交互长图 | 生日主题展示 | 图片/SVG 切片 | 品牌生日页 | 文件小，交互可能较少 |
| `他们这样用豆包｜2025年终讲述.html` | 讲述型长图 + 视差 | 滚动叙事、自动循环 | `translateZ`、`repeatCount` | 人物讲述、案例集 | 初级归类 |
| `你好，2026.html` | 触摸选择/点击切换 | `touchstart/touchmove` 选择、透明热区、状态切换 | 触摸事件、opacity/height/transform | 新年签、选择题、互动祝福 | 真实拖动不可做，适合触摸触发 |
| `写进最高法工作报告的案例.html` | 政务案例长图 | 展开/高度变化 | `height/width` 动画 | 案例报告、司法解读 | 初级归类 |
| `呼～～气～～吸～～气～～.html` | 横滑/呼吸主题 | 横向浏览、链接、显隐 | `overflow-x`、`<a>`、`calcMode` | 健康科普、节奏呼吸、横滑指导 | 需复查是否有真正呼吸动画 |
| `国宝中的巧夺天工.html` | 横滑 + 自动循环 | 横向浏览、循环动效 | `overflow-x`、`repeatCount` | 文博展览、藏品卡片 | 初级归类 |
| `奔赴下一程璀璨.html` | 横向/长图活动页 | 横滑或链接跳转 | `overflow-x`、链接热区 | 品牌活动、邀请函 | 初级归类 |
| `好利来×超级马力欧银河大电影｜准备好了吗？Here We Go！.html` | 活动页 + 横滑/视差 | 触摸、横滑、视差 | `touchstart`、`overflow-x`、`translateZ` | IP 联名活动、游戏化展示 | 多品牌素材密集 |
| `如何用豆包一键生成PPT？.html` | 教程页 + 视差/点击 | 点击推进、自动循环、触摸 | `translateZ`、`repeatCount`、`calcMode=discrete` | 产品教程、步骤引导 | 可沉淀为教程模板 |
| `字节跳动2022年终盘点 那些值得被记住的创造瞬间.html` | 超长年终盘点 | 滚动叙事、路径/动效、自动循环 | `animateMotion`、`translateZ`、`repeatCount`、大 DOM | 年终盘点、长剧情报告 | 超大文件，性能风险高 |
| `寻Meet茅台 茅台在成为茅台之前，是怎样的？.html` | 视差/品牌历史长页 | 点击切换、触摸、滚动 | `translateZ`、`calcMode=discrete`、`touchstart` | 品牌历史、时间长卷 | 初级归类 |
| `年终奖到账104852.54元.html` | 模拟账单/红包页 | 点击状态、序列/显隐 | `calcMode=discrete`、`height/width`、`opacity` | 红包、工资单、账单模拟 | 金额类需注意文案可替换 |
| `开启五一待办事项：准备出发.html` | 活动清单页 | 自动循环轻动效 | `repeatCount=indefinite` | 清单、待办、旅行活动 | 文件小，交互可能简单 |
| `开工大吉！央视新闻专属红包封面，送你🥳.html` | 红包封面活动页 | 点击/触摸、自动循环、跳转 | `touchstart`、`repeatCount`、`calcMode=discrete` | 红包封面领取、福利活动 | 跳转规则需按平台校验 |
| `影像之像.html` | 横滑/视觉展览 | 横向浏览、自动循环 | `overflow-x`、`repeatCount` | 摄影展、作品集 | 初级归类 |
| `悠享2026丨春日放风，开启3200份惊喜好礼.html` | 活动页 + 横滑/链接 | 横滑、链接跳转 | `overflow-x`、`<a>` | 礼品活动、抽奖活动 | 初级归类 |
| `戳戳Codi！解锁@王一博的一天.html` | 明星互动/多状态 | 点击解锁、横滑、自动循环 | `overflow-x`、`repeatCount`、`calcMode=discrete`、链接 | 明星互动、角色一天、打卡 | 状态多，适合做组合模板 |
| `打工人7天“超顺”自救指南.html` | 指南型长页 | 触摸反馈、点击展开、链接 | `touchstart`、`height/width`、`<a>` | 指南、日历、打卡计划 | 初级归类 |
| `抓 马 马 马 马.html` | 大量动效/游戏化 | 序列帧、横滑、触摸/点击 | `calcMode=discrete`、`repeatCount`、`overflow-x` | 抓取小游戏、马年趣味互动 | 大文件，需针对目标片段复用 |
| `时光留声集-捌｜动静之间，形随意动.html` | 视觉艺术/动效页 | 自动循环、链接 | `repeatCount`、`<a>` | 艺术展、动效展示 | 初级归类 |
| `清华经管2025奇思妙想集.html` | 横滑/视差/多段合集 | 横滑、触摸、自动循环 | `overflow-x`、`translateZ`、`touchstart`、`repeatCount` | 校园合集、作品集 | 组合模式较丰富 |
| `点击，给非遗换上新“皮肤”.html` | 序列帧 + 视差/点击 | 点击换皮肤、开屏序列帧 | 帧图横排、`calcMode=discrete`、`translateZ` | 换装、换皮肤、非遗/产品变体 | 序列帧重，需控帧数 |
| `爱你老己（深度版）.html` | 视差/点击切换 | 点击状态、视差滚动 | `translateZ`、`calcMode=discrete`、`height/width` | 情感互动、深度测试 | 初级归类 |
| `王嘉尔 回归.html` | 明星宣传页 | 点击显隐、自动循环 | `calcMode=discrete`、`click+Ns`、`repeatCount` | 明星回归、专辑宣传 | 初级归类 |
| `玩转都市闯关！.html` | 闯关/游戏化长页 | 时间轴剧情、自动循环、点击推进 | `click+Ns`、`repeatCount`、`calcMode=discrete` | 城市闯关、任务地图 | 适合深挖闯关模板 |
| `生活里的「国窖色」.html` | 横滑/链接展示 | 横向浏览、链接 | `overflow-x`、`<a>` | 色彩档案、品牌资产展示 | 初级归类 |
| `红包封面限量抢！马年好运！.html` | 简单福利页 | 可能为静态/跳转 | 轻量 HTML | 红包封面入口 | 文件很小，交互少 |
| `组队，闯关2020！.html` | 超大型手写剧情 SVG | 闯关剧情、点击时间轴、触摸反馈、自动循环 | 大量 `click+Ns`、`set visibility`、`animateTransform`、`repeatCount` | 复杂闯关、剧情推进、游戏化长篇 | 超大 DOM，只抽局部模式，不整体复刻 |
| `编织日常.html` | 横滑/视差/自动动效 | 横滑浏览、自动循环 | `overflow-x`、`translateZ`、`repeatCount` | 生活方式、手作/织物展示 | 初级归类 |
| `腕间「蓝」主角.html` | 顶层滑动 + 纵向局部滚动 + 横滑 + 点击切换 | 纵向局部滚动、点击切换、横向产品滑动、跳转 | `overflow-y:auto`、`overflow-x:scroll`、`foreignObject`、远距 `translate`、`<a>` | 产品画册、腕表/奢品、专题页 | 复合度高，适合作为布局组合样本 |
| `虎年倒计时！和 Snapchat 一起共贺新岁！.html` | 节日互动页 | 触摸/点击切换 | `touchstart`、`calcMode=discrete` | 倒计时、节日祝福 | 初级归类 |
| `解锁生僻字，领略汉字的独特魅力.html` | 文化科普长页 | 自动循环、点击状态 | `repeatCount`、`calcMode=discrete`、`height/width` | 汉字科普、知识卡片 | 初级归类 |
| `跨年领跑！一文看懂小米汽车SU7！.html` | 产品长图 + 横滑/视差 | 横滑、点击切换、视差 | `overflow-x`、`translateZ`、`calcMode=discrete` | 汽车产品解读、参数长图 | 产品信息密集，注意分屏 |
| `进 来 寻 人.html` | 寻人/互动页 | 点击切换、横滑/自动循环 | `overflow-x`、`calcMode=discrete`、`repeatCount` | 寻找目标、线索互动、小游戏 | 初级归类 |
| `进来，我们正在偷放烟花！.html` | 烟花氛围页 | 自动循环、点击/显隐 | `repeatCount`、`calcMode=discrete`、`click+Ns` | 烟花、庆祝、节日氛围 | 循环元素控制数量 |
| `闭眼入岚图追光L的10大理由.html` | 产品卖点长页 + 横滑/视差 | 横滑、视差、展开/高度 | `overflow-x`、`translateZ`、`height/width` | 汽车卖点、十大理由 | 初级归类 |
| `霸王茶姬六周年，请天下茶友喝“亿”杯！.html` | 活动页 + 横滑/点击 | 横滑、点击显隐、链接 | `overflow-x`、`calcMode=discrete`、`<a>` | 品牌周年、福利活动 | 初级归类 |
| `马马马马马马马马马马马马马马！.html` | 马年动效页 | 自动循环、触摸/点击状态 | `repeatCount`、`calcMode=discrete`、`touchstart` | 节日趣味页、生肖主题 | 初级归类 |
| `鹅厂投入1亿元，保护北京这条线.html` | 公益/报告长页 | 触摸/点击、链接 | `touchstart`、`<a>`、`foreignObject` | 公益项目、路线保护、报告 | 初级归类 |
| `🦞养养养养养养养养养养养养龙虾🦞.html` | 趣味养成/序列动效 | 自动循环、点击状态、序列帧 | `repeatCount`、`calcMode=discrete`、`height/width` | 养成互动、宠物/食物主题 | 大量图片，注意性能 |
| `🧧春光，驭时而至🧧.html` | 横滑/节日活动 | 横滑浏览、链接/高度 | `overflow-x`、`height/width`、`<a>` | 节日礼遇、品牌活动 | 初级归类 |
| `🧧福马迎春，好运加「马」.html` | 节日祝福/红包页 | 触摸反馈、自动循环、点击切换 | `touchstart`、`repeatCount`、`calcMode=discrete` | 新春红包、祝福卡、抽签 | 交互适合节日模板 |
| `🧧速领！一大波“科研福”正在朝你奔来.html` | 大型福利活动页 | 序列帧/自动循环/展开 | 大量 `animateTransform`、`repeatCount`、`height/width` | 福利雨、活动领取、科研主题 | 文件大，需抽取局部模式 |

## 3. 高价值深挖清单

下一轮优先深挖这些案例，原因是它们代表的模式最常复用：

| 优先级 | 文件 | 深挖目标 |
| --- | --- | --- |
| P0 | `腕间「蓝」主角.html` | 复合布局：顶层滑动、局部纵滚、横滑、点击切换、跳转热区 |
| P0 | `点击，给非遗换上新“皮肤”.html` | 序列帧换皮肤和开屏播放模板 |
| P0 | `4 个文件夹，看懂蚂蚁的 2022.html` | 点击展开/折叠、零高度布局 |
| P0 | `2025识典古籍年度数据报告，来了.html` | 数据报告滚动叙事、视差、点击序列帧 |
| P0 | `组队，闯关2020！.html` | 大型时间轴剧情、闯关节点组织 |
| P1 | `「2025年度瞬间」揭晓.html` | 年度盘点组合模式：横滑、展开、轮播 |
| P1 | `10亿来了！.html` | 红包/金币雨、节日氛围循环、触摸反馈 |
| P1 | `你好，2026.html` | 触摸选择、透明热区、状态切换 |
| P1 | `Emporio Armani 2026 春夏腕表与配饰系列广告大片.html` | 产品画册横滑和链接热区 |
| P1 | `戳戳Codi！解锁@王一博的一天.html` | 明星/角色互动、多状态解锁 |

## 4. 需要反哺到规范的新增结论

- 案例不是单一模式，而是组合模式。后续生成复杂文章时，应按“静态切片 + 交互岛”的方式组织：静态长图负责叙事，少数交互 SVG 负责关键体验。
- 横滑和点击热区天然冲突。横滑区域内热区应局部化，不能铺满整屏。
- 大型剧情不应整体复刻，应拆成 3-5 个交互段，每段独立触发和定格。
- 序列帧不是越多越好。公众号里更适合“局部短序列帧”，而不是长视频完整拆帧。
- `touchstart+Ns` 可做长按感，但不是真实长按。生成时要写成“长按模拟/按住提示”，避免承诺真实判断。
