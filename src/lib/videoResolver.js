import { config } from '../config.js';
import { selectPlaybackPlan } from './playback.js';
import { isNonEmptyString } from './strings.js';
import { normalizeCaptionTracks, normalizeThumbnails, normalizeVideoItem, pickThumbnail } from './media.js';
import { fetchYtDlpJson } from '../providers/ytdlp.js';
import { fetchFromAny, getCommentsFromInstance } from '../providers/invidious.js';

const normalizeComment = (comment = {}) => ({
  commentId: String(comment.commentId || ''),
  author: String(comment.author || ''),
  authorId: String(comment.authorId || ''),
  authorUrl: String(comment.authorUrl || ''),
  authorIsChannelOwner: Boolean(comment.authorIsChannelOwner),
  published: Number(comment.published || 0),
  publishedText: String(comment.publishedText || ''),
  likeCount: Number(comment.likeCount || 0),
  content: String(comment.content || ''),
  contentHtml: String(comment.contentHtml || ''),
  isEdited: Boolean(comment.isEdited),
  isPinned: Boolean(comment.isPinned),
  isSponsor: Boolean(comment.isSponsor),
  sponsorIconUrl: String(comment.sponsorIconUrl || ''),
  authorThumbnails: Array.isArray(comment.authorThumbnails) ? comment.authorThumbnails : [],
});

const normalizeCommentsPayload = (payload = {}) => ({
  comments: Array.isArray(payload.comments) ? payload.comments.map(normalizeComment) : [],
  commentCount: Number(payload.commentCount || 0),
  continuation: String(payload.continuation || ''),
});

export const normalizeYtDlpVideo = (raw = {}) => {
  const base = normalizeVideoItem({
    ...raw,
    title: String(raw.title || ''),
    author: String(raw.uploader || raw.channel || raw.author || ''),
    authorId: String(raw.channel_id || raw.channelId || raw.authorId || ''),
    authorUrl: String(raw.channel_url || raw.uploader_url || raw.authorUrl || ''),
    authorVerified: Boolean(raw.channel_is_verified || raw.uploader_verified || raw.authorVerified),
    description: String(raw.description || ''),
    descriptionHtml: String(raw.description_html || raw.descriptionHtml || ''),
    videoThumbnails: normalizeThumbnails(raw.thumbnails || raw.videoThumbnails || []),
    lengthSeconds: Number(raw.duration || raw.lengthSeconds || 0),
    viewCount: Number(raw.view_count || raw.viewCount || 0),
    published: Number(raw.timestamp || raw.release_timestamp || raw.published || 0),
    publishedText: String(raw.upload_date || raw.publishedText || ''),
    liveNow: Boolean(raw.is_live || raw.liveNow),
    isUpcoming: Boolean(raw.is_upcoming || raw.isUpcoming),
    isListed: raw.isListed === undefined ? true : Boolean(raw.isListed),
    isFamilyFriendly: raw.age_limit === 0 ? true : Boolean(raw.is_family_friendly ?? raw.isFamilyFriendly ?? true),
    genre: String(raw.category || raw.genre || (Array.isArray(raw.categories) ? raw.categories[0] : '')),
    keywords: Array.isArray(raw.tags) ? raw.tags : Array.isArray(raw.keywords) ? raw.keywords : [],
    chapters: Array.isArray(raw.chapters) ? raw.chapters : [],
    captions: normalizeCaptionTracks(raw.subtitles || raw.automatic_captions || {}),
  });

  return {
    ...base,
    formats: Array.isArray(raw.formats) ? raw.formats : [],
    formatStreams: Array.isArray(raw.formatStreams) ? raw.formatStreams : [],
    adaptiveFormats: Array.isArray(raw.adaptiveFormats) ? raw.adaptiveFormats : [],
    hlsUrl: String(raw.hlsUrl || raw.hls_url || ''),
    dashUrl: String(raw.dashUrl || raw.dash_url || ''),
    thumbnail: pickThumbnail(raw.thumbnails || raw.videoThumbnails || [])?.url || base.thumbnail || '',
    authorThumbnails: Array.isArray(raw.authorThumbnails) ? raw.authorThumbnails : [],
    relatedVideos: Array.isArray(raw.related_videos) ? raw.related_videos.map((item) => normalizeVideoItem(item)) : [],
  };
};

const buildYtDlpProvider = ({ proxy = '', command = '' } = {}) => ({
  kind: 'ytdlp',
  name: 'yt-dlp',
  mode: isNonEmptyString(proxy) ? 'proxy' : 'direct',
  label: isNonEmptyString(proxy) ? 'yt-dlp (proxy)' : 'yt-dlp',
  proxy: isNonEmptyString(proxy) ? proxy : '',
  command,
});

export const fetchYtDlpVideo = async (videoId, { proxy = '' } = {}) => {
  const { data, command } = await fetchYtDlpJson(videoId, { proxy });
  const video = normalizeYtDlpVideo(data);
  const provider = buildYtDlpProvider({ proxy, command });
  const playback = selectPlaybackPlan(video, { videoId, allowHls: true });
  return {
    provider,
    video,
    playback,
    related: video.relatedVideos,
    commentsProvider: null,
  };
};

export const fetchInvidiousVideo = async (videoId) => {
  const { instance, data } = await fetchFromAny(`/api/v1/videos/${encodeURIComponent(videoId)}`, { region: config.region, hl: config.hl });
  const playback = selectPlaybackPlan(data, { videoId, allowHls: true });
  return {
    provider: { kind: 'invidious', name: 'invidious', instance, label: 'Invidious' },
    video: data,
    playback,
    related: Array.isArray(data?.recommendedVideos) ? data.recommendedVideos : [],
    commentsProvider: { instance },
  };
};

export const fetchComments = async (provider, videoId, continuation = '') => {
  if (!isNonEmptyString(videoId)) return normalizeCommentsPayload();

  try {
    if (provider?.instance) {
      const { data } = await getCommentsFromInstance(provider.instance, videoId, continuation);
      return normalizeCommentsPayload(data);
    }

    const { data } = await fetchFromAny(`/api/v1/comments/${encodeURIComponent(videoId)}`, {
      continuation,
      source: 'youtube',
      sort_by: 'top',
      hl: config.hl,
    });
    return normalizeCommentsPayload(data);
  } catch {
    return normalizeCommentsPayload();
  }
};

export const resolveVideoContextOrdered = async (videoId) => {
  const errors = [];
  const candidates = [
    ...(isNonEmptyString(config.ytdlpProxy) ? [() => fetchYtDlpVideo(videoId, { proxy: config.ytdlpProxy })] : []),
    () => fetchInvidiousVideo(videoId),
    () => fetchYtDlpVideo(videoId, { proxy: '' }),
  ];


  for (const attempt of candidates) {
    try {
      const context = await attempt();
      if (context?.playback) {
        return {
          provider: context.provider,
          video: context.video,
          playbackVideo: context.video,
          playback: context.playback,
          related: Array.isArray(context.related) ? context.related : [],
          commentsProvider: context.commentsProvider || null,
        };
      }
    } catch (error) {
      errors.push(error?.message || String(error || 'unknown error'));
    }
  }

  throw new Error(errors.length ? errors.join(' | ') : 'video retrieval failed');
};
