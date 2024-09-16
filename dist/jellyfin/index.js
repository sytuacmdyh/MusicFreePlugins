"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const pageSize = 20;
const cachedData = {};
function getClient() {
    var _a, _b;
    const { url, apiKey, mediaId } = (_b = (_a = env === null || env === void 0 ? void 0 : env.getUserVariables) === null || _a === void 0 ? void 0 : _a.call(env)) !== null && _b !== void 0 ? _b : {};
    if (!(url && apiKey)) {
        return null;
    }
    cachedData.url = url;
    cachedData.apiKey = apiKey;
    cachedData.mediaId = mediaId;
    return cachedData;
}
function formatMusicItem(it) {
    var _a, _b, _c;
    const url = (_a = getClient()) === null || _a === void 0 ? void 0 : _a.url;
    return {
        id: it.Id,
        title: it.Name,
        artist: (_b = it.Artists) === null || _b === void 0 ? void 0 : _b[0],
        album: it.Album,
        artwork: ((_c = it === null || it === void 0 ? void 0 : it.ImageTags) === null || _c === void 0 ? void 0 : _c.Primary)
            ? `${url}/Items/${it.Id}/Images/Primary?fillHeight=361&fillWidth=361&quality=96&tag=${it.ImageTags.Primary}`
            : null,
    };
}
async function searchMusic(query, page) {
    var _a, _b;
    const client = getClient();
    if (!client) {
        return { isEnd: true, data: [] };
    }
    const { url, apiKey, mediaId } = client;
    const result = (await axios_1.default.get(`${url}/Items`, {
        params: {
            ApiKey: apiKey,
            IncludeItemTypes: "Audio",
            Recursive: true,
            StartIndex: (page - 1) * pageSize,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary",
            Limit: pageSize,
            ParentId: mediaId || null,
            searchTerm: query || null,
        },
    })).data;
    return {
        isEnd: (result === null || result === void 0 ? void 0 : result.TotalRecordCount) <= page * pageSize,
        data: (_b = (_a = result === null || result === void 0 ? void 0 : result.Items) === null || _a === void 0 ? void 0 : _a.map) === null || _b === void 0 ? void 0 : _b.call(_a, formatMusicItem),
    };
}
async function getTopLists() {
    getClient();
    const data = {
        title: "全部歌曲",
        data: [
            {
                title: "全部",
                id: "ALL",
            },
        ],
    };
    return [data];
}
async function getTopListDetail(topListItem) {
    var _a;
    return {
        musicList: (_a = (await searchMusic(null, 1))) === null || _a === void 0 ? void 0 : _a.data,
    };
}
module.exports = {
  platform: "Jellyfin",
  version: "0.0.1",
  author: "yzccz",
  srcUrl: "https://github.com/sytuacmdyh/MusicFreePlugins/raw/master/dist/jellyfin/index.js",
  userVariables: [
    {
      key: "url",
      name: "服务器地址(http://host:port)",
    },
    {
      key: "apiKey",
      name: "token(在Jellyfin管理后台创建)",
      type: "password",
    },
    {
      key: "mediaId",
      name: "音乐媒体ID(非必填)",
    },
  ],
  cacheControl: "no-cache",
  supportedSearchType: ["music"],
  getTopLists,
  getTopListDetail,
  async search(query, page, type) {
    if (type === "music") {
      return await searchMusic(query, page);
    }
  },
  async getMediaSource(musicItem, quality) {
    const client = getClient();
    return {
      url:
        quality == "super"
          ? `${client === null || client === void 0 ? void 0 : client.url}/Audio/${musicItem.id}/stream?ApiKey=${
              client === null || client === void 0 ? void 0 : client.apiKey
            }&static=true`
          : `${client === null || client === void 0 ? void 0 : client.url}/Audio/${musicItem.id}/stream.mp3?ApiKey=${
              client === null || client === void 0 ? void 0 : client.apiKey
            }`,
    };
  },
};
