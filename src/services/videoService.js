import { config } from '../config.js';
import { badRequest, notFound, unavailable } from '../lib/httpError.js';
import { normalizeCaptionTracks, normalizeThumbnails, normalizeVideoItem, pickThumbnail } from '../lib/media.js';
import { proxyRemoteMedia, streamWithFfmpeg } from '../lib/mediaTransport.js';
import { selectPlaybackPlan } from '../lib/playback.js';
import { isNonEmptyString, isPlainObject } from '../lib/strings.js';
import { extractYouTubeVideoId } from '../lib/youtube.js';
import { getCommentsFromInstance, fetchFromAny } from '../providers/invidious.js';
import { fetchYtDlpJson } from '../providers/ytdlp.js';

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
  replies: comment.replies && isPlainObject(comment.replies)
    ? {
        replyCount: Number(comment.replies.replyCount || 0),
        continuation: String(comment.replies.continuation || ''),
      }
    : null,
  creatorHeart: comment.creatorHeart && isPlainObject(comment.creatorHeart)
    ? {
        creatorThumbnail: String(comment.creatorHeart.creatorThumbnail || ''),
        creatorName: String(comment.creatorHeart.creatorName || ''),
      }
    : null,
});

const normalizeYtDlpVideo = (raw = {}) => {
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

const getYtDlpVideo = async (videoId) => {
  const { data, command } = await fetchYtDlpJson(videoId, { proxy: config.ytdlpProxy });
  const video = normalizeYtDlpVideo(data);
  return {
    provider: {
      kind: 'ytdlp',
      name: 'yt-dlp',
      mode: isNonEmptyString(config.ytdlpProxy) ? 'proxy' : 'direct',
      label: isNonEmptyString(config.ytdlpProxy) ? 'yt-dlp (proxy)' : 'yt-dlp',
      proxy: isNonEmptyString(config.ytdlpProxy) ? config.ytdlpProxy : '',
      command,
    },
    video,
    related: video.relatedVideos,
  };
};

const getInvidiousVideo = async (videoId) => {
  const { instance, data } = await fetchFromAny(`/api/v1/videos/${encodeURIComponent(videoId)}`, { region: config.region, hl: config.hl });
  return {
    provider: { kind: 'invidious', name: 'invidious', instance, label: 'Invidious' },
    video: data,
    related: Array.isArray(data?.recommendedVideos) ? data.recommendedVideos : [],
  };
};

const selectVideoContext = (primary, fallback) => {
  if (primary?.video) return primary;
  if (fallback?.video) return fallback;
  return null;
};

export const resolveVideoContext = async (videoId) => {
  const attempts = await Promise.allSettled([getInvidiousVideo(videoId), getYtDlpVideo(videoId)]);
  const resolved = attempts.filter((item) => item.status === 'fulfilled').map((item) => item.value);

  if (!resolved.length) {
    throw unavailable('video retrieval failed', attempts.map((item) => item.reason?.message || String(item.reason || 'unknown error')));
  }

  const invidiousContext = resolved.find((item) => item.provider.kind === 'invidious') || null;
  const ytdlpContext = resolved.find((item) => item.provider.kind === 'ytdlp') || null;
  const metadataContext = selectVideoContext(invidiousContext, ytdlpContext);
  const playbackContext = selectVideoContext(ytdlpContext, invidiousContext);

  const playback = selectPlaybackPlan(playbackContext.video, {
    videoId,
    allowHls: true,
  }) || selectPlaybackPlan(metadataContext.video, {
    videoId,
    allowHls: true,
  });

  if (!playback) {
    throw unavailable('playback source not found');
  }

  return {
    provider: metadataContext.provider,
    video: metadataContext.video,
    playbackVideo: playbackContext.video,
    playback,
    related: Array.isArray(metadataContext.related) && metadataContext.related.length ? metadataContext.related : playbackContext.related,
    commentsProvider: invidiousContext
      ? invidiousContext.provider
      : null,
  };
};

const normalizeCommentsPayload = (payload = {}) => ({
  comments: Array.isArray(payload.comments) ? payload.comments.map(normalizeComment) : [],
  commentCount: Number(payload.commentCount || 0),
  continuation: String(payload.continuation || ''),
});

const fetchInitialComments = async (commentsProvider, videoId) => {
  if (!commentsProvider?.instance) {
    return normalizeCommentsPayload();
  }

  try {
    const { data } = await getCommentsFromInstance(commentsProvider.instance, videoId);
    return normalizeCommentsPayload(data);
  } catch {
    return normalizeCommentsPayload();
  }
};

const buildPlayerPayload = ({ video, provider, playback, comments, related }) => {
  const thumbnails = Array.isArray(video?.videoThumbnails) && video.videoThumbnails.length ? video.videoThumbnails : normalizeThumbnails(video?.thumbnails || []);
  const thumbnail = pickThumbnail(thumbnails);
  const captions = Array.isArray(video?.captions) ? video.captions : normalizeCaptionTracks(video?.subtitles || video?.automatic_captions || {});
  const resolvedRelated = Array.isArray(related) && related.length ? related : Array.isArray(video?.relatedVideos) ? video.relatedVideos : [];
  const videoId = String(video.videoId || video.id || '');
  const streamUrl = playback?.playUrl || `/api/watch/${encodeURIComponent(videoId)}/stream`;
  const downloadUrl = `/api/watch/${encodeURIComponent(videoId)}/download`;
  const finalUrl = playback?.sourceUrl || '';

  return {
    video: {
      ...normalizeVideoItem(video),
      videoId,
      thumbnail: thumbnail?.url || String(video.thumbnail || ''),
      authorThumbnails: Array.isArray(video.authorThumbnails) ? video.authorThumbnails : [],
      captions,
      chapters: Array.isArray(video.chapters) ? video.chapters : [],
      commentsCount: Number(comments?.commentCount || 0),
      sourceLabel: provider.label || provider.name || '',
      playback: {
        kind: playback?.kind || 'unknown',
        streamUrl,
        downloadUrl,
        finalUrl,
        proxy: Boolean(playback?.proxy),
        warning: String(playback?.warning || ''),
        source: String(playback?.source || ''),
      },
    },
    provider,
    playback,
    comments: Array.isArray(comments?.comments) ? comments.comments : [],
    commentsContinuation: String(comments?.continuation || ''),
    related: Array.isArray(resolvedRelated) ? resolvedRelated.map((item) => normalizeVideoItem(item)) : [],
  };
};

const safeDispositionName = (value) => String(value || 'video')
  .replace(/[\/:*?"<>|]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim() || 'video';

const sendPlayback = async (req, res, videoId, { download = false } = {}) => {
  const context = await resolveVideoContext(videoId);
  const source = context.playback || selectPlaybackPlan(context.playbackVideo || context.video, { videoId, allowHls: true });

  if (!source) throw notFound('playback source not found');

  const videoTitle = String(context.video?.title || videoId || 'video');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${safeDispositionName(videoTitle)}.mp4"`);

  if (source.kind === 'muxed' && source.sourceUrl) {
    await proxyRemoteMedia(req, res, source.sourceUrl, { title: videoTitle, download });
    return;
  }

  if (source.kind === 'dash' && source.videoUrl && source.audioUrl) {
    res.status(200);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'none');
    await streamWithFfmpeg(res, [source.videoUrl, source.audioUrl], ['-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-movflags', 'frag_keyframe+empty_moov+default_base_moof']);
    return;
  }

  if ((source.kind === 'hls' || source.kind === 'dash-manifest') && source.sourceUrl) {
    res.status(200);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'none');
    await streamWithFfmpeg(res, [source.sourceUrl], ['-map', '0:v:0', '-map', '0:a:0?', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-movflags', 'frag_keyframe+empty_moov+default_base_moof']);
    return;
  }

  throw unavailable('unsupported playback source');
};

export const fetchVideoPage = async (videoId) => {
  const safeVideoId = extractYouTubeVideoId(videoId) || String(videoId || '').trim();
  if (!safeVideoId) throw badRequest('video id required');

  const context = await resolveVideoContext(safeVideoId);
  if (!isPlainObject(context.video)) throw unavailable('video response was not an object');

  const comments = await fetchInitialComments(context.commentsProvider, safeVideoId);

  return buildPlayerPayload({
    video: context.video,
    provider: context.provider,
    playback: context.playback,
    comments,
    related: context.related,
  });
};

export const fetchVideoComments = async (videoId, continuation = '') => {
  const safeVideoId = extractYouTubeVideoId(videoId) || String(videoId || '').trim();
  if (!isNonEmptyString(safeVideoId)) throw badRequest('video id required');

  const { data } = await fetchFromAny(`/api/v1/comments/${encodeURIComponent(safeVideoId)}`, {
    continuation,
    source: 'youtube',
    sort_by: 'top',
    hl: config.hl,
  });

  return {
    comments: Array.isArray(data?.comments) ? data.comments.map(normalizeComment) : [],
    commentCount: Number(data?.commentCount || 0),
    continuation: String(data?.continuation || ''),
  };
};

export const streamVideo = async (req, res, videoId) => {
  await sendPlayback(req, res, videoId, { download: false });
};

export const downloadVideo = async (req, res, videoId) => {
  await sendPlayback(req, res, videoId, { download: true });
};
