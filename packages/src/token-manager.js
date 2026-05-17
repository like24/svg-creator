const axios = require('axios');

const TOKEN_URL = 'https://api.weixin.qq.com/cgi-bin/token';
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 提前 5 分钟刷新

class TokenManager {
  constructor(appId, appSecret) {
    this.appId = appId;
    this.appSecret = appSecret;
    this._token = null;
    this._expiresAt = 0;
  }

  async getToken() {
    if (this._token && Date.now() < this._expiresAt) {
      return this._token;
    }
    return this._fetchToken();
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
    return this._token;
  }

  clearToken() {
    this._token = null;
    this._expiresAt = 0;
  }
}

module.exports = TokenManager;
