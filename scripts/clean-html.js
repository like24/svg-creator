const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../source');
const outputDir = path.join(__dirname, '../cleaned');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function cleanAttributes(html) {
  let cleaned = html;
  
  cleaned = cleaned.replace(/\s+powered-by="[^"]*"/g, '');
  cleaned = cleaned.replace(/\s+powered-by='[^']*'/g, '');
  
  cleaned = cleaned.replace(/\s+author:\s*[^;]+;/g, '');
  cleaned = cleaned.replace(/\s+wechat:\s*[^;]+;/g, '');
  
  cleaned = cleaned.replace(/\s+miner1688/g, '');
  
  return cleaned;
}

function formatHtml(html) {
  let formatted = html;
  
  formatted = formatted.replace(/></g, '>\n<');
  
  formatted = formatted.replace(/\n\s*\n/g, '\n');
  
  formatted = formatted.replace(/^\s+|\s+$/gm, '');
  
  const lines = formatted.split('\n');
  let indentLevel = 0;
  const indented = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    if (line.startsWith('</')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    if (line.startsWith('<?') || line.startsWith('<!')) {
      indented.push(line);
    } else {
      indented.push('  '.repeat(indentLevel) + line);
    }
    
    if (line.startsWith('<') && !line.startsWith('</') && !line.endsWith('/>')) {
      if (!line.startsWith('</')) {
        indentLevel++;
      }
    }
  }
  
  return indented.join('\n');
}

function processFile(filePath) {
  try {
    const html = fs.readFileSync(filePath, 'utf-8');
    
    const cleaned = cleanAttributes(html);
    const formatted = formatHtml(cleaned);
    
    const fileName = path.basename(filePath);
    const outputPath = path.join(outputDir, fileName);
    
    fs.writeFileSync(outputPath, formatted, 'utf-8');
    
    console.log(`✓ 处理完成: ${fileName}`);
    return true;
  } catch (error) {
    console.error(`✗ 处理失败: ${filePath}`, error.message);
    return false;
  }
}

const htmlFiles = fs.readdirSync(sourceDir).filter(file => file.endsWith('.html'));

console.log(`\n开始处理 ${htmlFiles.length} 个文件...\n`);

let successCount = 0;
let failCount = 0;

htmlFiles.forEach(file => {
  const filePath = path.join(sourceDir, file);
  const result = processFile(filePath);
  if (result) successCount++;
  else failCount++;
});

console.log(`\n处理完成！成功: ${successCount}, 失败: ${failCount}`);
console.log(`输出目录: ${outputDir}\n`);