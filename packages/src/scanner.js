const path = require('path');

// CSS url() — 匹配 background / background-image: url(...)
// 支持三种写法：url(&quot;path&quot;) / url("path") / url(path)
// 排除 http/https、协议相对 URL 和 data URI
const CSS_URL_RE =
  /background(?:-image)?:\s*url\(\s*(?:&quot;|")?((?!(?:(?:https?:)?\/\/|data:))[^"')&]+)(?:&quot;|")?\s*\)/gi;

// <image href="...">
const SVG_IMAGE_RE = /<image[^>]+href="((?!(?:(?:https?:)?\/\/|data:))[^"]+)"/gi;

// <img src="...">
const HTML_IMG_RE = /<img[^>]+src="((?!(?:(?:https?:)?\/\/|data:))[^"]+)"/gi;

// 微信图片 CDN。除了标准 https:// 链接，也兼容 //host/path 和
// 运营代码里偶尔出现的无协议 host/path 写法。
const WECHAT_IMAGE_URL_RE = /^(?:(?:https?:)?\/\/)?(?:(?:mmbiz|mmecoa)\.qpic\.cn|(?:wx|mmbiz)\.qlogo\.cn)(?:[\/:?#]|$)/i;

function isWechatImageUrl(value) {
  if (!value) return false;
  const normalized = value
    .trim()
    .replace(/^&quot;|&quot;$/gi, '')
    .replace(/^["']|["']$/g, '');
  return WECHAT_IMAGE_URL_RE.test(normalized);
}

function scanFile(htmlContent) {
  const refs = [];
  const seen = new Set();
  let match;

  // 1. CSS background-image
  CSS_URL_RE.lastIndex = 0;
  while ((match = CSS_URL_RE.exec(htmlContent)) !== null) {
    const localPath = match[1].trim();
    if (isWechatImageUrl(localPath)) continue;
    if (!seen.has(localPath)) {
      seen.add(localPath);
      refs.push({ localPath, context: 'css-bg' });
    }
  }

  // 2. SVG <image href>
  SVG_IMAGE_RE.lastIndex = 0;
  while ((match = SVG_IMAGE_RE.exec(htmlContent)) !== null) {
    const localPath = match[1].trim();
    if (isWechatImageUrl(localPath)) continue;
    if (!seen.has(localPath)) {
      seen.add(localPath);
      refs.push({ localPath, context: 'svg-image' });
    }
  }

  // 3. HTML <img src>
  HTML_IMG_RE.lastIndex = 0;
  while ((match = HTML_IMG_RE.exec(htmlContent)) !== null) {
    const localPath = match[1].trim();
    if (isWechatImageUrl(localPath)) continue;
    if (!seen.has(localPath)) {
      seen.add(localPath);
      refs.push({ localPath, context: 'html-img' });
    }
  }

  return refs;
}

function resolveImagePath(htmlFilePath, localImagePath) {
  const htmlDir = path.dirname(path.resolve(htmlFilePath));
  return path.resolve(htmlDir, localImagePath);
}

module.exports = {
  scanFile,
  resolveImagePath,
  isWechatImageUrl,
  WECHAT_IMAGE_URL_RE,
  CSS_URL_RE,
  SVG_IMAGE_RE,
  HTML_IMG_RE,
};
