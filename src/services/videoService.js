import { spawn } from 'node:child_process';
import { config } from '../config.js';
import { badRequest, notFound, unavailable } from '../lib/httpError.js';
import { choosePlaybackSource, normalizeCaptionTracks, normalizeThumbnails, normalizeVideoItem, pickThumbnail } from '../lib/media.js';
import { isNonEmptyString, isPlainObject } from '../lib/strings.js';
import { extractYouTubeVideoId } from '../lib/youtube.js';
import { getCommentsFromInstance, fetchFromAny } from '../providers/invidious.js';
import { fetchYtDlpJson } from '../providers/ytdlp.js';
import { proxyMediaStream } from './mediaProxy.js';

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

const firstAvailableUrl = (video) => {
  const formats = Array.isArray(video?.formats) ? video.formats : [];
  const direct = formats.find((format) => isNonEmptyString(format?.url));
  return direct?.url || '';
};

const streamWithFfmpeg = (res, inputs, outputOptions = []) =>
  new Promise((resolve, reject) => {
    const args = [
      '-hide_banner',
      '-loglevel',
      'error',
      '-nostdin',
      ...inputs.flatMap((input) => ['-reconnect', '1', '-reconnect_streamed', '1', '-reconnect_delay_max', '2', '-i', input]),
      ...outputOptions,
      '-f',
      'mp4',
      'pipe:1',
    ];

    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let stderr = '';
    let settled = false;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.once('error', (error) => {
      fail(unavailable('ffmpeg is not available', error?.message));
    });

    res.once('close', () => child.kill('SIGKILL'));
    child.stdout.pipe(res);

    child.once('close', (code) => {
      if (settled) return;
      settled = true;
      if (code === 0) {
        resolve();
      } else {
        reject(unavailable('ffmpeg failed', stderr.trim() || `exit code ${code}`));
      }
    });
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

const getYtDlpVideo = async (videoId, proxy = '') => {
  const { data, command } = await fetchYtDlpJson(videoId, { proxy });
  const video = normalizeYtDlpVideo(data);
  return {
    provider: {
      kind: 'ytdlp',
      name: 'yt-dlp',
      mode: isNonEmptyString(proxy) ? 'proxy' : 'direct',
      label: isNonEmptyString(proxy) ? 'ytDlp(proxy)' : 'ytDlp(direct)',
      proxy: isNonEmptyString(proxy) ? proxy : '',
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

export const resolveVideoContext = async (videoId) => {
  const proxy = String(process.env.YTDLP_PROXY || '').trim();
  const attempts = [
    async () => getInvidiousVideo(videoId),
    async () => getYtDlpVideo(videoId, proxy),
    async () => getYtDlpVideo(videoId, ''),
  ];

  const errors = [];
  for (const attempt of attempts) {
    try {
      const resolved = await attempt();
      const commentsProvider = resolved.provider.kind === 'invidious'
        ? resolved.provider
        : { kind: 'invidious', name: 'invidious', instance: config.invidiousInstances[0], label: 'Invidious' };

      return { ...resolved, commentsProvider };
    } catch (error) {
      errors.push(error?.message || String(error));
    }
  }

  throw unavailable('video retrieval failed', errors);
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

const buildPlayerPayload = ({ video, provider, commentsProvider, playback, comments, related }) => {
  const thumbnails = Array.isArray(video?.videoThumbnails) && video.videoThumbnails.length ? video.videoThumbnails : normalizeThumbnails(video?.thumbnails || []);
  const thumbnail = pickThumbnail(thumbnails);
  const captions = Array.isArray(video?.captions) ? video.captions : normalizeCaptionTracks(video?.subtitles || video?.automatic_captions || {});
  const resolvedRelated = Array.isArray(related) && related.length ? related : Array.isArray(video?.relatedVideos) ? video.relatedVideos : [];

  return {
    video: {
      ...normalizeVideoItem(video),
      videoId: String(video.videoId || video.id || ''),
      thumbnail: thumbnail?.url || String(video.thumbnail || ''),
      authorThumbnails: Array.isArray(video.authorThumbnails) ? video.authorThumbnails : [],
      captions,
      chapters: Array.isArray(video.chapters) ? video.chapters : [],
      commentsCount: Number(comments?.commentCount || 0),
      sourceLabel: provider.label || provider.name || '',
    },
    provider,
    commentsProvider,
    playback,
    comments: Array.isArray(comments?.comments) ? comments.comments : [],
    commentsContinuation: String(comments?.continuation || ''),
    related: Array.isArray(resolvedRelated) ? resolvedRelated.map((item) => normalizeVideoItem(item)) : [],
  };
};

const chooseBestPlayback = (video) => {
  const fromFormats = choosePlaybackSource(video);
  if (fromFormats) return fromFormats;

  const direct = firstAvailableUrl(video);
  if (direct) return { kind: 'direct', url: direct, source: 'yt-dlp-formats' };

  return null;
};

export const fetchVideoPage = async (videoId) => {
  const safeVideoId = extractYouTubeVideoId(videoId) || String(videoId || '').trim();
  if (!safeVideoId) throw badRequest('video id required');

  const context = await resolveVideoContext(safeVideoId);
  if (!isPlainObject(context.video)) throw unavailable('video response was not an object');

  const comments = await fetchInitialComments(context.commentsProvider, safeVideoId);
  const playback = chooseBestPlayback(context.video);

  return buildPlayerPayload({
    video: context.video,
    provider: context.provider,
    commentsProvider: context.commentsProvider,
    playback,
    comments,
    related: context.related,
  });
};

export const fetchVideoComments = async (videoId, continuation = '', instance = '') => {
  const safeVideoId = extractYouTubeVideoId(videoId) || String(videoId || '').trim();
  if (!isNonEmptyString(safeVideoId)) throw badRequest('video id required');

  const sourceInstance = isNonEmptyString(instance) ? instance : config.invidiousInstances[0];
  const { instance: resolvedInstance, data } = await getCommentsFromInstance(sourceInstance, safeVideoId, continuation);
  return {
    provider: { kind: 'invidious', name: 'invidious', instance: resolvedInstance, label: 'Invidious' },
    comments: Array.isArray(data?.comments) ? data.comments.map(normalizeComment) : [],
    commentCount: Number(data?.commentCount || 0),
    continuation: String(data?.continuation || ''),
  };
};

const streamSingleInput = async (res, url, outputOptions = []) =>
  streamWithFfmpeg(res, [url], ['-map', '0:v:0', '-map', '0:a:0?', ...outputOptions]);

export const streamVideo = async (req, res, videoId) => {
  const context = await resolveVideoContext(videoId);
  const source = chooseBestPlayback(context.video);

  if (!source) throw notFound('playback source not found');

  res.setHeader('Cache-Control', 'no-store');

  if (source.kind === 'direct' && source.url) {
    await proxyMediaStream(res, source.url, { range: String(req.headers.range || '') });
    return;
  }

  if (source.kind === 'dash' && source.videoUrl && source.audioUrl) {
    res.status(200);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'none');
    await streamWithFfmpeg(res, [source.videoUrl, source.audioUrl], ['-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-movflags', 'frag_keyframe+empty_moov+default_base_moof']);
    return;
  }

  if (source.kind === 'hls' && source.url) {
    res.status(200);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'none');
    await streamSingleInput(res, source.url, ['-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-movflags', 'frag_keyframe+empty_moov+default_base_moof']);
    return;
  }

  if (source.kind === 'dashManifest' && source.url) {
    res.status(200);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'none');
    await streamSingleInput(res, source.url, ['-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-movflags', 'frag_keyframe+empty_moov+default_base_moof']);
    return;
  }

  throw unavailable('unsupported playback source');
};
