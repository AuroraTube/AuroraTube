import { config, invidiousInstances } from '../config.js';
import { isPlainObject } from '../lib/strings.js';
import { buildStreamingData } from './ytDlp.js';

const badInstances = new Map();
let rrIndex = 0;

const markInstanceBad = (instance) => {
  badInstances.set(instance, Date.now());
};

const rotateInstances = (instances = []) => {
  if (!Array.isArray(instances) || instances.length === 0) return [];

  const start = rrIndex % instances.length;
  rrIndex = (rrIndex + 1) % instances.length;

  const rotated = [...instances.slice(start), ...instances.slice(0, start)];
  const now = Date.now();

  const available = rotated.filter((instance) => {
    const seenAt = badInstances.get(instance);
    if (!seenAt) return true;
    if (now - seenAt > config.instanceBanMs) {
      badInstances.delete(instance);
      return true;
    }
    return false;
  });

  return available.length ? available : rotated;
};

const fastestFetch = async (instances, buildUrl, parser) => {
  if (!instances || instances.length === 0) throw new Error('no instances');

  const controllers = [];
  const tasks = instances.map((base) =>
    (async () => {
      const controller = new AbortController();
      controllers.push(controller);

      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, config.requestTimeoutMs);

      try {
        const response = await fetch(buildUrl(base), {
          signal: controller.signal,
          headers: { accept: 'application/json' },
        });

        if (!response.ok) {
          markInstanceBad(base);
          throw new Error(`bad response ${response.status} from ${base}`);
        }

        const json = await response.json();
        if (!isPlainObject(json)) {
          markInstanceBad(base);
          throw new Error(`non-object JSON from ${base}`);
        }

        const parsed = parser(json);
        if (!parsed) {
          markInstanceBad(base);
          throw new Error(`parse failed from ${base}`);
        }

        return { instance: base, data: parsed };
      } catch (error) {
        const aborted = error?.name === 'AbortError';
        if (timedOut || !aborted) markInstanceBad(base);
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    })()
  );

  try {
    const result = await Promise.any(tasks);
    controllers.forEach((controller) => controller.abort());
    return result;
  } catch {
    controllers.forEach((controller) => controller.abort());
    throw new Error('All instances failed');
  }
};

const parseInvidiousVideo = (data) => {
  if (!isPlainObject(data)) return null;

  const sd = buildStreamingData(data);
  const live = Boolean(
    data.liveNow || data.isLive || data.is_live || data.live || data.live_status === 'is_live' || sd.streamingData?.isLive
  );

  if (live) {
    throw new Error('skip live on invidious');
  }

  return {
    streaming_data: sd,
    is_live: live,
    raw: data,
  };
};

export const fetchFromInvidious = async (videoId) => {
  const instances = rotateInstances(invidiousInstances);

  const result = await fastestFetch(
    instances,
    (base) => `${base.replace(/\/$/, '')}/api/v1/videos/${videoId}`,
    parseInvidiousVideo
  );

  return {
    provider: result.instance,
    streaming_data: result.data.streaming_data,
    is_live: result.data.is_live,
    raw: result.data.raw,
  };
};
