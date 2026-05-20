# 公众号 SVG 案例复读证据表

版本：v0.1  
来源：逐个扫描 `source/*.html`，提取标签、`begin`、`attributeName`、`viewBox`、资源引用、滚动/触摸/序列帧等结构证据。  
用途：证明每个案例都被纳入学习，并为 `svg-case-index.md` 的归类提供证据来源。

## 0. 证据字段说明

- 结构证据：源码里高频标签和布局特征。
- 交互证据：`begin` 触发、`touchstart/touchmove/click+Ns/dblclick` 等。
- 动画证据：`attributeName`、`repeatCount`、`calcMode`、`set visibility` 等。
- 布局证据：`viewBox` 尺寸族、横滑、纵滚、视差、零高度。
- 资源证据：当前样本多为上线稿 CDN 资源；开发稿规则仍是本地路径，发布前工具替换 CDN。

## 1. 全量案例证据矩阵

| 文件 | 结构/布局证据 | 交互证据 | 动画证据 | 可复用判断 |
| --- | --- | --- | --- | --- |
| `10亿来了！.html` | 多层 `g/svg/foreignObject`，`viewBox 1080x1619`，首屏叠层 | `dblclick+Ns`、`touchstart`、少量 `click` | `repeatCount=indefinite`、`translate+rotate`、宽高/显隐 | 红包雨、金币雨、节日氛围；双击应改为单击 |
| `2000份新年休闲礼！时光轻启，一起打开2026.html` | 大量 `svg/foreignObject/g/section`，`viewBox 864` 系 | 大量 `click`，链接热区 | `opacity/transform` 循环与点击显隐 | 活动礼品页、领取入口、批量热区 |
| `2025识典古籍年度数据报告，来了.html` | `345` 宽移动坐标，长报告切片，横滑/视差 | `click`、`click+2.7s` | `opacity/height/transform/visibility/width`、`discrete` | 数据报告、滚动叙事、视差报告 |
| `2025，你会更_____？.html` | `1080x1920` 多状态图层 | `mouseover/mouseout` | `transform/opacity` | 桌面 hover 案例，只学状态结构，移动端不用 hover |
| `2025，村里的宝贝藏不住了.html` | `345` 宽，多段图层，吸附横滑 | `touchstart/touchmove/click` | `opacity/transform/height`、`discrete` | 乡村展示、地图寻宝、触摸选择 |
| `2026年政府工作报告有“画”说！.html` | 政务报告，纵向局部滚动，零高容器 | `touchstart` 高频、`click` | `transform/opacity/x/visibility` | 政务长图、纵滚自定义容器 |
| `4 个文件夹，看懂蚂蚁的 2022.html` | 文件夹式零高度叠层，`viewBox 765/686` | `touchstart/touchmove/click` | `width/x/visibility/transform/opacity` | 点击展开、文件夹展开、零高度布局 |
| `CHAKA 琉光曲 一封来自自然的邀请函.html` | `345` 宽品牌邀请函，链接热区 | `click`、自动开始 | `opacity/width/visibility` | 品牌邀请函、轻循环、热区跳转 |
| `Emporio Armani 2026 春夏腕表与配饰系列广告大片.html` | 横滑、scroll snap、顶层滑动、`1080/756/750` | `touchstart/touchmove/click+Ns`、链接 | `transform/height/opacity/x` | 产品画册、商品横滑、链接热区 |
| `MAX&Co. DAILY：今日「星」动头条.html` | 横滑/多热区弹出式海报，浮层 | 链接热区 | 交互动画较少 | 杂志卡片、新闻头条、浮层热区 |
| `MINI「好故事」独立影展.html` | 视差/多图切换，`1080x1546` 系 | `click+Ns` | `opacity/visibility/transform/width`、`discrete` | 影展海报、故事切片、点击转场 |
| `MOVA生活电器｜每一道光，照亮家有新境.html` | 长图 + 视差，`345` 宽，多图层 | `click` | `width/visibility/opacity`、`discrete` | 家电卖点页、图层显隐 |
| `「2025年度瞬间」揭晓.html` | 超复杂组合：长图、横滑、吸附、展开、零高 | `click/touchstart/touchmove/click+Ns` | `transform/height/opacity/width`、循环、离散 | 年度盘点组合母本 |
| `「绝色」档案.html` | 横滑档案页、浮层、点击伸长渐现 | `click/click+0.5s`、链接 | `width/visibility/opacity/height` | 档案卡、资料卡、企业热区版点击切换 |
| `【SVG】最高检工作报告中的民生答卷.html` | 政务报告切片，`foreignObject`，长时间轴 | `click+44s` 等长时间线 | `transform/opacity/visibility/width`、`animateMotion` | 长报告时间轴、政策解读 |
| `一马当先！做更好的自己 𓃗.html` | 大量 `foreignObject/svg/g`，横滑，路径动画 | `touchstart+Ns` 长延迟、`dblclick` | `transform`、`animateMotion`、循环 | 马年主题、长按/触摸延迟、路径动效 |
| `上新！二手玫瑰！接客！.html` | 纵向局部滚动、吸附横滑、视差、零高 | `click/click+Ns` | `transform/opacity/height/visibility` | 演出活动、品牌上新、局部模式抽取 |
| `与美同行，步履不停.html` | 长图自动出现，零高容器，`900` 宽 | 定时自动 `6s/7s/11s` | `opacity/transform/width/stroke-dashoffset` | 自动逐段出现、描边进度少量参考 |
| `今天，QQ 27岁了！.html` | 轻交互/静态长图，`1000` 宽 | 无明显 SMIL 触发 | 无明显动画属性 | 品牌生日静态切片 |
| `他们这样用豆包｜2025年终讲述.html` | `345` 宽讲述型长图，视差 | 自动开始 | `transform/opacity/width` | 人物讲述、案例集、视差叙事 |
| `你好，2026.html` | 触摸选择，多透明热区，`1080x2361` | 大量 `touchstart/touchmove/click+0.31s` | `transform/opacity/height/x` | 新年签、选择题、触摸选择器 |
| `写进最高法工作报告的案例.html` | 政务案例长图，`1080` 宽多切片 | 无明显 SMIL 触发 | 静态/轻交互 | 案例报告、长图切片 |
| `呼～～气～～吸～～气～～.html` | 吸附横滑、点击伸长、链接热区，`750` 宽 | `click/click+0.5s` | `width/height/opacity`、`discrete` | 呼吸节奏、健康科普、横滑指导 |
| `国宝中的巧夺天工.html` | 横滑 + 自动循环，`650/1280/343` 坐标混用 | `click` | `transform/width`、循环 | 文博展览、藏品卡片 |
| `奔赴下一程璀璨.html` | 横向活动页、链接热区，`1080` 宽 | 链接为主 | 静态/轻交互 | 品牌活动、邀请函 |
| `好利来×超级马力欧银河大电影｜准备好了吗？Here We Go！.html` | 纵向局部滚动、视差、链接，IP 活动 | `touchstart/click/click+4s` | `transform/opacity/x/width` | IP 联名、游戏化活动 |
| `如何用豆包一键生成PPT？.html` | 教程页、视差、吸附横滑，`345` 宽 | `touchstart/click` | `x/transform/height/opacity/visibility` | 产品教程、步骤引导 |
| `字节跳动2022年终盘点 那些值得被记住的创造瞬间.html` | 超长年终盘点，`animateMotion` 大量路径动画 | 自动为主，少量 `click+Ns` | `transform/opacity/visibility/height`、路径动画 | 年终盘点、路径/粒子动效，性能风险高 |
| `寻Meet茅台 茅台在成为茅台之前，是怎样的？.html` | 品牌历史，视差，`345` 宽 | `touchstart/touchmove/click+0.31s` | `transform/x/opacity/height/width` | 品牌历史长卷、触摸选择 |
| `年终奖到账104852.54元.html` | 模拟账单/红包，`345` 宽超高零高 | `click/click+3` | `opacity/transform/width`、`discrete` | 红包、工资单、账单模拟 |
| `开启五一待办事项：准备出发.html` | 清单活动页，自动上下浮动 | `click` | `transform/width/height` | 待办清单、旅行活动 |
| `开工大吉！央视新闻专属红包封面，送你🥳.html` | 红包封面活动，吸附横滑 | `touchstart/touchmove/click+Ns` | `transform/opacity/width/visibility` | 红包封面、福利领取 |
| `影像之像.html` | 吸附横滑，高速序列帧 48 帧 | 定时序列 | 大量 `opacity` 序列帧 | 摄影展、作品集、高速帧动画 |
| `悠享2026丨春日放风，开启3200份惊喜好礼.html` | 纵向局部滚动，活动图文 | 链接热区 | 静态/轻交互 | 礼品活动、抽奖活动 |
| `戳戳Codi！解锁@王一博的一天.html` | 明星互动，横滑，高速序列帧 | 定时序列、链接 | 大量 `opacity`、少量 `transform` | 明星/角色互动、多状态解锁 |
| `打工人7天“超顺”自救指南.html` | 指南型长页、链接热区、触摸 | `touchstart/click/click+Ns` | `transform/opacity/x/height/width` | 日历、打卡、指南 |
| `抓 马 马 马 马.html` | 大型游戏化，横滑/序列/时间轴 | 大量 `click/click+Ns/touchstart` | `opacity/transform/visibility/height/width` | 抓取小游戏、马年趣味互动 |
| `时光留声集-捌｜动静之间，形随意动.html` | 艺术动效页，链接热区 | `click+1s`、自动 | `transform/width/opacity/visibility/x` | 艺术展、动效展示 |
| `清华经管2025奇思妙想集.html` | 横滑、视差、触摸、组合合集 | `click/touchstart/touchmove` | `transform/opacity/height/visibility/x` | 校园合集、作品集、组合模式 |
| `点击，给非遗换上新“皮肤”.html` | 大型序列帧，视差，`345` 宽 | `click/click+2s` | `transform/opacity/visibility/width`、离散帧 | 换装、换皮肤、开屏序列 |
| `爱你老己（深度版）.html` | 视差 + 点击切换，AI 语料文本 | `click+2s/click+3` | `transform/opacity/visibility/width` | 情感互动、深度测试 |
| `王嘉尔 回归.html` | 明星宣传页，多图层 | `click/click+4s`、自动 | `opacity/transform/width` | 明星回归、专辑宣传 |
| `玩转都市闯关！.html` | 闯关游戏化，多段剧情 | 大量 `click/click+3s` | `transform/opacity/height/width/visibility` | 城市闯关、任务地图 |
| `生活里的「国窖色」.html` | 横滑色彩档案，链接热区 | `click` 与链接 | `transform/opacity/width` | 色彩档案、品牌资产 |
| `红包封面限量抢！马年好运！.html` | 简单福利页，少量 SVG | 无明显触发 | 静态 | 红包封面入口 |
| `组队，闯关2020！.html` | 单个超大手写 SVG，`750x14424`，大量 `rect/path/polygon` | `click/click+Ns/touchstart` | `set visibility`、`transform/opacity`、自动循环 | 闯关剧情核心母本；只抽局部，不整体复刻 |
| `编织日常.html` | 视差、吸附滑动、差速滚动广告 | 自动负延迟 | `width/transform` | 生活方式、手作、差速滑动 |
| `腕间「蓝」主角.html` | 顶层滑动、纵向局部滚动、横滑、点击切换、链接 | `click` | `transform`、远距 `translate` | 产品画册/奢品专题复合布局母本 |
| `虎年倒计时！和 Snapchat 一起共贺新岁！.html` | 节日互动，`750/1000` 坐标 | `touchstart+Ns` | `transform/visibility/x` | 倒计时、节日祝福、触摸延迟 |
| `解锁生僻字，领略汉字的独特魅力.html` | 文化科普，`345` 宽 | `click`、自动 | `height/transform/opacity` | 知识卡片、汉字科普 |
| `跨年领跑！一文看懂小米汽车SU7！.html` | 汽车产品长图，横滑，视差 | 自动为主，链接热区 | `opacity/transform` | 汽车产品解读、参数长图 |
| `进 来 寻 人.html` | 寻人互动，吸附横滑，多状态 | `click/click+2.6/touchstart` | `transform/opacity/height` | 线索互动、寻找目标小游戏 |
| `进来，我们正在偷放烟花！.html` | 烟花氛围，点击显隐 | `click/click+Ns` | `transform/opacity/visibility/height` | 烟花、庆祝、节日氛围 |
| `闭眼入岚图追光L的10大理由.html` | 产品卖点，横滑、视差、链接 | 链接/滚动 | 静态为主 | 汽车卖点、十大理由 |
| `霸王茶姬六周年，请天下茶友喝“亿”杯！.html` | 周年活动，横滑，链接，点击 | `click/click+Ns` | `transform/opacity/height/visibility/width` | 周年福利、品牌活动 |
| `马马马马马马马马马马马马马马！.html` | 马年大型动效，触摸/循环 | `touchstart/touchmove/click` | `transform/opacity/width`、自动循环 | 生肖趣味页、触摸反馈 |
| `鹅厂投入1亿元，保护北京这条线.html` | 公益报告，超多 `foreignObject`，链接 | `click/touchstart` | `animate` 属性不规范但有显隐/循环 | 公益项目、路线报告 |
| `🦞养养养养养养养养养养养养龙虾🦞.html` | 养成主题，大量路径动画/序列 | `click/dblclick`、自动 | `opacity/transform/x/height/width`、`animateMotion` | 养成互动、宠物/食物主题 |
| `🧧春光，驭时而至🧧.html` | 节日横滑活动 | `click+Ns`、链接 | `opacity/transform/width` | 节日礼遇、品牌活动 |
| `🧧福马迎春，好运加「马」.html` | 节日祝福，触摸/循环 | `touchstart/touchmove/click` | `transform/opacity/width` | 新春红包、祝福卡、抽签 |
| `🧧速领！一大波“科研福”正在朝你奔来.html` | 大型福利活动，超多 transform | 大量 `click/click+2s` | `transform/opacity`、自动循环 | 福利雨、领取活动；需要拆局部复用 |

## 2. 复读后修正的理解

1. 很多文件是编辑器压缩成少量超长行，不能用行数判断复杂度，要看字节数、标签数和动画节点数。
2. `345`、`640`、`750`、`1000`、`1080` 都是样本里的设计坐标族，不是固定画布。实际生成仍以 UI 图尺寸为准。
3. 高速序列帧不一定都靠 `translate`，部分案例用多层 `opacity` 定时切换。
4. “横滑 + 链接热区”非常常见，生成时必须避免热区覆盖滚动手势。
5. “长按”多数是 `touchstart+Ns` 延迟，不是真实持续按压检测。
6. 大型闯关类案例多用 `set visibility` 管状态，和远距 `translate` 一样重要。
7. `foreignObject` 是案例库高频承载方式，但简单图片仍可优先用 `<image>`。
8. 案例库包含少量桌面预览事件如 `mouseover/mouseout/dblclick`，只能作为结构参考，不能作为移动端默认交互。

## 3. 下一步反哺

- `svg-case-index.md` 应从“初级归类”升级为“证据归类”，逐步引用本文件的触发和动画证据。
- `svg-authoring-spec.md` 的模式库需补充：`set visibility` 状态机、`opacity` 高速序列帧、编辑器零高容器这三类高频写法。
