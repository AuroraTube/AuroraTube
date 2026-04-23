import { spawn } from 'node:child_process';
import { config } from '../config.js';
import { extractYouTubeVideoId } from '../lib/youtube.js';
import { buildFormats, extractManifestUrl, fetchFromYtDlp, normalizeResourceChoice } from '../providers/ytDlp.js';
import { fetchFromInvidious } from '../providers/invidious.js';
import { isPlainObject, isNonEmptyString } from '../lib/strings.js';

const extractTitle = (raw = {}) =>
  raw.title ||
  raw.videoDetails?.title ||
  raw.video_details?.title ||
  raw.player_response?.videoDetails?.title ||
  raw.basic_info?.title ||
  raw.microformat?.title?.simpleText ||
  (raw.titleText?.runs?.map?.((part) => part.text) || []).join('') ||
  raw.video?.title ||
  null;

const isLiveLike = (raw = {}, sd = {}) =>
  Boolean(raw.is_live || raw.live_status === 'is_live' || raw.liveNow || raw.isLive || raw.live || sd.isLive);

const fetchStreamingInfo = async (videoId) => {
  if (config.proxyUrl) {
    try {
      return await fetchFromYtDlp(videoId, { useProxy: true });
    } catch (error) {
      console.warn('proxied yt-dlp failed, falling back to invidious:', error?.message || error);
    }
  }

  try {
    return await fetchFromInvidious(videoId);
  } catch (error) {
    console.warn('invidious failed, falling back to direct yt-dlp:', error?.message || error);
  }

  return await fetchFromYtDlp(videoId, { useProxy: false });
};

export const resolveStream = async (input) => {
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) {
    const error = new Error('invalid YouTube url or id');
    error.statusCode = 400;
    throw error;
  }

  const info = await fetchStreamingInfo(videoId);
  const raw = info.raw || {};
  const sd = info.streaming_data || {};
  const title = extractTitle(raw) || '';
  const live = isLiveLike(raw, sd);
  const formats = buildFormats(raw, sd);
  const choice = normalizeResourceChoice(raw, sd);
  const manifest = extractManifestUrl(raw, sd, live);

  return {
    videoId,
    title,
    provider: info.provider,
    live,
    formats,
    choice,
    manifest,
    raw,
    streamingData: sd,
  };
};

const buildGooglevideoUrls = (result) => {
  if (!result || !isPlainObject(result)) return null;

  const choice = result.choice || {};
  const manifest = result.manifest || {};

  if (choice.kind === 'dash' && choice.videourl && choice.audiourl) {
    return {
      kind: 'dash',
      videoUrl: choice.videourl,
      audioUrl: choice.audiourl,
      source: choice.source || 'adaptive',
    };
  }

  if (choice.kind === 'progressive' && choice.url) {
    return {
      kind: 'progressive',
      url: choice.url,
      source: choice.source || 'muxed',
    };
  }

  if ((choice.kind === 'hls' || choice.kind === 'dash') && choice.url) {
    return {
      kind: choice.kind,
      url: choice.url,
      source: choice.source || 'manifest',
    };
  }

  if (manifest?.url) {
    return {
      kind: manifest.kind || 'hls',
      url: manifest.url,
      source: 'manifest',
    };
  }

  return null;
};

export const buildInternalGooglevideoPayload = (result) => {
  const direct = buildGooglevideoUrls(result);
  if (!direct) {
    const error = new Error('no stream urls');
    error.statusCode = 404;
    throw error;
  }

  return {
    videoId: result.videoId,
    title: result.title,
    provider: result.provider,
    live: result.live,
    ...direct,
  };
};

export const buildFinalPlaybackPayload = (result, req) => {
  const direct = buildGooglevideoUrls(result);
  if (!direct) {
    const error = new Error('no playable url');
    error.statusCode = 404;
    throw error;
  }

  const basePath = '/api/stream';
  const input = encodeURIComponent(result.videoId);
  const streamUrl = `${basePath}?input=${input}`;

  if (direct.kind === 'hls') {
    return {
      videoId: result.videoId,
      title: result.title,
      provider: result.provider,
      live: result.live,
      kind: 'hls',
      url: direct.url,
      source: direct.source,
    };
  }

  if (direct.kind === 'dash') {
    return {
      videoId: result.videoId,
      title: result.title,
      provider: result.provider,
      live: result.live,
      kind: 'dash',
      url: streamUrl,
      source: direct.source,
    };
  }

  return {
    videoId: result.videoId,
    title: result.title,
    provider: result.provider,
    live: result.live,
    kind: 'progressive',
    url: direct.url,
    source: direct.source,
  };
};

const sanitizeHeaderValue = (value) => String(value || '').replace(/[\r\n]/g, ' ').trim();

const streamRemoteToResponse = async (res, url) => {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0',
      accept: '*/*',
      range: res.req?.headers?.range || undefined,
    },
  });

  if (!response.ok && response.status !== 206) {
    throw new Error(`upstream responded ${response.status}`);
  }

  res.status(response.status || 200);
  const contentType = response.headers.get('content-type');
  if (contentType) res.setHeader('Content-Type', sanitizeHeaderValue(contentType));
  const contentLength = response.headers.get('content-length');
  if (contentLength) res.setHeader('Content-Length', sanitizeHeaderValue(contentLength));
  const acceptRanges = response.headers.get('accept-ranges');
  if (acceptRanges) res.setHeader('Accept-Ranges', sanitizeHeaderValue(acceptRanges));
  const contentRange = response.headers.get('content-range');
  if (contentRange) res.setHeader('Content-Range', sanitizeHeaderValue(contentRange));

  if (!response.body) {
    res.end();
    return;
  }

  for await (const chunk of response.body) {
    if (res.writableEnded) break;
    res.write(chunk);
  }
  res.end();
};

const streamMuxedWithFfmpeg = (res, videoUrl, audioUrl) =>
  new Promise((resolve, reject) => {
    const args = [
      '-hide_banner',
      '-loglevel',
      'error',
      '-nostdin',
      '-reconnect',
      '1',
      '-reconnect_streamed',
      '1',
      '-reconnect_delay_max',
      '2',
      '-i',
      videoUrl,
      '-reconnect',
      '1',
      '-reconnect_streamed',
      '1',
      '-reconnect_delay_max',
      '2',
      '-i',
      audioUrl,
      '-map',
      '0:v:0',
      '-map',
      '1:a:0',
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      '160k',
      '-movflags',
      'frag_keyframe+empty_moov+default_base_moof',
      '-f',
      'mp4',
      'pipe:1',
    ];

    const child = spawn('ffmpeg', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', reject);

    child.stdout.pipe(res);

    res.on('close', () => {
      child.kill('SIGKILL');
      resolve();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`ffmpeg failed (${code}): ${stderr.trim() || 'no stderr'}`));
    });
  });

export const streamDashCombined = async (res, result) => {
  const direct = buildGooglevideoUrls(result);
  if (!direct) {
    throw new Error('no stream to serve');
  }

  if (direct.kind === 'hls' && direct.url) {
    const error = new Error('hls is not served from /api/stream; use /api/play-url');
    error.statusCode = 400;
    throw error;
  }

  if (direct.kind === 'progressive' && direct.url) {
    res.redirect(302, direct.url);
    return;
  }

  if (direct.kind !== 'dash' || !direct.videoUrl || !direct.audioUrl) {
    const error = new Error('stream combination requires dash video+audio URLs');
    error.statusCode = 400;
    throw error;
  }

  res.status(200);
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Accept-Ranges', 'none');
  await streamMuxedWithFfmpeg(res, direct.videoUrl, direct.audioUrl);
};

export const toInternalGooglevideoPayload = buildInternalGooglevideoPayload;
export const toFinalPlaybackPayload = buildFinalPlaybackPayload;
