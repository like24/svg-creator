#!/usr/bin/env node

const { Command } = require('commander');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { run } = require('../src/index');
const TokenManager = require('../src/token-manager');
const WechatAPI = require('../src/wechat-api');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const STATE_FILE = path.join(__dirname, '..', '.wechat-cdn-state.json');

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

async function resolveMaterialType(opts, { allowTemporary = true } = {}) {
  const rootOpts = program.opts();
  const permanentOpt = Boolean(opts.permanent || rootOpts.permanent);
  const temporaryOpt = Boolean(opts.temporary || rootOpts.temporary);

  if (permanentOpt && temporaryOpt) {
    console.error('不能同时指定 --permanent 和 --temporary');
    process.exit(1);
  }
  if (temporaryOpt) {
    if (!allowTemporary) {
      console.error('当前命令需要可替换进 HTML 的图片 URL，请使用 --permanent');
      process.exit(1);
    }
    return false;
  }
  if (permanentOpt) {
    return true;
  }
  const permanent = await askMaterialType();
  if (!permanent && !allowTemporary) {
    console.error('当前命令需要可替换进 HTML 的图片 URL，请使用永久素材模式');
    process.exit(1);
  }
  return permanent;
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
  const tokenManager = new TokenManager(appId, appSecret, { cacheDir: path.join(__dirname, '..') });
  return new WechatAPI(tokenManager);
}

// 读取/保存当前草稿状态（按目录区分）
function loadState() {
  const statePath = STATE_FILE;
  try {
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    }
  } catch { /* ignore */ }
  return { dirs: {} };
}

function saveState(dir, data) {
  const statePath = STATE_FILE;
  const state = loadState();
  if (!state.dirs) state.dirs = {};
  state.dirs[dir] = { ...state.dirs[dir], ...data, updated: Date.now() };
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

function getStateByDir(dir) {
  const state = loadState();
  return state.dirs && state.dirs[dir] ? state.dirs[dir] : {};
}

function addCommonOptions(cmd) {
  return cmd
    .option('--appid <id>', '微信 AppID（覆盖 .env 配置）')
    .option('--secret <secret>', '微信 AppSecret（覆盖 .env 配置）')
    .option('--permanent', '使用永久素材，跳过交互选择')
    .option('--temporary', '使用临时素材，跳过交互选择')
    .option('-v, --verbose', '详细输出');
}

// 上传图片并返回替换后的内容和第一个图片的 media_id（用作封面）
async function uploadAndReplace(file, opts, permanent) {
  const { appId, appSecret } = getCredentials(opts);

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

  // 给所有 section 标签添加 powered-by 属性
  content = content.replace(/<section/g, '<section powered-by="Wechat:YLYINLU"');

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

  return { content, thumbMediaId: result ? result.thumbMediaId : null };
}

// 从 HTML 文件中提取 title 标签内容
function extractTitle(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/<title[^>]*>([^<]*)<\/title>/i);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

// 创建或更新草稿
async function createOrUpdateDraft(api, { file, content, title, author, digest, thumb, mediaId }) {
  const absFile = path.resolve(file);
  const draftTitle = title || extractTitle(absFile) || path.basename(absFile, path.extname(absFile));

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
  .name('wechat-svg')
  .description('微信公众号 SVG 图片上传与文章管理工具')
  .version('1.0.0');

// ========== upload：只上传图片（保留原功能）==========
const uploadCmd = program
  .command('upload')
  .description('上传图片并替换路径（只上传，不创建草稿）');

uploadCmd
  .argument('[files...]', 'HTML 文件路径（支持多个文件）')
  .option('-o, --output <dir>', '输出目录（默认与输入文件同目录）')
  .option('--suffix <suffix>', '输出文件后缀', '-cdn')
  .option('--dry-run', '预览替换内容，不实际上传')
  .option('--no-cache', '跳过缓存，强制重新上传所有图片')
  .option('--clean-cache', '清理缓存文件')
  .option('--no-open', '不自动打开生成的文件')
  .option('--appid <id>', '微信 AppID（覆盖 .env 配置）')
  .option('--secret <secret>', '微信 AppSecret（覆盖 .env 配置）')
  .option('--permanent', '使用永久素材，跳过交互选择')
  .option('--temporary', '使用临时素材，跳过交互选择')
  .option('-v, --verbose', '详细输出')
  .action(async (files, opts) => {
    if (opts.cleanCache) {
      const cachePath = path.join(__dirname, '..', '.wechat-cdn-cache.json');
      if (fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath);
        console.log('缓存已清理');
      } else {
        console.log('没有缓存文件');
      }
      return;
    }

    if (!files || files.length === 0) {
      uploadCmd.help();
      return;
    }

    const permanent = opts.dryRun ? true : await resolveMaterialType(opts, { allowTemporary: false });
    const { appId, appSecret } = opts.dryRun ? { appId: null, appSecret: null } : getCredentials(opts);

    try {
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
    } catch (err) {
      console.error(`操作失败: ${err.message}`);
      if (err.uploadErrors) {
        for (const item of err.uploadErrors) {
          console.error(`  ${path.basename(item.path)}: ${item.error}`);
        }
      }
      process.exit(1);
    }
  });

// ========== 默认命令：上传图片 + 创建草稿 ==========
addCommonOptions(program)
  .argument('<file>', 'HTML 文件路径')
  .option('-t, --title <title>', '文章标题')
  .option('-a, --author <author>', '作者名称')
  .option('-d, --digest <digest>', '文章摘要')
  .option('--thumb <mediaId>', '封面图素材 ID')
  .option('--template <file>', '模板文件，用 {{content}} 标记插入位置')
  .option('--no-cache', '跳过缓存')
  .option('--media-id <id>', '更新已有草稿（传入 media_id）')
  .action(async (file, opts) => {
    try {
      const absFile = path.resolve(file);
      const fileDir = path.dirname(absFile);  // 获取文件所在目录
      const state = getStateByDir(fileDir);    // 读取该目录的状态
      const permanent = await resolveMaterialType(opts, { allowTemporary: false });

      // 1. 上传图片，获取替换后的内容
      console.log('步骤 1/2: 上传图片...');
      const { content, thumbMediaId } = await uploadAndReplace(file, opts, permanent);

      // 2. 创建/更新草稿
      console.log('步骤 2/2: 创建草稿...');
      const api = createAPI(opts);
      const mediaId = opts.mediaId || state.mediaId;  // 使用该目录的 mediaId
      const result = await createOrUpdateDraft(api, {
        file,
        content,
        title: opts.title,
        author: opts.author || '尹璐',
        digest: opts.digest,
        thumb: opts.thumb || thumbMediaId,
        mediaId,
      });

      // 3. 生成草稿内容的 txt 文件（压缩成一行），文件名使用最终标题
      const safeTitle = result.title.replace(/[\\/:*?"<>|]/g, '').trim() || 'draft';
      const txtFile = path.join(fileDir, `${safeTitle}.txt`);
      // 只提取 body 标签内的内容
      const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const bodyContent = bodyMatch ? bodyMatch[1] : content;
      const compressedContent = bodyContent.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
      fs.writeFileSync(txtFile, compressedContent, 'utf-8');
      console.log(`草稿内容已生成: ${txtFile}`);

      saveState(fileDir, { mediaId: result.mediaId, file: absFile });  // 保存到该目录

      if (result.isNew) {
        console.log(`  草稿已创建: ${result.mediaId}`);
      } else {
        console.log(`  草稿已更新: ${result.mediaId}`);
      }
      console.log(`\n草稿已就绪，可前往公众号后台预览和发布`);
    } catch (err) {
      console.error(`操作失败: ${err.message}`);
      if (err.uploadErrors) {
        for (const item of err.uploadErrors) {
          console.error(`  ${path.basename(item.path)}: ${item.error}`);
        }
      }
      process.exit(1);
    }
  });

program.parse();
