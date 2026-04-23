import { spawn } from 'node:child_process';
import { config, manifestKeys } from '../config.js';
import { isNonEmptyString, isPlainObject, snippet, toNumber } from '../lib/strings.js';

const flattenArrays = (...values) => values.flatMap((value) => (Array.isArray(value) ? value : [])).filter(Boolean);

const uniqByKey = (items, keyFn) => {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
};

const parseStrictJsonObject = (text, context) => {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) throw new Error(`${context}: empty output`);

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(`${context}: invalid JSON (${snippet(trimmed)})`);
  }

  if (!isPlainObject(parsed)) {
    throw new Error(`${context}: JSON must be an object`);
  }

  return parsed;
};

const parseHeightFromLabel = (label) => {
  const match = String(label || '').match(/(\d{3,4})p/i);
  return match ? Number(match[1]) : 0;
};

const parseUrlFromFormat = (format) => {
  if (!format) return null;
  if (typeof format === 'string') return format;
  if (isNonEmptyString(format.url)) return format.url;

  const cipher = format.signatureCipher || format.signature_cipher || format.cipher;
  if (!cipher) return null;

  try {
    const params = new URLSearchParams(cipher);
    return params.get('url');
  } catch {
    return null;
  }
};

const collectFormats = (raw = {}, sd = {}) => {
  const sources = flattenArrays(
    raw.formats,
    raw.requested_formats,
    raw.adaptiveFormats,
    raw.adaptive_formats,
    raw.formatStreams,
    sd.formats,
    sd.requested_formats,
    sd.adaptiveFormats,
    sd.adaptive_formats,
    sd.formatStreams,
    sd.streamingData?.formats,
    sd.streamingData?.requested_formats,
    sd.streamingData?.adaptiveFormats,
    sd.streamingData?.adaptive_formats,
    sd.streamingData?.formatStreams
  );

  const normalized = sources
    .map((format) => {
      if (!isPlainObject(format)) return null;

      const mime = String(format.mimeType || format.mime_type || format.type || '').toLowerCase();
      const vcodec = String(format.vcodec || '').toLowerCase();
      const acodec = String(format.acodec || '').toLowerCase();

      return {
        ...format,
        url: parseUrlFromFormat(format),
        mime,
        vcodec,
        acodec,
        width: toNumber(format.width, 0),
        height: toNumber(format.height || parseHeightFromLabel(format.qualityLabel || format.resolution), 0),
        fps: toNumber(format.fps, 0),
        tbr: toNumber(format.tbr || format.bitrate || format.total_bitrate, 0),
        abr: toNumber(format.abr || format.audioBitrate, 0),
        vbr: toNumber(format.vbr, 0),
        filesize: toNumber(format.filesize, 0),
        filesize_approx: toNumber(format.filesize_approx, 0),
        qualityLabel: String(format.qualityLabel || format.quality_label || format.resolution || ''),
      };
    })
    .filter(Boolean);

  return uniqByKey(normalized, (format) => {
    return (
      format.url ||
      `${String(format.itag || '')}|${String(format.format_id || '')}|${String(format.height || '')}|${String(format.width || '')}|${String(format.mime || '')}`
    );
  });
};

const buildSdFromRaw = (raw = {}) => {
  const sd = {
    formats: Array.isArray(raw.formats) ? raw.formats : [],
    requested_formats: Array.isArray(raw.requested_formats) ? raw.requested_formats : [],
  };

  for (const key of manifestKeys) {
    if (raw[key]) sd[key] = raw[key];
  }

  if (raw.streamingData && isPlainObject(raw.streamingData)) {
    sd.streamingData = raw.streamingData;
  }

  if (Array.isArray(raw.adaptiveFormats)) sd.adaptiveFormats = raw.adaptiveFormats;
  if (Array.isArray(raw.adaptive_formats)) sd.adaptive_formats = raw.adaptive_formats;
  if (Array.isArray(raw.formatStreams)) sd.formatStreams = raw.formatStreams;

  return sd;
};

const isHlsUrl = (url) => /(^|[/?#&])[^?#]*\.m3u8(\?|#|$)/i.test(url) || /mpegurl/i.test(url);
const isDashUrl = (url) => /(^|[/?#&])[^?#]*\.mpd(\?|#|$)/i.test(url) || /dash/i.test(url);

const extractManifest = (raw = {}, sd = {}, live = false) => {
  const candidates = [
    { kind: 'dash', url: sd.dashManifestUrl },
    { kind: 'dash', url: sd.dash_manifest_url },
    { kind: 'dash', url: sd.dashUrl },
    { kind: 'hls', url: sd.hlsManifestUrl },
    { kind: 'hls', url: sd.hls_manifest_url },
    { kind: 'hls', url: sd.hlsUrl },
    { kind: 'dash', url: raw.dashManifestUrl },
    { kind: 'dash', url: raw.dash_manifest_url },
    { kind: 'dash', url: raw.dashUrl },
    { kind: 'hls', url: raw.hlsManifestUrl },
    { kind: 'hls', url: raw.hls_manifest_url },
    { kind: 'hls', url: raw.hlsUrl },
    { kind: null, url: sd.manifestUrl },
    { kind: null, url: sd.manifest_url },
    { kind: null, url: raw.manifestUrl },
    { kind: null, url: raw.manifest_url },
  ].filter((item) => isNonEmptyString(item.url));

  if (!candidates.length) return null;

  const inferKind = (item) => {
    if (item.kind) return item.kind;
    if (isHlsUrl(item.url)) return 'hls';
    if (isDashUrl(item.url)) return 'dash';
    return 'hls';
  };

  const ordered = candidates.map((item) => ({ url: item.url, kind: inferKind(item) }));
  const preferredKinds = live ? ['hls', 'dash'] : ['dash', 'hls'];

  for (const kind of preferredKinds) {
    const found = ordered.find((item) => item.kind === kind);
    if (found) return found;
  }

  return ordered[0];
};

const isMuxedFormat = (format) =>
  Boolean(
    format &&
    ((format.vcodec && format.vcodec !== 'none' && format.acodec && format.acodec !== 'none') ||
      (format.mime.includes('video') && format.mime.includes('audio')))
  );

const isVideoOnly = (format) =>
  Boolean(
    format &&
    ((format.vcodec && format.vcodec !== 'none' && (!format.acodec || format.acodec === 'none')) ||
      (format.mime.includes('video') && !format.mime.includes('audio')))
  );

const isAudioOnly = (format) =>
  Boolean(
    format &&
    ((format.acodec && format.acodec !== 'none' && (!format.vcodec || format.vcodec === 'none')) ||
      (format.mime.includes('audio') && !format.mime.includes('video')))
  );

const scoreVideoFormat = (format) => [
  toNumber(format.height, 0),
  toNumber(format.width, 0),
  toNumber(format.fps, 0),
  toNumber(format.tbr || format.vbr || format.abr, 0),
  toNumber(format.filesize_approx || format.filesize, 0),
];

const scoreAudioFormat = (format) => [
  toNumber(format.abr, 0),
  toNumber(format.tbr || format.vbr, 0),
  toNumber(format.filesize_approx || format.filesize, 0),
];

const compareVideoQuality = (a, b) => {
  const left = scoreVideoFormat(a);
  const right = scoreVideoFormat(b);
  for (let index = 0; index < left.length; index += 1) {
    if (right[index] !== left[index]) return right[index] - left[index];
  }
  return 0;
};

const compareAudioQuality = (a, b) => {
  const left = scoreAudioFormat(a);
  const right = scoreAudioFormat(b);
  for (let index = 0; index < left.length; index += 1) {
    if (right[index] !== left[index]) return right[index] - left[index];
  }
  return 0;
};

const selectBestMuxed = (formats = []) => [...formats].filter(isMuxedFormat).sort(compareVideoQuality)[0] || null;
const selectBestVideo = (formats = []) =>
  [...formats].filter(isVideoOnly).sort(compareVideoQuality)[0] ||
  [...formats].filter((format) => format.mime.includes('video')).sort(compareVideoQuality)[0] ||
  null;
const selectBestAudio = (formats = []) =>
  [...formats].filter(isAudioOnly).sort(compareAudioQuality)[0] ||
  [...formats].filter((format) => format.mime.includes('audio')).sort(compareAudioQuality)[0] ||
  null;

const selectDashFromRequested = (raw = {}, sd = {}) => {
  const requested = flattenArrays(raw.requested_formats, sd.requested_formats, sd.streamingData?.requested_formats).filter(
    (value) => value && typeof value === 'object'
  );

  if (requested.length < 2) return null;

  const normalized = collectFormats({ requested_formats: requested }, {});
  const video = normalized.find(isVideoOnly);
  const audio = normalized.find(isAudioOnly);

  if (!video || !audio) return null;

  return {
    kind: 'dash',
    videourl: parseUrlFromFormat(video),
    audiourl: parseUrlFromFormat(audio),
    source: 'requested_formats',
  };
};

const runYtDlp = async (videoId, { useProxy = false } = {}) => {
  const args = [
    '--dump-single-json',
    '--skip-download',
    '--no-playlist',
    '--no-warnings',
    '--no-progress',
    '--format',
    'bestvideo*+bestaudio/best',
    `https://www.youtube.com/watch?v=${videoId}`,
  ];

  if (useProxy && config.proxyUrl) {
    args.splice(args.length - 1, 0, '--proxy', config.proxyUrl);
  }

  return new Promise((resolve, reject) => {
    const child = spawn(config.ytDlpBin, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const done = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(value);
    };

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      done(new Error('yt-dlp timed out'));
    }, config.ytDlpTimeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (error) => done(error));

    child.on('close', (code, signal) => {
      if (settled) return;
      if (code !== 0) {
        done(new Error(`yt-dlp failed (${code ?? signal ?? 'unknown'}): ${snippet(stderr) || 'no stderr output'}`));
        return;
      }

      try {
        done(null, parseStrictJsonObject(stdout, 'yt-dlp stdout'));
      } catch (error) {
        done(error);
      }
    });
  });
};

export const fetchFromYtDlp = async (videoId, { useProxy = false } = {}) => {
  const raw = await runYtDlp(videoId, { useProxy });
  if (!isPlainObject(raw)) throw new Error('yt-dlp returned non-object JSON');

  const sd = buildSdFromRaw(raw);
  const formats = collectFormats(raw, sd);
  const live = Boolean(raw.is_live || raw.live_status === 'is_live' || raw.liveNow || raw.isLive || raw.live || sd.isLive);

  return {
    provider: useProxy ? 'yt-dlp (proxy)' : 'yt-dlp (direct)',
    streaming_data: sd,
    is_live: live,
    raw,
    formats,
  };
};

export const normalizeResourceChoice = (raw = {}, sd = {}) => {
  const formats = collectFormats(raw, sd);
  const live = Boolean(raw.is_live || raw.live_status === 'is_live' || raw.liveNow || raw.isLive || raw.live || sd.isLive);

  if (live) {
    const manifest = extractManifest(raw, sd, true);
    if (!manifest) return null;
    return {
      kind: manifest.kind,
      url: manifest.url,
      source: 'manifest',
    };
  }

  const requestedDash = selectDashFromRequested(raw, sd);
  if (requestedDash?.videourl && requestedDash?.audiourl) {
    return requestedDash;
  }

  const video = selectBestVideo(formats);
  const audio = selectBestAudio(formats);
  if (video && audio) {
    return {
      kind: 'dash',
      videourl: parseUrlFromFormat(video),
      audiourl: parseUrlFromFormat(audio),
      source: 'adaptive',
    };
  }

  const muxed = selectBestMuxed(formats);
  if (muxed) {
    return {
      kind: 'progressive',
      url: parseUrlFromFormat(muxed),
      source: 'muxed',
    };
  }

  const manifest = extractManifest(raw, sd, false);
  if (manifest) {
    return {
      kind: manifest.kind,
      url: manifest.url,
      source: 'manifest',
    };
  }

  return null;
};

export const buildStreamingData = (raw = {}) => buildSdFromRaw(raw);
export const buildFormats = (raw = {}, sd = {}) => collectFormats(raw, sd);
export const extractManifestUrl = (raw = {}, sd = {}, live = false) => extractManifest(raw, sd, live);
