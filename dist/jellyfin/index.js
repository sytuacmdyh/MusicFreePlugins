"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
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
    var _a, _b, _c, _d, _e, _f;
    const url = (_a = getClient()) === null || _a === void 0 ? void 0 : _a.url;
    return {
        id: it.Id,
        title: it.Name,
        artist: (_b = it.Artists) === null || _b === void 0 ? void 0 : _b[0],
        album: it.Album,
        artwork: ((_c = it === null || it === void 0 ? void 0 : it.ImageTags) === null || _c === void 0 ? void 0 : _c.Primary)
            ? `${url}/Items/${it.Id}/Images/Primary?fillHeight=361&fillWidth=361&quality=96&tag=${it.ImageTags.Primary}`
            : null,
        duration: it.RunTimeTicks / 10000000,
        custom: {
            type: ((_f = (_e = (_d = it.MediaStreams) === null || _d === void 0 ? void 0 : _d.filter((t) => t.Type === "Audio")) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.Codec) || "mp3",
        },
    };
}
async function searchMusic(query, page, size = 100) {
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
            StartIndex: (page - 1) * size,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary",
            Limit: size,
            ParentId: mediaId || null,
            searchTerm: query || null,
            Fields: "MediaStreams",
            SortBy: "Random",
        },
    })).data;
    return {
        isEnd: (result === null || result === void 0 ? void 0 : result.TotalRecordCount) <= page * size,
        data: (_b = (_a = result === null || result === void 0 ? void 0 : result.Items) === null || _a === void 0 ? void 0 : _a.map) === null || _b === void 0 ? void 0 : _b.call(_a, formatMusicItem),
    };
}
async function getTopLists() {
    getClient();
    const data = {
        title: "分页",
        data: [
            {
                title: "全部",
                id: "ALL",
            },
        ],
    };
    return [data];
}
async function getTopListDetail(topListItem, page) {
    const searchResult = await searchMusic(null, page);
    return {
        isEnd: true,
        musicList: searchResult === null || searchResult === void 0 ? void 0 : searchResult.data,
    };
}
module.exports = {
    platform: "Jellyfin",
    version: "0.0.3",
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
        var _a;
        const client = getClient();
        return {
            url: quality == "super"
                ? `${client === null || client === void 0 ? void 0 : client.url}/Audio/${musicItem.id}/stream.${(_a = musicItem.custom) === null || _a === void 0 ? void 0 : _a.type}?ApiKey=${client === null || client === void 0 ? void 0 : client.apiKey}&static=true`
                : `${client === null || client === void 0 ? void 0 : client.url}/Audio/${musicItem.id}/stream.mp3?ApiKey=${client === null || client === void 0 ? void 0 : client.apiKey}`,
        };
    },
};
