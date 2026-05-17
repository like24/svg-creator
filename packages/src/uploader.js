const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const PERMANENT_URL = 'https://api.weixin.qq.com/cgi-bin/material/add_material';
const TEMPORARY_URL = 'https://api.weixin.qq.com/cgi-bin/media/upload';

const MAX_SIZE_PERMANENT = 10 * 1024 * 1024;  // 10MB
const MAX_SIZE_TEMPORARY = 2 * 1024 * 1024;   // 2MB

const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

class Uploader {
  constructor(tokenManager, options = {}) {
    this.tokenManager = tokenManager;
    this.permanent = options.permanent !== false; // 默认永久素材
    this.maxSize = this.permanent ? MAX_SIZE_PERMANENT : MAX_SIZE_TEMPORARY;
    this.uploadUrl = this.permanent ? PERMANENT_URL : TEMPORARY_URL;
  }

  async uploadImage(filePath) {
    const absPath = path.resolve(filePath);
    const ext = path.extname(absPath).toLowerCase();

    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      throw new Error(`不支持的图片格式: ${ext} (${absPath})`);
    }

    const stat = fs.statSync(absPath);
    if (stat.size > this.maxSize) {
      const maxMB = this.maxSize / 1024 / 1024;
      const fileMB = (stat.size / 1024 / 1024).toFixed(1);
      throw new Error(`文件超过大小限制: ${fileMB}MB > ${maxMB}MB (${absPath})`);
    }

    const token = await this.tokenManager.getToken();
    const form = new FormData();
    form.append('media', fs.createReadStream(absPath));

    const res = await axios.post(
      `${this.uploadUrl}?access_token=${token}&type=image`,
      form,
      { headers: form.getHeaders() }
    );

    const data = res.data;
    if (data.errcode) {
      // token 过期，清除缓存后抛出让调用方重试
      if (data.errcode === 40001 || data.errcode === 42001) {
        this.tokenManager.clearToken();
      }
      throw new Error(`上传失败: [${data.errcode}] ${data.errmsg} (${absPath})`);
    }

    // WeChat API 返回的 URL 默认是 http://，转为 https://
    const url = data.url.replace(/^http:\/\//, 'https://');
    return { url, mediaId: data.media_id };
  }

  async uploadImages(filePaths, { concurrency = 3, onProgress } = {}) {
    const results = new Map();
    const errors = [];
    const uniquePaths = [...new Set(filePaths.map((p) => path.resolve(p)))];
    const total = uniquePaths.length;
    let completed = 0;
    let failed = 0;

    const uploadOne = async (absPath) => {
      let lastErr;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await this.uploadImage(absPath);
          results.set(absPath, result);
          completed++;
          if (onProgress) onProgress({ completed, failed, total, current: path.basename(absPath), success: true });
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          if (err.message.includes('[40001]') || err.message.includes('[42001]')) {
            continue;
          }
          break;
        }
      }

      if (lastErr) {
        failed++;
        errors.push({ path: absPath, error: lastErr.message });
        if (onProgress) onProgress({ completed, failed, total, current: path.basename(absPath), success: false, error: lastErr.message });
      }
    };

    // 并发上传，限制并发数
    const queue = [...uniquePaths];
    const workers = [];
    for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
      workers.push((async () => {
        while (queue.length > 0) {
          const absPath = queue.shift();
          await uploadOne(absPath);
        }
      })());
    }

    await Promise.all(workers);
    return { results, errors };
  }
}

module.exports = Uploader;
