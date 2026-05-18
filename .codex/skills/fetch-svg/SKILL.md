---
name: fetch-svg
description: >-
  Use this skill when the user asks to fetch WeChat public account articles,
  抓取公众号文章, 提取微信文章, use fetch-svg, or provides an mp.weixin.qq.com URL
  for local HTML extraction in the SVG animation workflow.
version: 2.0.0
---

# fetch-svg

Fetch WeChat public account articles, extract content from the `id="js_content"` container, clean custom attributes, and save formatted local HTML.

## Usage

Run the script with one or more WeChat article URLs:

```bash
node .codex/skills/fetch-svg/scripts/fetch-article.js "<url>"
```

Multiple URLs:

```bash
node .codex/skills/fetch-svg/scripts/fetch-article.js "<url1>" "<url2>"
```

Custom output directory:

```bash
node .codex/skills/fetch-svg/scripts/fetch-article.js -o ./output "<url>"
```

## Output

- Default path: `source/<title>.html`
- Content: children of `js_content`, with `data-*`, `mpa-*`, `class`, and `id` attributes removed, wrapped in `<div>`

## Dependencies

Requires Node.js 18+ and cheerio:

```bash
cd .codex/skills/fetch-svg && npm install
```
