import { spawn } from "node:child_process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { config } from "../config.js";
import { unavailable } from "./httpError.js";
import { isNonEmptyString } from "./strings.js";

const SAFE_HEADER_NAMES = new Set([
  'accept-ranges',
  'cache-control',
  'content-length',
  'content-range',
  'content-type',
  'etag',
  'last-modified',
  'x-content-duration',
]);

const sanitizeFileName = (value) => String(value || 'video')
  .replace(/[\/:*?"<>|]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim() || 'video';

export const buildContentDisposition = (title, download = false) => {
  const fileName = `${sanitizeFileName(title)}.mp4`;
  const encoded = encodeURIComponent(fileName).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  const ascii = fileName.replace(/[^ -~]/g, '_');
  const mode = download ? 'attachment' : 'inline';
  return `${mode}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
};

const applyForwardedHeaders = (res, response) => {
  for (const [name, value] of response.headers.entries()) {
    if (!SAFE_HEADER_NAMES.has(name.toLowerCase())) continue;
    if (!value) continue;
    res.setHeader(name, value);
  }
};

export const proxyRemoteMedia = async (req, res, sourceUrl, { title = 'video', download = false } = {}) => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  req.once('close', abort);
  res.once('close', abort);

  try {
    const response = await fetch(String(sourceUrl), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        accept: req.headers.accept || '*/*',
        ...(isNonEmptyString(req.headers.range) ? { range: req.headers.range } : {}),
      },
    });

    if (!response.ok && response.status !== 206) {
      throw unavailable('media fetch failed', `HTTP ${response.status}`);
    }

    res.status(response.status || 200);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', buildContentDisposition(title, download));

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    applyForwardedHeaders(res, response);

    if (!response.body) {
      res.end();
      return;
    }

    await pipeline(Readable.fromWeb(response.body), res);
  } catch (error) {
    if (error?.name === 'AbortError') return;
    throw unavailable('media stream failed', error?.message || String(error));
  } finally {
    req.off('close', abort);
    res.off('close', abort);
  }
};

export const streamWithFfmpeg = (res, inputs, outputOptions = []) =>
  new Promise((resolve, reject) => {
    const args = [
      '-hide_banner',
      '-loglevel',
      'error',
      '-nostdin',
      ...(isNonEmptyString(config.ytdlpProxy) ? ['-http_proxy', config.ytdlpProxy] : []),
      ...inputs.flatMap((input) => ['-reconnect', '1', '-reconnect_streamed', '1', '-reconnect_delay_max', '2', '-i', input]),
      ...outputOptions,
      '-f',
      'mp4',
      'pipe:1',
    ];

    const child = spawn('ffmpeg', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      env: {
        ...process.env,
        ...(isNonEmptyString(config.ytdlpProxy) ? {
          http_proxy: config.ytdlpProxy,
          https_proxy: config.ytdlpProxy,
          HTTP_PROXY: config.ytdlpProxy,
          HTTPS_PROXY: config.ytdlpProxy,
        } : {}),
      },
    });

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
