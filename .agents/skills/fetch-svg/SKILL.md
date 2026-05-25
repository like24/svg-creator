---
name: fetch-svg
description: >-
  This skill should be used when the user asks to "fetch WeChat article",
  "抓取公众号文章", "提取微信文章", "fetch-svg", or provides a mp.weixin.qq.com URL
  for content extraction.
version: 2.0.0
---

# fetch-svg

Fetch WeChat public account articles, extract content from `id="js_content"` container, clean custom attributes, and save as formatted HTML.

## Usage

Run the script with one or more WeChat article URLs:

```bash
node .Codex/skills/fetch-svg/scripts/fetch-article.js "<url>"
```

Multiple URLs:

```bash
node .Codex/skills/fetch-svg/scripts/fetch-article.js "<url1>" "<url2>"
```

Custom output directory:

```bash
node .Codex/skills/fetch-svg/scripts/fetch-article.js -o ./output "<url>"
```

## Output

- Default path: `source/<title>.html`
- Content: children of `js_content`, with `data-*`/`class`/`id` attributes removed, wrapped in `<div>`

## Dependencies

Requires Node.js 18+ and cheerio:

```bash
cd .Codex/skills/fetch-svg && npm install
```
