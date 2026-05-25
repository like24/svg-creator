# WeChat SVG Animation

微信公众号纯 SVG 交互动画开发工作流。

在公众号环境下构建交互动画——无 JS、无 id/class、纯 SMIL 动画 + CSS 辅助。

## 工作流

```
抓取文章 → 本地开发 SVG 动画 → 上传图片到 CDN → 创建草稿 → 发布
```

## 目录结构

```
works/                          SVG 动画作品
source/                         学习素材、笔记、抓取的文章
  └── notes/                    SVG 动画知识库与学习笔记
packages/                       工具包
  └── wechat-svg-cdn/           图片上传与草稿管理
.claude/skills/                 Claude Code 技能
  └── fetch-svg/                文章抓取
  └── wechat-svg-authoring/     公众号 SVG 动画生成与案例学习
.codex/skills/                  Codex 技能
  └── wechat-svg-authoring/     公众号 SVG 动画生成与案例学习
```

## 工具

### fetch-svg — 抓取公众号文章

提取 `js_content` 内容，清理属性，保存为本地 HTML。

```bash
cd .claude/skills/fetch-svg && npm install

# 单篇
node .claude/skills/fetch-svg/scripts/fetch-article.js "https://mp.weixin.qq.com/s/xxx"

# 多篇
node .claude/skills/fetch-svg/scripts/fetch-article.js "url1" "url2"

# 指定输出目录
node .claude/skills/fetch-svg/scripts/fetch-article.js -o ./output "url"
```

### wechat-svg-cdn — 上传图片 & 创建草稿

扫描 HTML 中的本地图片，上传到微信 CDN，自动替换路径。

```bash
cd packages && npm install
cp .env.example .env  # 填入 WECHAT_APP_ID 和 WECHAT_APP_SECRET

# 上传图片，生成 *-cdn.html
./bin/wechat-cdn.js ./article.html

# 上传 + 创建草稿
./bin/wechat-cdn.js draft ./article.html -t "文章标题"

# 预览模式（不上传）
./bin/wechat-cdn.js --dry-run ./article.html
```

## 知识库

`source/notes/` 下包含：

- `svg-authoring-spec.md` — 公众号 SVG 动画开发规范与模式库
- `svg-learned-assets.md` — 已学习资产表，记录 `source/*.html` 的内容指纹、状态和模式摘要
- `svg-case-index.md` — 全量案例索引，按布局/交互/技术点归类
- `svg-case-evidence.md` — 全量案例复读证据表
- `svg-layout-patterns.md` — SVG 布局与排版模式笔记

## 使用 Skill

本项目已内置 `wechat-svg-authoring` skill，Claude Code 和 Codex 都可以使用：

```text
.claude/skills/wechat-svg-authoring/
.codex/skills/wechat-svg-authoring/
```

这个 skill 用于两类任务：

- 生成或修改公众号 SVG 动画
- 学习新增案例并更新规则库

### 生成 SVG 动画

在 Claude Code 或 Codex 中直接说明使用 skill：

```text
使用 wechat-svg-authoring skill，帮我实现一个公众号 SVG 动画。

需求：
- 图片尺寸：750x1334
- 图片：./images/cover.png、./images/result.png
- 效果：点击 cover 后切换到 result
- 输出：开发阶段 HTML，图片保持本地路径
```

核心规则：

- 不使用 JS
- 不使用外链 CSS
- 使用内联 HTML/SVG/SMIL
- `viewBox` 跟随实际 UI 图尺寸
- 开发阶段图片使用本地相对路径
- 上线前通过 `packages/wechat-svg-cdn` 批量上传并替换 CDN

### 学习新增案例

新增 `source/*.html` 后，让 agent 按固定流程更新知识库：

```text
使用 wechat-svg-authoring skill，学习 source 里新增的公众号 SVG 案例。
请先运行已学习资产表脚本，识别新增/变更案例。
再更新 source/notes/svg-case-evidence.md 和 svg-case-index.md。
如果发现新的可复用规则，再更新 svg-authoring-spec.md。
最后同步 .codex 和 .claude skill references。
```

更新顺序必须是：

```text
已学习资产表 → 案例证据表 → 案例索引 → 开发规范 → 再跑资产表 → skill references
```

辅助脚本：

```bash
node .codex/skills/wechat-svg-authoring/scripts/update-learned-assets.js source
node .codex/skills/wechat-svg-authoring/scripts/extract-case-evidence.js source
```

`update-learned-assets.js` 会维护 `source/notes/svg-learned-assets.md`，用内容指纹识别新增/变更案例，不依赖文件命名规则。

`extract-case-evidence.js` 会提取每个案例的标签、触发事件、动画属性、viewBox、横滑/触摸/序列帧等证据，供更新 `svg-case-evidence.md` 使用。

## 环境要求

- Node.js 18+
