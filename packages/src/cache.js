const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_FILE_NAME = '.wechat-cdn-cache.json';

class UploadCache {
  constructor(cacheDir) {
    this.cachePath = path.join(cacheDir, CACHE_FILE_NAME);
    this.data = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.cachePath)) {
        return JSON.parse(fs.readFileSync(this.cachePath, 'utf-8'));
      }
    } catch {
      // 缓存文件损坏，忽略
    }
    return {};
  }

  _save() {
    fs.writeFileSync(this.cachePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  // 用文件内容 hash 作为 key
  static fileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  }

  // 生成缓存 key（包含素材类型）
  static getCacheKey(filePath, permanent = true) {
    const fileHash = UploadCache.fileHash(filePath);
    return `${permanent ? 'perm_' : 'temp_'}${fileHash}`;
  }

  // 查询缓存：文件 hash 是否已上传过
  get(filePath, permanent = true) {
    const key = UploadCache.getCacheKey(filePath, permanent);
    return this.data[key] || null;
  }

  // 写入缓存
  set(filePath, cdnUrl, mediaId, { save = true, permanent = true } = {}) {
    const key = UploadCache.getCacheKey(filePath, permanent);
    this.data[key] = { url: cdnUrl, mediaId, file: path.basename(filePath), time: Date.now(), permanent };
    if (save) this._save();
  }

  setMany(entries) {
    for (const { filePath, cdnUrl, mediaId, permanent = true } of entries) {
      this.set(filePath, cdnUrl, mediaId, { save: false, permanent });
    }
    this._save();
  }

  // 获取所有缓存条目
  getAll() {
    return Object.values(this.data);
  }

  // 统计缓存数量
  get size() {
    return Object.keys(this.data).length;
  }
}

module.exports = UploadCache;
