const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TOKEN_URL = 'https://api.weixin.qq.com/cgi-bin/token';
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 提前 5 分钟刷新
const TOKEN_CACHE_FILE_NAME = '.wechat-cdn-token.json';

class TokenManager {
  constructor(appId, appSecret, options = {}) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.cachePath = options.cachePath || path.join(options.cacheDir || process.cwd(), TOKEN_CACHE_FILE_NAME);
    this._token = null;
    this._expiresAt = 0;
    this._refreshPromise = null;
    this._loadCache();
  }

  async getToken() {
    if (this._token && Date.now() < this._expiresAt) {
      return this._token;
    }
    if (!this._refreshPromise) {
      this._refreshPromise = this._fetchToken().finally(() => {
        this._refreshPromise = null;
      });
    }
    return this._refreshPromise;
  }

  _loadCache() {
    try {
      if (!fs.existsSync(this.cachePath)) return;
      const data = JSON.parse(fs.readFileSync(this.cachePath, 'utf-8'));
      if (data.appId !== this.appId || !data.accessToken || !data.expiresAt) return;
      if (Date.now() >= data.expiresAt) return;
      this._token = data.accessToken;
      this._expiresAt = data.expiresAt;
    } catch {
      // token cache is best-effort only
    }
  }

  _saveCache() {
    try {
      const dir = path.dirname(this.cachePath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        this.cachePath,
        JSON.stringify(
          {
            appId: this.appId,
            accessToken: this._token,
            expiresAt: this._expiresAt,
            updated: Date.now(),
          },
          null,
          2
        ),
        { encoding: 'utf-8', mode: 0o600 }
      );
    } catch {
      // token cache is best-effort only
    }
  }

  _deleteCache() {
    try {
      if (fs.existsSync(this.cachePath)) {
        fs.unlinkSync(this.cachePath);
      }
    } catch {
      // token cache is best-effort only
    }
  }

  async _fetchToken() {
    const res = await axios.get(TOKEN_URL, {
      params: {
        grant_type: 'client_credential',
        appid: this.appId,
        secret: this.appSecret,
      },
    });

    const data = res.data;
    if (data.errcode) {
      throw new Error(`获取 access_token 失败: [${data.errcode}] ${data.errmsg}`);
    }

    this._token = data.access_token;
    this._expiresAt = Date.now() + (data.expires_in * 1000) - REFRESH_BUFFER_MS;
    this._saveCache();
    return this._token;
  }

  clearToken() {
    this._token = null;
    this._expiresAt = 0;
    this._deleteCache();
  }
}

module.exports = TokenManager;
