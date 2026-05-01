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

const buildStreamUrl = (videoId, quality = '') => {
  const search = new URLSearchParams();
  if (isNonEmptyString(quality)) search.set('quality', quality);
  const query = search.toString();
  return `/api/watch/${encodeURIComponent(videoId)}/stream${query ? `?${query}` : ''}`;
};

const buildDownloadUrl = (videoId, quality = '') => {
  const search = new URLSearchParams();
  if (isNonEmptyString(quality)) search.set('quality', quality);
  const query = search.toString();
  return `/api/watch/${encodeURIComponent(videoId)}/download${query ? `?${query}` : ''}`;
};

const variantKey = (format, index) => {
  const label = String(format.qualityLabel || '').trim();
  if (label) return label.toLowerCase();
  const height = Number(format.height || 0);
  const width = Number(format.width || 0);
  const fps = Number(format.fps || 0);
  if (height > 0) return `${height}p${fps > 0 && fps !== 30 ? `-${fps}fps` : ''}`;
  if (width > 0) return `${width}w${fps > 0 && fps !== 30 ? `-${fps}fps` : ''}`;
  return `variant-${index + 1}`;
};

const variantLabel = (format, index) => {
  const label = String(format.qualityLabel || '').trim();
  if (label) return label;
  const height = Number(format.height || 0);
  const width = Number(format.width || 0);
  const fps = Number(format.fps || 0);
  if (height > 0) return `${height}p${fps > 0 && fps !== 30 ? ` ${fps}fps` : ''}`;
  if (width > 0 && height > 0) return `${width}x${height}`;
  return `画質 ${index + 1}`;
};

const buildMuxedVariants = (formats = [], quality = '') => {
  const unique = [];
  const seen = new Set();

  for (const [index, format] of [...formats].sort((left, right) => compareScore(toScore(left), toScore(right))).entries()) {
    const key = variantKey(format, index);
    if (!format?.url || seen.has(key) || seen.has(format.url)) continue;
    seen.add(key);
    seen.add(format.url);
    unique.push({
      key,
      label: variantLabel(format, index),
      url: format.url,
      width: Number(format.width || 0),
      height: Number(format.height || 0),
      fps: Number(format.fps || 0),
      selected: false,
    });
  }

  if (!unique.length) return [];

  const requested = isNonEmptyString(quality)
    ? unique.find((variant) => variant.key === quality.toLowerCase() || variant.label.toLowerCase() === quality.toLowerCase())
    : null;
  const selected = requested || unique[0];
  const autoSelected = !requested || quality === 'auto' || !isNonEmptyString(quality);

  return [
    { key: 'auto', label: '自動', url: selected.url, width: selected.width, height: selected.height, fps: selected.fps, selected: autoSelected },
    ...unique.map((variant) => ({ ...variant, selected: !autoSelected && variant.key === selected.key })),
  ];
};

const buildWarning = (url) => (isNonEmptyString(url)
  ? 'HLS は直接参照です。'
  : '');

export const selectPlaybackPlan = (video = {}, { videoId = '', quality = '', allowHls = true } = {}) => {
  const formats = collectFormats(video);
  const muxed = pickBest(formats, isMuxed);
  const muxedVariants = buildMuxedVariants(formats.filter(isMuxed), quality);

  if (muxed?.url) {
    const selected = muxedVariants.find((variant) => variant.selected) || muxedVariants[0] || null;
    const directUrl = selected?.url || muxed.url;
    return {
      kind: 'muxed',
      sourceUrl: directUrl,
      playUrl: directUrl,
      downloadUrl: directUrl,
      proxy: false,
      warning: '',
      source: 'muxed-format',
      variants: muxedVariants,
      selectedQuality: selected?.key || 'auto',
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
      playUrl: buildStreamUrl(videoId, quality),
      downloadUrl: buildDownloadUrl(videoId, quality),
      proxy: true,
      warning: '',
      source: 'adaptive-formats',
      variants: [],
      selectedQuality: quality || 'auto',
    };
  }

  if (allowHls && isNonEmptyString(video.hlsUrl)) {
    return {
      kind: 'hls',
      sourceUrl: video.hlsUrl,
      playUrl: video.hlsUrl,
      downloadUrl: video.hlsUrl,
      proxy: false,
      warning: buildWarning(video.hlsUrl),
      source: 'hls-url',
      variants: [],
      selectedQuality: 'auto',
    };
  }

  if (isNonEmptyString(video.dashUrl)) {
    return {
      kind: 'dash-manifest',
      sourceUrl: video.dashUrl,
      playUrl: buildStreamUrl(videoId, quality),
      downloadUrl: buildDownloadUrl(videoId, quality),
      proxy: true,
      warning: '',
      source: 'dash-url',
      variants: [],
      selectedQuality: quality || 'auto',
    };
  }

  return null;
};
