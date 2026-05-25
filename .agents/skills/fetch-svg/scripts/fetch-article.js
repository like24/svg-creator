#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseArgs } = require('util');
const cheerio = require('cheerio');

const SCRIPT_DIR = __dirname;
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..', '..', '..', '..');
const DEFAULT_OUTPUT_DIR = path.join(PROJECT_ROOT, 'source');

const USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
  'Version/16.0 Mobile/15E148 Safari/604.1';

const CUSTOM_ATTR_PREFIXES = ['data-', 'mpa-'];
const CUSTOM_ATTR_NAMES = new Set(['data-mpa-powered-by', 'class', 'id']);

function cleanAttrs($) {
  $('*').each((_, el) => {
    const attrs = Object.keys(el.attribs || {});
    for (const attr of attrs) {
      if (
        CUSTOM_ATTR_NAMES.has(attr) ||
        CUSTOM_ATTR_PREFIXES.some((p) => attr.startsWith(p))
      ) {
        $(el).removeAttr(attr);
      }
    }
  });
}

function parseArticle(html) {
  const $ = cheerio.load(html);

  // 提取标题：优先 og:title，备选 rich_media_title
  let title = $('meta[property="og:title"]').attr('content')?.trim() || '';
  if (!title) {
    title = $('h1.rich_media_title').text().trim();
  }
  if (!title) {
    title = '未命名文章';
  }

  // 提取 js_content 内部内容
  const contentEl = $('#js_content');
  if (!contentEl.length) {
    return { title, content: '' };
  }

  cleanAttrs($);

  const children = contentEl
    .children()
    .toArray()
    .filter((el) => el.type === 'tag')
    .map((el) => $.html(el))
    .join('\n');

  return { title, content: `<div>\n${children}\n</div>` };
}

async function fetchUrl(url) {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(30000),
    });
    if (!resp.ok) {
      console.error(`  [错误] HTTP ${resp.status}`);
      return null;
    }
    return await resp.text();
  } catch (e) {
    console.error(`  [错误] 抓取失败: ${e.message}`);
    return null;
  }
}

function sanitizeFilename(name) {
  return name
    .replace(/[\\/:*?"<>|\n\r\t]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100) || '未命名';
}

function buildOutput(title, content) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body>
${content}
</body>
</html>`;
}

async function processUrl(url, outputDir) {
  console.log(`抓取: ${url}`);
  const html = await fetchUrl(url);
  if (!html) return false;

  const { title, content } = parseArticle(html);

  if (!content) {
    console.log('  [警告] 未找到 js_content，跳过');
    return false;
  }

  const filename = sanitizeFilename(title) + '.html';
  const filepath = path.join(outputDir, filename);

  const output = buildOutput(title, content);
  fs.writeFileSync(filepath, output, 'utf-8');

  console.log(`  标题: ${title}`);
  console.log(`  保存: ${filepath}`);
  return true;
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: 'string', short: 'o' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.help || positionals.length === 0) {
    console.log(`用法: node fetch-article.js [选项] <url> [url2 ...]

选项:
  -o, --output <dir>  输出目录（默认: ${DEFAULT_OUTPUT_DIR}）
  -h, --help          显示帮助`);
    process.exit(values.help ? 0 : 1);
  }

  const outputDir = path.resolve(values.output || DEFAULT_OUTPUT_DIR);
  fs.mkdirSync(outputDir, { recursive: true });

  let success = 0;
  for (const url of positionals) {
    if (await processUrl(url.trim(), outputDir)) {
      success++;
    }
    console.log();
  }

  console.log(`完成: ${success}/${positionals.length} 篇文章已保存到 ${outputDir}`);
}

main();
