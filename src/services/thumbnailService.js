import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { settings } from '../settings.js';
import { badRequest, unavailable } from '../lib/httpError.js';
import { assertSafeHttpUrl, resolveRedirectTarget } from '../lib/urlSafety.js';

const MAX_REDIRECTS = 5;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const isRedirectStatus = (status) => [301, 302, 303, 307, 308].includes(Number(status));

const setCommonHeaders = (res, contentType, contentLength) => {
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Content-Type', contentType);
  if (contentLength) res.setHeader('Content-Length', String(contentLength));
};

export const streamThumbnail = async (res, inputUrl) => {
  let url;
  try {
    url = await assertSafeHttpUrl(inputUrl);
  } catch (error) {
    throw badRequest('url required or invalid', error?.message);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), settings.requestTimeoutMs);

  try {
    let currentUrl = url.toString();

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      const response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
        },
      });

      if (isRedirectStatus(response.status)) {
        const location = response.headers.get('location');
        if (!location) throw unavailable('thumbnail redirect missing location');
        currentUrl = (await resolveRedirectTarget(currentUrl, location)).toString();
        continue;
      }

      if (!response.ok) {
        throw unavailable('thumbnail fetch failed', `HTTP ${response.status}`);
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (!contentType.startsWith('image/')) {
        throw unavailable('thumbnail response was not an image', contentType || 'unknown content type');
      }

      const contentLength = Number(response.headers.get('content-length') || 0);
      if (contentLength > MAX_IMAGE_BYTES) {
        throw unavailable('thumbnail is too large', `${contentLength} bytes`);
      }

      setCommonHeaders(res, contentType, contentLength);
      res.status(response.status || 200);

      if (!response.body) {
        res.end();
        return;
      }

      await pipeline(Readable.fromWeb(response.body), res);
      return;
    }

    throw unavailable('thumbnail redirect limit exceeded');
  } catch (error) {
    if (error?.code === 'ABORT_ERR' || error?.name === 'AbortError') {
      throw unavailable('thumbnail fetch timed out');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};
