import { badRequest, notFound, unavailable } from '../lib/httpError.js';
import { normalizeCaptionTracks, normalizeThumbnails, normalizeVideoItem, pickThumbnail } from '../lib/media.js';
import { proxyRemoteMedia, streamWithFfmpeg } from '../lib/mediaTransport.js';
import { isNonEmptyString, isPlainObject } from '../lib/strings.js';
import { extractYouTubeVideoId } from '../lib/youtube.js';
import { fetchComments, resolveVideoContextOrdered } from '../lib/videoResolver.js';

const buildPlayerPayload = ({ video, provider, playback, comments, related }) => {
  const thumbnails = Array.isArray(video?.videoThumbnails) && video.videoThumbnails.length ? video.videoThumbnails : normalizeThumbnails(video?.thumbnails || []);
  const thumbnail = pickThumbnail(thumbnails);
  const captions = Array.isArray(video?.captions) ? video.captions : normalizeCaptionTracks(video?.subtitles || video?.automatic_captions || {});
  const resolvedRelated = Array.isArray(related) && related.length ? related : Array.isArray(video?.relatedVideos) ? video.relatedVideos : [];
  const videoId = String(video?.videoId || video?.id || '');
  const streamUrl = playback?.playUrl || `/api/watch/${encodeURIComponent(videoId)}/stream`;
  const downloadUrl = `/api/watch/${encodeURIComponent(videoId)}/download`;
  const finalUrl = playback?.sourceUrl || '';

  return {
    video: {
      ...normalizeVideoItem(video),
      videoId,
      thumbnail: thumbnail?.url || String(video?.thumbnail || ''),
      authorThumbnails: Array.isArray(video?.authorThumbnails) ? video.authorThumbnails : [],
      captions,
      chapters: Array.isArray(video?.chapters) ? video.chapters : [],
      commentsCount: Number(comments?.commentCount || 0),
      sourceLabel: provider?.label || provider?.name || '',
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
  const context = await resolveVideoContextOrdered(videoId);
  const source = context.playback;

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

  const context = await resolveVideoContextOrdered(safeVideoId);
  if (!isPlainObject(context.video)) throw unavailable('video response was not an object');

  const comments = await fetchComments(context.commentsProvider, safeVideoId);

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

  return fetchComments(null, safeVideoId, continuation);
};

export const streamVideo = async (req, res, videoId) => {
  await sendPlayback(req, res, videoId, { download: false });
};

export const downloadVideo = async (req, res, videoId) => {
  await sendPlayback(req, res, videoId, { download: true });
};
