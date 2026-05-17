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

- `svg-animation-knowledge.md` — 微信 SVG 动画完整参考（动画属性、容器结构、18 种动画模式、排错清单）
- `svg-animation-guide.md` — 学习指南
- `1.txt ~ 30.txt` — 学习笔记

## 环境要求

- Node.js 18+
