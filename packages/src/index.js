const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const TokenManager = require('./token-manager');
const { scanFile, resolveImagePath } = require('./scanner');
const Uploader = require('./uploader');
const { replacePaths } = require('./replacer');
const UploadCache = require('./cache');

function renderProgress(current, total, width = 20) {
  const pct = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(width - filled));
  return `[${bar}] ${pct}%`;
}

async function run(files, options = {}) {
  const {
    appId,
    appSecret,
    permanent = true,
    outputDir,
    suffix = '-cdn',
    dryRun = false,
    verbose = false,
    noCache = false,
    noOpen = false,
  } = options;

  // 验证凭证
  if (!dryRun && (!appId || !appSecret)) {
    console.error(chalk.red('缺少 AppID 或 AppSecret'));
    console.error('请在 .env 文件中设置 WECHAT_APP_ID 和 WECHAT_APP_SECRET');
    console.error('或通过 --appid / --secret 参数传入');
    process.exit(1);
  }

  const log = {
    info: (msg) => verbose && console.log(chalk.gray(msg)),
    success: (msg) => console.log(chalk.green(msg)),
    warn: (msg) => console.log(chalk.yellow(msg)),
    error: (msg) => console.error(chalk.red(msg)),
  };

  // 收集所有图片引用，跨文件去重
  const allImagePaths = new Set();    // 绝对路径集合
  const pathToLocal = new Map();      // 绝对路径 -> 原始相对路径
  const fileRefs = new Map();         // 文件路径 -> refs[]

  for (const file of files) {
    const absFile = path.resolve(file);
    if (!fs.existsSync(absFile)) {
      log.warn(`文件不存在，跳过: ${file}`);
      continue;
    }

    const content = fs.readFileSync(absFile, 'utf-8');
    const refs = scanFile(content);

    if (refs.length === 0) {
      log.info(`未找到本地图片引用: ${file}`);
      fileRefs.set(absFile, []);
      continue;
    }

    log.info(`${file} 中找到 ${refs.length} 个本地图片引用`);
    fileRefs.set(absFile, refs);

    for (const ref of refs) {
      const absImagePath = resolveImagePath(absFile, ref.localPath);
      allImagePaths.add(absImagePath);
      pathToLocal.set(absImagePath, ref.localPath);
    }
  }

  if (allImagePaths.size === 0) {
    console.log('所有文件中均未找到本地图片引用');
    return;
  }

  console.log(`共找到 ${allImagePaths.size} 个唯一图片文件`);

  // dry-run 模式（不需要验证图片存在）
  if (dryRun) {
    console.log(chalk.cyan('\n--- Dry Run 模式 ---'));
    for (const [file, refs] of fileRefs) {
      console.log(chalk.bold(`\n${file}:`));
      if (refs.length === 0) {
        console.log('  (无本地图片引用)');
        continue;
      }
      for (const ref of refs) {
        const absPath = resolveImagePath(file, ref.localPath);
        const exists = fs.existsSync(absPath);
        const status = exists ? chalk.green('✓') : chalk.red('✗');
        console.log(`  ${status} [${ref.context}] ${ref.localPath}`);
        console.log(`    -> ${absPath}`);
      }
    }
    return;
  }

  // 验证图片文件存在
  const missingImages = [];
  for (const absPath of allImagePaths) {
    if (!fs.existsSync(absPath)) {
      missingImages.push(absPath);
    }
  }
  if (missingImages.length > 0) {
    log.error('以下图片文件不存在:');
    missingImages.forEach((p) => log.error(`  ${p}`));
    process.exit(1);
  }

  // 上传图片（并发 + 缓存）
  const tokenManager = new TokenManager(appId, appSecret);
  const uploader = new Uploader(tokenManager, { permanent });
  const cache = new UploadCache(process.cwd());

  const imageArray = Array.from(allImagePaths);

  // 检查缓存，分离已缓存和待上传
  const cachedResults = new Map();
  const toUpload = [];
  for (const absPath of imageArray) {
    if (!noCache) {
      const cached = cache.get(absPath);
      if (cached) {
        cachedResults.set(absPath, cached);
        continue;
      }
    }
    toUpload.push(absPath);
  }

  const cachedCount = cachedResults.size;
  const total = toUpload.length;

  if (cachedCount > 0) {
    console.log(chalk.cyan(`缓存命中: ${cachedCount} 个图片已跳过`));
  }
  if (noCache) {
    console.log(chalk.yellow('已跳过缓存，强制重新上传'));
  }

  let uploadResults = new Map();
  let uploadErrors = [];

  if (total > 0) {
    const spinner = ora(`正在上传 0/${total}...`).start();

    const result = await uploader.uploadImages(toUpload, {
      concurrency: 3,
      onProgress({ completed, failed, total, current, success }) {
        const bar = renderProgress(completed + failed, total);
        if (success) {
          spinner.text = `${bar} ${completed}/${total} 成功 ${chalk.gray(current)}`;
        } else {
          spinner.text = `${bar} ${completed}/${total} 失败 ${chalk.red(current)}`;
        }
      },
    });

    uploadResults = result.results;
    uploadErrors = result.errors;

    if (uploadErrors.length > 0) {
      spinner.warn(`上传完成: ${uploadResults.size} 成功, ${uploadErrors.length} 失败`);
    } else {
      spinner.succeed(`全部上传成功: ${uploadResults.size} 个图片`);
    }

    // 写入缓存
    for (const [absPath, result] of uploadResults) {
      cache.set(absPath, result.url, result.mediaId);
    }
  }

  // 合并缓存和新上传的结果
  const allResults = new Map([...cachedResults, ...uploadResults]);

  // 构建替换映射: localPath -> cdnUrl
  const pathMap = new Map();
  for (const [absPath, result] of allResults) {
    const localPath = pathToLocal.get(absPath);
    pathMap.set(localPath, result.url);
  }

  // 替换并生成新文件
  const outputFiles = [];
  let returnContentResult = null;

  for (const [absFile, refs] of fileRefs) {
    if (refs.length === 0) continue;

    const content = fs.readFileSync(absFile, 'utf-8');
    const newContent = replacePaths(content, pathMap);

    // returnContent 模式：只返回内容，不写文件
    if (options.returnContent) {
      returnContentResult = { content: newContent };
      continue;
    }

    // 生成输出路径
    const dir = outputDir || path.dirname(absFile);
    const ext = path.extname(absFile);
    const base = path.basename(absFile, ext);
    const outputFile = path.join(dir, `${base}${suffix}${ext}`);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputFile, newContent, 'utf-8');
    outputFiles.push(outputFile);
    log.success(`已生成: ${outputFile}`);
  }

  // returnContent 模式直接返回
  if (options.returnContent) {
    return returnContentResult;
  }

  // 自动打开预览
  if (!noOpen && outputFiles.length > 0) {
    for (const f of outputFiles) {
      try {
        execSync(`open "${f}"`, { stdio: 'ignore' });
      } catch {
        // 忽略打开失败
      }
    }
  }

  // 汇总报告
  const totalImages = cachedCount + uploadResults.size + uploadErrors.length;
  console.log(chalk.cyan('\n========== 上传汇总 =========='));
  console.log(`总计: ${totalImages} 个图片`);
  if (cachedCount > 0) {
    const hitRate = Math.round((cachedCount / totalImages) * 100);
    console.log(chalk.green(`缓存命中: ${cachedCount} 个 (${hitRate}%)`));
  }
  console.log(`新上传: ${uploadResults.size} 个`);
  if (uploadErrors.length > 0) {
    console.log(chalk.red(`失败: ${uploadErrors.length} 个`));
    for (const err of uploadErrors) {
      console.log(chalk.red(`  ✗ ${path.basename(err.path)}: ${err.error}`));
    }
  }

  console.log(chalk.cyan('\n--- 图片链接 ---'));
  for (const [absPath, result] of allResults) {
    const localPath = pathToLocal.get(absPath);
    const fromCache = cachedResults.has(absPath) ? chalk.gray(' [缓存]') : '';
    console.log(`  ${localPath} -> ${chalk.blue(result.url)}${fromCache}`);
  }

  if (outputFiles.length > 0) {
    console.log(chalk.cyan('\n--- 生成文件 ---'));
    for (const f of outputFiles) {
      console.log(`  ${f}`);
    }
  }

  console.log(chalk.green('\n完成!'));
}

module.exports = { run };
