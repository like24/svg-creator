# wechat-svg-cdn

微信公众号 SVG 图片上传与文章管理工具。

- 批量上传本地图片到微信 CDN，自动替换 HTML 中的路径
- 一条命令完成：上传图片 → 创建草稿

## 安装

```bash
cd wechat-svg-cdn
npm install
```

## 配置

复制 `.env.example` 为 `.env`，填入公众号凭证：

```bash
cp .env.example .env
```

```env
WECHAT_APP_ID=your_appid
WECHAT_APP_SECRET=your_appsecret
```

> 也可以通过 `--appid` 和 `--secret` 参数传入，优先级更高。

## 命令总览

```bash
wechat-svg-cdn [files...]                   # 上传图片替换路径
wechat-svg-cdn draft <file>                 # 上传图片 + 创建草稿
```

每个命令都支持 `--help`：

```bash
wechat-svg-cdn --help
wechat-svg-cdn draft --help
```

---

## 完整工作流

```bash
# 1. 本地开发 SVG 动画（使用本地图片）

# 2. 上传图片到 CDN，浏览器自动打开预览
wechat-svg-cdn ./article.html

# 3. 创建草稿（上传图片 + 创建草稿一步完成）
wechat-svg-cdn draft ./article.html -t "文章标题"

# 4. 去公众号后台 → 草稿箱 → 预览/发布
```

---

## 上传图片（默认命令）

扫描 HTML 中的本地图片引用，上传到微信 CDN，生成替换后的新文件。

```bash
wechat-svg-cdn ./article.html
```

### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `files...` | HTML 文件路径，支持多个 | - |
| `-o, --output <dir>` | 输出目录 | 与输入文件同目录 |
| `--suffix <suffix>` | 输出文件后缀 | `-cdn` |
| `--dry-run` | 预览替换内容，不实际上传 | - |
| `--no-cache` | 跳过缓存，强制重新上传 | - |
| `--clean-cache` | 清理缓存文件 | - |
| `--no-open` | 不自动打开生成的文件 | - |
| `--appid <id>` | 微信 AppID | 从 .env 读取 |
| `--secret <secret>` | 微信 AppSecret | 从 .env 读取 |
| `-v, --verbose` | 详细输出 | - |

### 示例

```bash
# 基本上传
wechat-svg-cdn ./article.html

# 预览模式（不上传）
wechat-svg-cdn --dry-run ./article.html

# 批量处理
wechat-svg-cdn ./page1.html ./page2.html

# 指定输出目录
wechat-svg-cdn -o ./published ./article.html
```

---

## 创建草稿 (draft)

一条命令完成：上传图片 + 创建草稿。

```bash
wechat-svg-cdn draft ./article.html -t "文章标题"
```

### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `file` | HTML 文件路径 | 必填 |
| `-t, --title <title>` | 文章标题 | 文件名 |
| `-a, --author <author>` | 作者名称 | 空 |
| `-d, --digest <digest>` | 文章摘要 | 空 |
| `--thumb <mediaId>` | 封面图素材 ID | 自动使用第一张图片 |
| `--template <file>` | 模板文件 | - |
| `--media-id <id>` | 更新已有草稿 | 创建新草稿 |
| `--no-cache` | 跳过缓存 | - |
| `--appid <id>` | 微信 AppID | 从 .env 读取 |
| `--secret <secret>` | 微信 AppSecret | 从 .env 读取 |
| `-v, --verbose` | 详细输出 | - |

### 模板插入

模板文件中用 `{{content}}` 标记插入位置：

```html
<!-- template.html -->
<div class="header">文章头部</div>
<div class="body">
  {{content}}
</div>
<div class="footer">文章尾部</div>
```

```bash
wechat-svg-cdn draft ./article.html --template ./template.html -t "文章标题"
```

### 示例

```bash
# 基本创建草稿
wechat-svg-cdn draft ./article.html -t "SVG动画"

# 带模板
wechat-svg-cdn draft ./article.html -t "SVG动画" --template ./tpl.html

# 更新已有草稿
wechat-svg-cdn draft ./article.html -t "SVG动画" --media-id MEDIA_ID
```

---

## 状态文件

工具会在当前目录生成 `.wechat-cdn-state.json`，记录最近创建的草稿 `media_id`。

这样可以更新已有草稿而不需要每次都传 `--media-id`。

---

## 支持的图片引用格式

### CSS background-image

```html
<svg style="background-image: url(&quot;./images/bg.png&quot;);"></svg>
<svg style="background: url(&quot;./images/bg.png&quot;);"></svg>
<svg style="background-image: url(./images/bg.png);"></svg>
```

### SVG image 标签

```html
<image href="./images/icon.svg" width="50" height="50"/>
```

### HTML img 标签

```html
<img src="./images/photo.jpg" alt="test"/>
```

> 只匹配本地路径（`./`、`../`、或相对路径），已有的 `https://` CDN 链接会被自动忽略。

---

## 缓存机制

- 按文件内容 MD5 hash 缓存，相同内容只上传一次
- 修改图片内容会自动重新上传
- 缓存文件：`.wechat-cdn-cache.json`（在执行命令的当前目录）

## 常见问题

### IP 白名单错误

```
[40164] invalid ip, not in whitelist
```

在公众号后台添加当前 IP：设置与开发 → 基本配置 → IP 白名单

```bash
# 查看当前公网 IP
curl ifconfig.me
```
