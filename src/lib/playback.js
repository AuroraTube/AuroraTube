import { isNonEmptyString } from './strings.js';
import { collectFormats } from './media.js';

const toScore = (format) => [
  Number(format?.height || 0),
  Number(format?.width || 0),
  Number(format?.fps || 0),
  Number(format?.tbr || 0),
  Number(format?.filesize_approx || format?.filesize || 0),
];

const compareScore = (left = [], right = []) => {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const delta = (right[index] || 0) - (left[index] || 0);
    if (delta !== 0) return delta;
  }
  return 0;
};

const isMuxed = (format) => Boolean(
  format
  && ((format.vcodec && format.vcodec !== 'none' && format.acodec && format.acodec !== 'none')
    || (format.mime && format.mime.includes('video') && format.mime.includes('audio')))
);

const isVideoOnly = (format) => Boolean(
  format
  && ((format.vcodec && format.vcodec !== 'none' && (!format.acodec || format.acodec === 'none'))
    || (format.mime && format.mime.includes('video') && !format.mime.includes('audio')))
);

const isAudioOnly = (format) => Boolean(
  format
  && ((format.acodec && format.acodec !== 'none' && (!format.vcodec || format.vcodec === 'none'))
    || (format.mime && format.mime.includes('audio') && !format.mime.includes('video')))
);

const pickBest = (formats, predicate) => [...formats]
  .filter(predicate)
  .sort((left, right) => compareScore(toScore(left), toScore(right)))[0] || null;

const buildStreamUrl = (videoId) => `/api/watch/${encodeURIComponent(videoId)}/stream`;

const buildWarning = (url) => (isNonEmptyString(url)
  ? 'HLS は Google CDN を直接参照しています。再生はローカル経由で継続します。'
  : '');

export const selectPlaybackPlan = (video = {}, { videoId = '', allowHls = true } = {}) => {
  const formats = collectFormats(video);
  const muxed = pickBest(formats, isMuxed);
  if (muxed?.url) {
    return {
      kind: 'muxed',
      sourceUrl: muxed.url,
      playUrl: buildStreamUrl(videoId),
      proxy: true,
      warning: '',
      source: 'muxed-format',
    };
  }

  const videoOnly = pickBest(formats, isVideoOnly);
  const audioOnly = pickBest(formats, isAudioOnly);
  if (videoOnly?.url && audioOnly?.url) {
    return {
      kind: 'dash',
      sourceUrl: videoOnly.url,
      videoUrl: videoOnly.url,
      audioUrl: audioOnly.url,
      playUrl: buildStreamUrl(videoId),
      proxy: true,
      warning: '',
      source: 'adaptive-formats',
    };
  }

  if (allowHls && isNonEmptyString(video.hlsUrl)) {
    return {
      kind: 'hls',
      sourceUrl: video.hlsUrl,
      playUrl: buildStreamUrl(videoId),
      proxy: false,
      warning: buildWarning(video.hlsUrl),
      source: 'hls-url',
    };
  }

  if (isNonEmptyString(video.dashUrl)) {
    return {
      kind: 'dash-manifest',
      sourceUrl: video.dashUrl,
      playUrl: buildStreamUrl(videoId),
      proxy: true,
      warning: '',
      source: 'dash-url',
    };
  }

  return null;
};
