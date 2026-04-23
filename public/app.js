const form = document.getElementById('stream-form');
const input = document.getElementById('stream-input');
const player = document.getElementById('player');
const statusNode = document.getElementById('status');
const titleNode = document.getElementById('title');
const sourceNode = document.getElementById('source');
const submitButton = form.querySelector('button[type="submit"]');
const finalUrlNode = document.getElementById('final-url');

const youtubeIdPattern = /^[a-zA-Z0-9_-]{11}$/;

const setStatus = (message, kind = '') => {
  statusNode.textContent = message;
  statusNode.classList.toggle('error', kind === 'error');
};

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const extractYouTubeVideoId = (value) => {
  const text = String(value || '').trim();
  if (!text) return null;
  if (youtubeIdPattern.test(text)) return text;
  const normalized = /^https?:\/\//i.test(text) ? text : `https://${text}`;

  try {
    const url = new URL(normalized);
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();
    const segments = url.pathname.split('/').filter(Boolean);

    if (host === 'youtu.be') {
      return youtubeIdPattern.test(segments[0] || '') ? segments[0] : null;
    }

    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      const id = url.searchParams.get('v');
      if (youtubeIdPattern.test(id || '')) return id;

      const index = segments.findIndex((segment) => ['shorts', 'embed', 'live', 'v'].includes(segment));
      if (index >= 0 && youtubeIdPattern.test(segments[index + 1] || '')) {
        return segments[index + 1];
      }
    }
  } catch {
    return null;
  }

  return null;
};

const resetPlayer = () => {
  player.pause();
  player.removeAttribute('src');
  player.load();
};

const loadPlayback = async (payload) => {
  const playbackUrl = payload.url;
  if (!playbackUrl) {
    throw new Error('url not available');
  }

  resetPlayer();
  player.src = playbackUrl;
  player.load();

  titleNode.textContent = payload.title || '-';
  sourceNode.textContent = `${payload.provider || 'unknown'} / ${payload.kind || 'unknown'}`;
  finalUrlNode.textContent = playbackUrl;
  setStatus('stream loaded');

  try {
    await player.play();
  } catch {
    // Browser policy may block autoplay.
  }
};

const resolveFinalUrl = async (videoId) => {
  setStatus('resolving final url...');
  submitButton.disabled = true;

  try {
    const response = await fetch(`/api/play-url?input=${encodeURIComponent(videoId)}`, {
      headers: { accept: 'application/json' },
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `HTTP ${response.status}`);
    }

    await loadPlayback(payload);
  } finally {
    submitButton.disabled = false;
  }
};

const loadDirectUrl = async (url) => {
  resetPlayer();
  player.src = url;
  player.load();
  try {
    await player.play();
  } catch {
    // Autoplay is intentionally not forced.
  }

  titleNode.textContent = '-';
  sourceNode.textContent = 'direct url';
  finalUrlNode.textContent = url;
  setStatus('direct url loaded');
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const value = input.value.trim();
  if (!value) {
    setStatus('URL を入力してください', 'error');
    return;
  }

  const videoId = extractYouTubeVideoId(value);

  try {
    if (videoId) {
      await resolveFinalUrl(videoId);
      return;
    }

    if (isHttpUrl(value)) {
      await loadDirectUrl(value);
      return;
    }

    throw new Error('YouTube URL / 11文字ID のいずれかを入力してください');
  } catch (error) {
    setStatus(error?.message || 'load failed', 'error');
    titleNode.textContent = '-';
    sourceNode.textContent = '-';
    finalUrlNode.textContent = '-';
    resetPlayer();
  }
});
