#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.argv[2] || 'source';
const outFile = process.argv[3] || path.join(root, 'notes', 'svg-learned-assets.md');
const evidenceFile = path.join(root, 'notes', 'svg-case-evidence.md');

function sha1(text) {
  return crypto.createHash('sha1').update(text).digest('hex');
}

function collect(re, text) {
  const values = [];
  let match;
  re.lastIndex = 0;
  while ((match = re.exec(text))) values.push(match[1]);
  return values;
}

function uniq(values) {
  return Array.from(new Set(values));
}

function top(values, limit) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, count]) => `${key}:${count}`);
}

function detectPatterns(text) {
  const checks = [
    [/height\s*:\s*0|attributeName="height"/i, '零高/伸长'],
    [/begin="click|begin='click/i, '点击'],
    [/begin="click\+/i, '半自动时间轴'],
    [/begin="touchstart|begin='touchstart/i, '触摸开始'],
    [/touchmove/i, '触摸移动'],
    [/overflow-x\s*:\s*(auto|scroll)|scroll-snap-type\s*:\s*x/i, '横滑'],
    [/overflow-y\s*:\s*auto|overflow\s*:\s*hidden\s+scroll|overflow\s*:\s*scroll\s+hidden/i, '局部滚动'],
    [/perspective\s*:\s*1px|translateZ/i, '视差'],
    [/repeatCount="indefinite"|repeatCount='indefinite'/i, '自动循环'],
    [/calcMode="discrete"|calcMode='discrete'/i, '离散/序列帧'],
    [/animateMotion/i, '路径动画'],
    [/set\s+attributeName="visibility"|set\s+attributeName='visibility'/i, '显隐状态机'],
    [/attributeName="width"|attributeName='width'/i, '宽度动画'],
    [/stroke-dashoffset/i, '描边进度'],
    [/<a\b|linktype="|data-miniprogram|小程序/i, '跳转热区'],
    [/mouseover|mouseout/i, '桌面hover'],
    [/dblclick/i, '双击'],
  ];
  return checks.filter(([re]) => re.test(text)).map(([, label]) => label);
}

function readPrevious(file) {
  if (!fs.existsSync(file)) return new Map();
  const text = fs.readFileSync(file, 'utf8');
  const rows = new Map();
  const re = /^\| `([^`]+)` \| [^|]* \| [^|]* \| `([a-f0-9]{12})` \|/gm;
  let match;
  while ((match = re.exec(text))) rows.set(match[1], match[2]);
  return rows;
}

function readLearnedEvidence(file) {
  if (!fs.existsSync(file)) return new Set();
  const text = fs.readFileSync(file, 'utf8');
  const files = new Set();
  const re = /^\| `([^`]+)` \|/gm;
  let match;
  while ((match = re.exec(text))) files.add(match[1]);
  return files;
}

function makeRow(file, fullPath, previous, learnedEvidence) {
  const text = fs.readFileSync(fullPath, 'utf8');
  const stat = fs.statSync(fullPath);
  const hash = sha1(text);
  const shortHash = hash.slice(0, 12);
  const viewboxes = uniq(collect(/viewBox="([^"]+)"/g, text)).slice(0, 4);
  const begins = top(collect(/begin="([^"]+)"/g, text), 4);
  const attrs = top(collect(/attributeName="([^"]+)"/g, text), 5);
  const patterns = detectPatterns(text);
  const previousHash = previous.get(file);
  const hasEvidence = learnedEvidence.has(file);
  let status;
  if (!hasEvidence) {
    status = '新增';
  } else if (previousHash && previousHash !== shortHash) {
    status = '已变更';
  } else {
    status = '已学习';
  }

  return {
    file,
    status,
    bytes: stat.size,
    mtime: stat.mtime.toISOString(),
    shortHash,
    patterns,
    viewboxes,
    begins,
    attrs,
  };
}

function esc(value) {
  return String(value || '').replace(/\|/g, '\\|');
}

const files = fs.readdirSync(root)
  .filter((file) => file.endsWith('.html'))
  .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

const previous = readPrevious(outFile);
const learnedEvidence = readLearnedEvidence(evidenceFile);
const rows = files.map((file) => makeRow(file, path.join(root, file), previous, learnedEvidence));
const counts = rows.reduce((acc, row) => {
  acc[row.status] = (acc[row.status] || 0) + 1;
  return acc;
}, {});

const now = new Date().toISOString();
const lines = [];
lines.push('# 公众号 SVG 已学习资产表');
lines.push('');
lines.push(`更新时间：${now}`);
lines.push(`扫描目录：\`${root}\``);
lines.push(`总数：${rows.length}；已学习：${counts['已学习'] || 0}；新增：${counts['新增'] || 0}；已变更：${counts['已变更'] || 0}`);
lines.push('');
lines.push('用途：记录已经纳入学习的 `source/*.html` 案例。后续新增或修改案例时，先运行本表更新脚本，通过内容指纹和证据表收录情况识别新增/变更，再更新证据表、索引和规范。');
lines.push('');
lines.push('更新命令：');
lines.push('');
lines.push('```bash');
lines.push('node .codex/skills/wechat-svg-authoring/scripts/update-learned-assets.js source');
lines.push('```');
lines.push('');
lines.push('| 文件 | 状态 | 大小 | 指纹 | 模式标签 | viewBox 摘要 | 触发摘要 | 动画属性摘要 | mtime |');
lines.push('| --- | --- | ---: | --- | --- | --- | --- | --- | --- |');
for (const row of rows) {
  lines.push(`| \`${esc(row.file)}\` | ${row.status} | ${row.bytes} | \`${row.shortHash}\` | ${esc(row.patterns.join('、') || '-')} | ${esc(row.viewboxes.join('<br>') || '-')} | ${esc(row.begins.join('<br>') || '-')} | ${esc(row.attrs.join('<br>') || '-')} | ${row.mtime} |`);
}
lines.push('');

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, lines.join('\n'), 'utf8');

console.log(`updated ${outFile}`);
console.log(`total=${rows.length} learned=${counts['已学习'] || 0} new=${counts['新增'] || 0} changed=${counts['已变更'] || 0}`);
