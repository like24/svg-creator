const path = require('path');

// CSS url() — 匹配 background / background-image: url(...)
// 支持三种写法：url(&quot;path&quot;) / url("path") / url(path)
// 排除 http/https URL
const CSS_URL_RE =
  /background(?:-image)?:\s*url\(\s*(?:&quot;|")?((?!(?:https?:)?\/\/)[^"')&]+)(?:&quot;|")?\s*\)/gi;

// <image href="...">
const SVG_IMAGE_RE = /<image[^>]+href="((?!(?:https?:)?\/\/)[^"]+)"/gi;

// <img src="...">
const HTML_IMG_RE = /<img[^>]+src="((?!(?:https?:)?\/\/)[^"]+)"/gi;

function scanFile(htmlContent) {
  const refs = [];
  const seen = new Set();
  let match;

  // 1. CSS background-image
  CSS_URL_RE.lastIndex = 0;
  while ((match = CSS_URL_RE.exec(htmlContent)) !== null) {
    const localPath = match[1].trim();
    if (!seen.has(localPath)) {
      seen.add(localPath);
      refs.push({ localPath, context: 'css-bg' });
    }
  }

  // 2. SVG <image href>
  SVG_IMAGE_RE.lastIndex = 0;
  while ((match = SVG_IMAGE_RE.exec(htmlContent)) !== null) {
    const localPath = match[1].trim();
    if (!seen.has(localPath)) {
      seen.add(localPath);
      refs.push({ localPath, context: 'svg-image' });
    }
  }

  // 3. HTML <img src>
  HTML_IMG_RE.lastIndex = 0;
  while ((match = HTML_IMG_RE.exec(htmlContent)) !== null) {
    const localPath = match[1].trim();
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

module.exports = { scanFile, resolveImagePath, CSS_URL_RE, SVG_IMAGE_RE, HTML_IMG_RE };
