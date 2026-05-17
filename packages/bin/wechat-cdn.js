#!/usr/bin/env node

const { Command } = require('commander');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { run } = require('../src/index');
const TokenManager = require('../src/token-manager');
const WechatAPI = require('../src/wechat-api');
const UploadCache = require('../src/cache');

dotenv.config();

const STATE_FILE = '.wechat-cdn-state.json';

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function askMaterialType() {
  console.log('\n选择素材类型:');
  console.log('  1) 永久素材（默认，链接永久有效）');
  console.log('  2) 临时素材（3天后失效）');
  const answer = await ask('\n请输入选项 (1/2): ');
  return answer !== '2';
}

function getCredentials(opts) {
  const appId = opts.appid || process.env.WECHAT_APP_ID;
  const appSecret = opts.secret || process.env.WECHAT_APP_SECRET;
  if (!appId || !appSecret) {
    console.error('缺少 AppID 或 AppSecret，请配置 .env 或传入 --appid / --secret');
    process.exit(1);
  }
  return { appId, appSecret };
}

function createAPI(opts) {
  const { appId, appSecret } = getCredentials(opts);
  const tokenManager = new TokenManager(appId, appSecret);
  return new WechatAPI(tokenManager);
}

// 读取/保存当前草稿状态
function loadState() {
  const statePath = path.join(process.cwd(), STATE_FILE);
  try {
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    }
  } catch { /* ignore */ }
  return {};
}

function saveState(data) {
  const statePath = path.join(process.cwd(), STATE_FILE);
  const state = { ...loadState(), ...data, updated: Date.now() };
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

function addCommonOptions(cmd) {
  return cmd
    .option('--appid <id>', '微信 AppID（覆盖 .env 配置）')
    .option('--secret <secret>', '微信 AppSecret（覆盖 .env 配置）')
    .option('-v, --verbose', '详细输出');
}

// 上传图片并返回替换后的内容和第一个图片的 media_id（用作封面）
async function uploadAndReplace(file, opts) {
  const { appId, appSecret } = getCredentials(opts);
  const permanent = await askMaterialType();

  const result = await run([file], {
    appId,
    appSecret,
    permanent,
    verbose: opts.verbose,
    noCache: opts.cache === false,
    noOpen: true,
    returnContent: true,
  });

  const absFile = path.resolve(file);
  let content = fs.readFileSync(absFile, 'utf-8');
  if (result && result.content) {
    content = result.content;
  }

  // 模板插入
  if (opts.template) {
    const tplPath = path.resolve(opts.template);
    if (!fs.existsSync(tplPath)) {
      console.error(`模板文件不存在: ${opts.template}`);
      process.exit(1);
    }
    let template = fs.readFileSync(tplPath, 'utf-8');
    content = template.replace('{{content}}', content);
  }

  // 从缓存中取第一个图片的 media_id 作为默认封面
  const cache = new UploadCache(process.cwd());
  const cached = cache.getAll();
  const firstMediaId = cached.length > 0 ? cached[0].mediaId : null;

  return { content, thumbMediaId: firstMediaId };
}

// 创建或更新草稿
async function createOrUpdateDraft(api, { file, content, title, author, digest, thumb, mediaId }) {
  const absFile = path.resolve(file);
  const draftTitle = title || path.basename(absFile, path.extname(absFile));

  if (mediaId) {
    try {
      await api.updateDraft(mediaId, {
        title: draftTitle,
        content,
        author,
        digest,
        thumbMediaId: thumb,
      });
      return { mediaId, title: draftTitle, isNew: false };
    } catch (err) {
      console.log(`  旧草稿已失效，创建新草稿...`);
    }
  }

  const res = await api.createDraft({
    title: draftTitle,
    content,
    author,
    digest,
    thumbMediaId: thumb,
  });
  return { mediaId: res.media_id, title: draftTitle, isNew: true };
}

const program = new Command();

program
  .name('wechat-svg-cdn')
  .description('微信公众号 SVG 图片上传与文章管理工具')
  .version('1.0.0');

// ========== 默认命令：上传图片 ==========
program
  .argument('[files...]', 'HTML 文件路径（支持多个文件）')
  .option('-o, --output <dir>', '输出目录（默认与输入文件同目录）')
  .option('--suffix <suffix>', '输出文件后缀', '-cdn')
  .option('--dry-run', '预览替换内容，不实际上传')
  .option('--no-cache', '跳过缓存，强制重新上传所有图片')
  .option('--clean-cache', '清理缓存文件')
  .option('--no-open', '不自动打开生成的文件')
  .option('--appid <id>', '微信 AppID（覆盖 .env 配置）')
  .option('--secret <secret>', '微信 AppSecret（覆盖 .env 配置）')
  .option('-v, --verbose', '详细输出')
  .action(async (files, opts) => {
    if (opts.cleanCache) {
      const cachePath = path.join(process.cwd(), '.wechat-cdn-cache.json');
      if (fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath);
        console.log('缓存已清理');
      } else {
        console.log('没有缓存文件');
      }
      return;
    }

    if (!files || files.length === 0) {
      program.help();
      return;
    }

    const { appId, appSecret } = getCredentials(opts);
    const permanent = opts.dryRun ? true : await askMaterialType();

    await run(files, {
      appId,
      appSecret,
      permanent,
      outputDir: opts.output ? path.resolve(opts.output) : undefined,
      suffix: opts.suffix,
      dryRun: opts.dryRun,
      verbose: opts.verbose,
      noCache: opts.cache === false,
      noOpen: opts.open === false,
    });
  });

// ========== draft：上传图片 + 创建草稿 ==========
const draftCmd = program
  .command('draft')
  .description('上传图片并创建草稿');

addCommonOptions(draftCmd)
  .argument('<file>', 'HTML 文件路径')
  .option('-t, --title <title>', '文章标题')
  .option('-a, --author <author>', '作者名称')
  .option('-d, --digest <digest>', '文章摘要')
  .option('--thumb <mediaId>', '封面图素材 ID')
  .option('--template <file>', '模板文件，用 {{content}} 标记插入位置')
  .option('--no-cache', '跳过缓存')
  .option('--media-id <id>', '更新已有草稿（传入 media_id）')
  .action(async (file, opts) => {
    const api = createAPI(opts);
    const state = loadState();

    // 1. 上传图片，获取替换后的内容
    console.log('步骤 1/2: 上传图片...');
    const { content, thumbMediaId } = await uploadAndReplace(file, opts);

    // 2. 创建/更新草稿
    console.log('步骤 2/2: 创建草稿...');
    const mediaId = opts.mediaId || state.mediaId;
    try {
      const result = await createOrUpdateDraft(api, {
        file,
        content,
        title: opts.title,
        author: opts.author,
        digest: opts.digest,
        thumb: opts.thumb || thumbMediaId,
        mediaId,
      });

      saveState({ mediaId: result.mediaId, file: path.resolve(file) });

      if (result.isNew) {
        console.log(`  草稿已创建: ${result.mediaId}`);
      } else {
        console.log(`  草稿已更新: ${result.mediaId}`);
      }
      console.log(`\n草稿已就绪，可前往公众号后台预览和发布`);
    } catch (err) {
      console.error(`操作失败: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
