
const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3];

const formatTime = (seconds) => {
  const total = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : `${minutes}:${String(secs).padStart(2, '0')}`;
};

const escapeAttr = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const sanitizeVariantKey = (variant = {}) => String(variant.key || variant.label || variant.url || '').trim();

const renderQualityOptions = (variants = []) => {
  const list = Array.isArray(variants) ? variants : [];
  if (list.length <= 1) return '';
  return `
    <label class="player-speed-label player-quality-label">
      <span>画質</span>
      <select class="player-select" data-player-quality aria-label="画質">
        ${list.map((variant) => `
          <option value="${escapeAttr(sanitizeVariantKey(variant))}" data-url="${escapeAttr(variant.url || '')}"${variant.selected ? ' selected' : ''}>${escapeAttr(variant.label || '自動')}</option>
        `).join('')}
      </select>
    </label>
  `;
};

export const playerMarkup = ({
  videoId = '',
  poster = '',
  short = false,
  playback = {},
} = {}) => {
  const safeVideoId = String(videoId || '').trim();
  const selectedUrl = String(playback.playUrl || playback.streamUrl || '').trim();
  const downloadUrl = String(playback.downloadUrl || selectedUrl || '').trim();
  const variants = Array.isArray(playback.variants) ? playback.variants : [];
  const qualityKey = String(playback.selectedQuality || (variants.find((variant) => variant.selected)?.key || 'auto')).trim() || 'auto';
  const proxy = Boolean(playback.proxy);
  const warning = String(playback.warning || '');
  const proxyLabel = proxy ? 'PROXY' : 'DIRECT';

  return `
    <section class="player-frame player-shell ${short ? 'player-frame-short player-shell-short' : ''}" data-player data-video-id="${escapeAttr(safeVideoId)}" data-playback-url="${escapeAttr(selectedUrl)}" data-download-url="${escapeAttr(downloadUrl)}" data-quality="${escapeAttr(qualityKey)}">
      <div class="player-stage">
        <video class="player-video" playsinline preload="metadata"${poster ? ` poster="${escapeAttr(poster)}"` : ''} src="${escapeAttr(selectedUrl)}"></video>
        <div class="player-overlay"></div>
        <button class="player-center" type="button" data-player-play aria-label="再生/一時停止">▶</button>
        <div class="player-badges">
          <span class="player-badge ${proxy ? 'player-badge-proxy' : 'player-badge-direct'}">${proxyLabel}</span>
          ${warning ? `<span class="player-badge player-badge-warning">${escapeAttr(warning)}</span>` : ''}
        </div>
      </div>

      <div class="player-controls">
        <div class="player-row player-row-main">
          <button class="player-icon-button player-icon-button-primary" type="button" data-player-play-toggle aria-label="再生/一時停止">再生</button>
          <div class="player-progress-wrap">
            <input class="player-progress" type="range" min="0" max="1000" value="0" step="1" data-player-progress aria-label="再生位置" />
          </div>
          <span class="player-time" data-player-time>0:00 / 0:00</span>
        </div>

        <div class="player-row player-row-secondary">
          <button class="player-icon-button" type="button" data-player-mute aria-label="ミュート">音量</button>
          <input class="player-volume" type="range" min="0" max="1" value="1" step="0.05" data-player-volume aria-label="音量" />
          ${renderQualityOptions(variants)}
          <label class="player-speed-label">
            <span>速度</span>
            <select class="player-select" data-player-speed aria-label="再生速度">
              ${SPEEDS.map((speed) => `<option value="${speed}"${speed === 1 ? ' selected' : ''}>${speed}x</option>`).join('')}
            </select>
          </label>
          <a class="player-icon-button" data-player-download href="${escapeAttr(downloadUrl)}" download>DL</a>
          <button class="player-icon-button" type="button" data-player-fullscreen aria-label="全画面">全画面</button>
        </div>
      </div>
    </section>
  `;
};

const updateWatchQuery = (videoId, quality) => {
  if (!videoId) return;
  const url = new URL(window.location.href);
  const isShorts = url.pathname.startsWith('/shorts/');
  url.pathname = isShorts ? url.pathname : '/watch';
  if (!isShorts) {
    url.searchParams.set('v', videoId);
  }
  if (quality && quality !== 'auto') url.searchParams.set('quality', quality);
  else url.searchParams.delete('quality');
  history.replaceState({}, '', `${url.pathname}${url.search}`);
};

const syncState = (root) => {
  const video = root.querySelector('.player-video');
  const playToggle = root.querySelector('[data-player-play-toggle]');
  const playCenter = root.querySelector('[data-player-play]');
  const progress = root.querySelector('[data-player-progress]');
  const time = root.querySelector('[data-player-time]');
  const mute = root.querySelector('[data-player-mute]');
  const volume = root.querySelector('[data-player-volume]');
  const speed = root.querySelector('[data-player-speed]');
  const quality = root.querySelector('[data-player-quality]');
  const download = root.querySelector('[data-player-download]');
  const fullscreen = root.querySelector('[data-player-fullscreen]');
  const videoId = root.dataset.videoId || '';

  if (!video || root.dataset.playerMounted === 'true') return;
  root.dataset.playerMounted = 'true';

  let pendingSeek = null;
  let desiredPlay = false;

  const updateTime = () => {
    const current = formatTime(video.currentTime || 0);
    const duration = Number.isFinite(video.duration) ? formatTime(video.duration) : '0:00';
    if (time) time.textContent = `${current} / ${duration}`;
    if (progress && Number.isFinite(video.duration) && video.duration > 0) {
      progress.value = String(Math.round((video.currentTime / video.duration) * 1000));
    }
  };

  const updatePlayState = () => {
    const playing = !video.paused && !video.ended;
    if (playToggle) playToggle.textContent = playing ? '一時停止' : '再生';
    if (playCenter) {
      playCenter.textContent = playing ? '❚❚' : '▶';
      playCenter.hidden = playing;
    }
    desiredPlay = playing;
  };

  const updateMuteState = () => {
    if (!mute) return;
    mute.textContent = video.muted || video.volume === 0 ? 'ミュート' : '音量';
  };

  const updateVolumeState = () => {
    if (volume) volume.value = String(video.muted ? 0 : video.volume);
    updateMuteState();
  };

  const updateQualityState = (value) => {
    if (!quality) return;
    quality.value = value;
    root.dataset.quality = value;
    updateWatchQuery(videoId, value);
  };

  const changeSource = async (url, selectedQuality = 'auto') => {
    updateQualityState(selectedQuality);
    if (download) download.href = url || download.getAttribute('href') || '#';

    if (!url || video.src === url) {
      return;
    }

    pendingSeek = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    desiredPlay = !video.paused && !video.ended;
    video.pause();
    video.src = url;
    video.load();

    const restore = async () => {
      if (pendingSeek !== null && Number.isFinite(pendingSeek)) {
        try {
          video.currentTime = pendingSeek;
        } catch {
          // ignore seek restoration failures
        }
      }
      pendingSeek = null;
      if (desiredPlay) {
        try {
          await video.play();
        } catch {
          // autoplay/network failures are acceptable here
        }
      }
      video.removeEventListener('loadedmetadata', restore);
    };

    video.addEventListener('loadedmetadata', restore);
  };

  const togglePlay = async () => {
    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch {
      // ignore playback errors caused by autoplay policy or network issues
    }
  };

  playToggle?.addEventListener('click', togglePlay);
  playCenter?.addEventListener('click', togglePlay);

  progress?.addEventListener('input', () => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    const ratio = Number(progress.value || 0) / 1000;
    video.currentTime = ratio * video.duration;
    updateTime();
  });

  volume?.addEventListener('input', () => {
    const value = Number(volume.value || 0);
    video.volume = Math.min(1, Math.max(0, value));
    video.muted = video.volume === 0;
    updateVolumeState();
  });

  mute?.addEventListener('click', () => {
    video.muted = !video.muted;
    if (!video.muted && Number(volume?.value || 0) === 0) {
      video.volume = 0.5;
      if (volume) volume.value = '0.5';
    }
    updateVolumeState();
  });

  speed?.addEventListener('change', () => {
    const value = Number(speed.value || 1);
    video.playbackRate = SPEEDS.includes(value) ? value : 1;
  });

  quality?.addEventListener('change', () => {
    const option = quality.selectedOptions?.[0];
    const selectedQuality = String(quality.value || 'auto').trim() || 'auto';
    const nextUrl = option?.dataset?.url || '';
    changeSource(nextUrl, selectedQuality);
  });

  download?.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.href = download.getAttribute('href') || '#';
  });

  fullscreen?.addEventListener('click', async () => {
    try {
      const target = root.querySelector('.player-stage') || root;
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
        return;
      }
      await target.requestFullscreen?.();
    } catch {
      // ignore fullscreen errors
    }
  });

  video.addEventListener('loadedmetadata', updateTime);
  video.addEventListener('timeupdate', updateTime);
  video.addEventListener('durationchange', updateTime);
  video.addEventListener('play', updatePlayState);
  video.addEventListener('pause', updatePlayState);
  video.addEventListener('ended', updatePlayState);
  video.addEventListener('volumechange', updateVolumeState);
  video.addEventListener('ratechange', () => {
    if (speed) speed.value = String(video.playbackRate || 1);
  });

  updateTime();
  updatePlayState();
  updateVolumeState();
  if (speed) speed.value = String(video.playbackRate || 1);
  if (quality) updateQualityState(quality.value || 'auto');
};

export const bindPlayers = () => {
  document.querySelectorAll('[data-player]').forEach((root) => syncState(root));
};
