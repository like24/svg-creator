#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || 'source';
const files = fs.readdirSync(root)
  .filter((file) => file.endsWith('.html'))
  .sort();

function collect(re, text) {
  const values = [];
  let match;
  re.lastIndex = 0;
  while ((match = re.exec(text))) values.push(match[1]);
  return values;
}

function top(values, limit) {
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => `${key}:${count}`);
}

for (const file of files) {
  const fullPath = path.join(root, file);
  const text = fs.readFileSync(fullPath, 'utf8');
  const tags = [];
  let match;
  const tagRe = /<\/?([a-zA-Z][\w:-]*)\b/g;
  while ((match = tagRe.exec(text))) tags.push(match[1].toLowerCase());

  const flags = [];
  [
    [/overflow-x\s*:\s*(auto|scroll)/i, '横滑'],
    [/scroll-snap-type/i, '吸附横滑'],
    [/overflow-y\s*:\s*auto/i, '纵向局部滚动'],
    [/perspective\s*:\s*1px|translateZ/i, '视差'],
    [/repeatCount="indefinite"/i, '自动循环'],
    [/calcMode="discrete"/i, '离散/序列帧'],
    [/begin="touchstart/i, '触摸'],
    [/touchmove/i, '触摸移动'],
    [/begin="click\+/i, '点击时间轴'],
    [/<a\b|linktype="|data-miniprogram|小程序/i, '跳转热区'],
    [/height\s*:\s*0|attributeName="height"/i, '零高度/高度动画'],
    [/attributeName="width"/i, '宽度动画'],
    [/animateMotion/i, '路径动画'],
    [/mouseover|mouseout/i, '桌面hover'],
    [/dblclick/i, '双击'],
  ].forEach(([re, label]) => {
    if (re.test(text)) flags.push(label);
  });

  const row = {
    file,
    bytes: Buffer.byteLength(text),
    topTags: top(tags, 8),
    flags,
    beginTop: top(collect(/begin="([^"]+)"/g, text), 6),
    attrTop: top(collect(/attributeName="([^"]+)"/g, text), 5),
    labels: collect(/label="([^"]+)"/g, text).slice(0, 8),
    viewboxes: collect(/viewBox="([^"]+)"/g, text).slice(0, 6),
    localRefs: (text.match(/(?:href|src)="(?!https?:|\/\/)[^"]+\.(?:png|jpe?g|gif|webp|svg)"|url\((?:&quot;|")?(?!https?:|\/\/)[^)]+\.(?:png|jpe?g|gif|webp|svg)/gi) || []).length,
    remoteRefs: (text.match(/https?:\/\/[^"&)]+\.(?:png|jpe?g|gif|webp|svg)|https?:\/\/[^"&)]+wx_fmt=/gi) || []).length,
  };
  console.log(JSON.stringify(row));
}
