const axios = require('axios');

const BASE_URL = 'https://api.weixin.qq.com/cgi-bin';

class WechatAPI {
  constructor(tokenManager) {
    this.tokenManager = tokenManager;
  }

  async _post(endpoint, data) {
    const token = await this.tokenManager.getToken();
    const res = await axios.post(`${BASE_URL}/${endpoint}?access_token=${token}`, data);
    const result = res.data;
    if (result.errcode && result.errcode !== 0) {
      if (result.errcode === 40001 || result.errcode === 42001) {
        this.tokenManager.clearToken();
      }
      throw new Error(`[${result.errcode}] ${result.errmsg}`);
    }
    return result;
  }

  // 创建草稿
  async createDraft({ title, content, author, digest, thumbMediaId }) {
    const article = {
      title,
      content,
      author: author || '',
      digest: digest || '',
      need_open_comment: 0,
      only_fans_can_comment: 0,
    };
    if (thumbMediaId) {
      article.thumb_media_id = thumbMediaId;
    }
    return this._post('draft/add', { articles: [article] });
  }

  // 更新草稿
  async updateDraft(mediaId, { title, content, author, digest, thumbMediaId, index = 0 }) {
    const article = {};
    if (title) article.title = title;
    if (content) article.content = content;
    if (author) article.author = author;
    if (digest) article.digest = digest;
    if (thumbMediaId) article.thumb_media_id = thumbMediaId;

    return this._post('draft/update', {
      media_id: mediaId,
      index,
      articles: article,
    });
  }

  // 获取草稿
  async getDraft(mediaId) {
    return this._post('draft/get', { media_id: mediaId });
  }

  // 删除草稿
  async deleteDraft(mediaId) {
    return this._post('draft/delete', { media_id: mediaId });
  }
}

module.exports = WechatAPI;
