import { Readable } from 'node:stream';
import { config } from '../config.js';
import { unavailable } from '../lib/httpError.js';
import { resolveRedirectTarget, assertSafeHttpUrl } from '../lib/urlSafety.js';

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const COPY_HEADERS = [
  'content-type',
  'content-length',
  'content-range',
  'accept-ranges',
  'etag',
  'last-modified',
  'cache-control',
  'expires',
  'content-disposition',
];

const fetchUpstream = async (inputUrl, { range = '', timeoutMs = config.requestTimeoutMs } = {}) => {
  let currentUrl = (await assertSafeHttpUrl(inputUrl)).toString();

  for (let redirectCount = 0; redirectCount < 5; redirectCount += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          accept: 'video/*,audio/*;q=0.9,*/*;q=0.1',
          'user-agent': 'AuroraTube/4.0',
          ...(range ? { range } : {}),
        },
      });

      if (REDIRECT_STATUSES.has(response.status)) {
        const location = response.headers.get('location');
        if (!location) throw new Error(`redirect ${response.status} without location`);
        currentUrl = (await resolveRedirectTarget(currentUrl, location)).toString();
        continue;
      }

      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error('too many redirects');
};

export const proxyMediaStream = async (res, inputUrl, { range = '' } = {}) => {
  const response = await fetchUpstream(inputUrl, { range });

  if (![200, 206].includes(response.status)) {
    throw unavailable('media stream failed', `unexpected upstream status ${response.status}`);
  }

  res.status(response.status);
  for (const header of COPY_HEADERS) {
    const value = response.headers.get(header);
    if (value) res.setHeader(header, value);
  }
  res.setHeader('Cache-Control', 'no-store');

  if (!response.body) {
    res.end();
    return;
  }

  await new Promise((resolve, reject) => {
    const body = Readable.fromWeb(response.body);
    const fail = (error) => reject(error);
    const finish = () => resolve();

    res.once('close', () => body.destroy());
    res.once('error', fail);
    body.once('error', fail);
    body.once('end', finish);
    body.pipe(res);
  });
};
