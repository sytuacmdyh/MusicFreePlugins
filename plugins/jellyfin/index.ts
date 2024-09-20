import axios from "axios";

interface ICachedData {
  url?: string;
  apiKey?: string;
  mediaId?: string;
}

const pageSize = 20;

const cachedData: ICachedData = {};

function getClient() {
  const { url, apiKey, mediaId } = env?.getUserVariables?.() ?? {};
  if (!(url && apiKey)) {
    return null;
  }

  cachedData.url = url;
  cachedData.apiKey = apiKey;
  cachedData.mediaId = mediaId;

  return cachedData;
}

function formatMusicItem(it) {
  const url = getClient()?.url;

  return {
    id: it.Id,
    title: it.Name,
    artist: it.Artists?.[0],
    album: it.Album,
    artwork: it?.ImageTags?.Primary
      ? `${url}/Items/${it.Id}/Images/Primary?fillHeight=361&fillWidth=361&quality=96&tag=${it.ImageTags.Primary}`
      : null,
    duration: it.RunTimeTicks / 10000000,
    custom: {
      type: it.MediaStreams?.filter((t) => t.Type === "Audio")?.[0]?.Codec || "mp3",
    },
  };
}

async function searchMusic(query, page): Promise<any> {
  const client = getClient();
  if (!client) {
    return { isEnd: true, data: [] };
  }

  const { url, apiKey, mediaId } = client;

  const result = (
    await axios.get(`${url}/Items`, {
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
        Fields: "MediaStreams",
      },
    })
  ).data;

  return {
    isEnd: result?.TotalRecordCount <= page * pageSize,
    data: result?.Items?.map?.(formatMusicItem),
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

async function getTopListDetail(topListItem: IMusicSheet.IMusicSheetItem, page: number) {
  const searchResult = await searchMusic(null, page);
  return {
    isEnd: searchResult.isEnd,
    musicList: searchResult?.data,
  };
}

module.exports = {
  platform: "Jellyfin",
  version: "0.0.2",
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
  async getMediaSource(musicItem, quality: IMusic.IQualityKey) {
    const client = getClient();
    return {
      url:
        quality == "super"
          ? `${client?.url}/Audio/${musicItem.id}/stream.${musicItem.custom?.type}?ApiKey=${client?.apiKey}&static=true`
          : `${client?.url}/Audio/${musicItem.id}/stream.mp3?ApiKey=${client?.apiKey}`,
    };
  },
};

// searchMusic("夜曲", 1).then((e) => console.log(JSON.stringify(e)));
