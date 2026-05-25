const { CSS_URL_RE, SVG_IMAGE_RE, HTML_IMG_RE } = require('./scanner');

function replacePaths(htmlContent, pathMap) {
  let result = htmlContent;

  // 1. CSS background-image — 只替换 url() 中的路径部分
  result = result.replace(CSS_URL_RE, (fullMatch, localPath) => {
    const cdnUrl = pathMap.get(localPath.trim());
    if (!cdnUrl) return fullMatch;
    return fullMatch.replace(localPath.trim(), cdnUrl);
  });

  // 2. SVG <image href>
  result = result.replace(SVG_IMAGE_RE, (fullMatch, localPath) => {
    const cdnUrl = pathMap.get(localPath.trim());
    if (!cdnUrl) return fullMatch;
    return fullMatch.replace(localPath.trim(), cdnUrl);
  });

  // 3. HTML <img src>
  result = result.replace(HTML_IMG_RE, (fullMatch, localPath) => {
    const cdnUrl = pathMap.get(localPath.trim());
    if (!cdnUrl) return fullMatch;
    return fullMatch.replace(localPath.trim(), cdnUrl);
  });

  return result;
}

module.exports = { replacePaths };
