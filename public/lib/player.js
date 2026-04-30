import { escapeHtml } from './format.js';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const normalizeUrl = (value, fallback = '') => {
  const text = String(value || '').trim();
  if (text) return text;
  return fallback;
};

const buildPlayerLabel = (playback = {}) => {
  const parts = [];
  if (playback.kind) parts.push(String(playback.kind));
  if (playback.proxy) parts.push('proxy');
  if (!parts.length) parts.push('player');
  return parts.join(' · ');
};

export const playerMarkup = ({ videoId, poster, short = false, playback = {} }) => {
  const safeVideoId = String(videoId || '').trim();
  const streamUrl = normalizeUrl(playback.streamUrl || playback.playUrl, safeVideoId ? `/api/watch/${encodeURIComponent(safeVideoId)}/stream` : '');
  const downloadUrl = normalizeUrl(playback.downloadUrl, safeVideoId ? `/api/watch/${encodeURIComponent(safeVideoId)}/download` : '');
  const finalUrl = normalizeUrl(playback.finalUrl, playback.sourceUrl || '');
  const warning = String(playback.warning || '');
  const sourceLabel = buildPlayerLabel(playback);

  return `
    <section class="player-frame player-shell ${short ? 'player-frame-short player-shell-short' : ''}" data-player data-video-id="${escapeHtml(safeVideoId)}" data-stream-url="${escapeHtml(streamUrl)}" data-download-url="${escapeHtml(downloadUrl)}" data-final-url="${escapeHtml(finalUrl)}">
      <div class="player-stage">
        <video class="player-video" playsinline preload="metadata" controlslist="nodownload noplaybackrate"${poster ? ` poster="${escapeHtml(poster)}"` : ''} src="${escapeHtml(streamUrl)}"></video>
        <button class="player-center" type="button" data-player-play aria-label="再生">▶</button>
        <div class="player-overlay"></div>
        <div class="player-badges">
          <span class="player-badge player-badge-direct">${escapeHtml(sourceLabel)}</span>
          ${warning ? `<span class="player-badge player-badge-warning">${escapeHtml(warning)}</span>` : ''}
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
          <label class="player-speed-label">
            <span>速度</span>
            <select class="player-select" data-player-speed aria-label="再生速度">
              ${SPEEDS.map((speed) => `<option value="${speed}"${speed === 1 ? ' selected' : ''}>${speed}x</option>`).join('')}
            </select>
          </label>
          <a class="player-icon-button" data-player-download href="${escapeHtml(downloadUrl)}" download>ダウンロード</a>
          <button class="player-icon-button" type="button" data-player-fullscreen aria-label="全画面">全画面</button>
        </div>

        <div class="player-status" data-player-status hidden></div>
      </div>
    </section>
  `;
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
  const download = root.querySelector('[data-player-download]');
  const fullscreen = root.querySelector('[data-player-fullscreen]');
  const status = root.querySelector('[data-player-status]');

  if (!video || root.dataset.playerMounted === 'true') return;
  root.dataset.playerMounted = 'true';

  const setStatus = (message = '', visible = false) => {
    if (!status) return;
    status.hidden = !visible;
    status.textContent = message;
  };

  const updateTime = () => {
    const current = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const currentText = formatTime(current);
    const durationText = formatTime(duration);
    if (time) time.textContent = `${currentText} / ${durationText}`;
    if (progress && duration > 0) {
      progress.value = String(Math.round((current / duration) * 1000));
    }
  };

  const updatePlayState = () => {
    const playing = !video.paused && !video.ended;
    if (playToggle) playToggle.textContent = playing ? '一時停止' : '再生';
    if (playCenter) {
      playCenter.textContent = playing ? '❚❚' : '▶';
      playCenter.hidden = playing;
    }
  };

  const updateMuteState = () => {
    if (!mute) return;
    mute.textContent = video.muted || video.volume === 0 ? 'ミュート' : '音量';
  };

  const updateVolumeState = () => {
    if (volume) volume.value = String(video.muted ? 0 : video.volume);
    updateMuteState();
  };

  const togglePlay = async () => {
    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch {
      setStatus('再生を開始できませんでした', true);
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

  fullscreen?.addEventListener('click', async () => {
    try {
      const target = root.querySelector('.player-stage') || root;
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
        return;
      }
      await target.requestFullscreen?.();
    } catch {
      setStatus('全画面表示を開始できませんでした', true);
    }
  });

  const clearStatus = () => setStatus('', false);
  const showBuffering = () => setStatus('読み込み中…', true);
  const showError = () => setStatus('再生できませんでした', true);

  video.addEventListener('loadedmetadata', () => {
    clearStatus();
    updateTime();
  });
  video.addEventListener('timeupdate', updateTime);
  video.addEventListener('durationchange', updateTime);
  video.addEventListener('play', () => {
    clearStatus();
    updatePlayState();
  });
  video.addEventListener('pause', updatePlayState);
  video.addEventListener('ended', updatePlayState);
  video.addEventListener('volumechange', updateVolumeState);
  video.addEventListener('ratechange', () => {
    if (speed) speed.value = String(video.playbackRate || 1);
  });
  video.addEventListener('waiting', showBuffering);
  video.addEventListener('stalled', showBuffering);
  video.addEventListener('canplay', clearStatus);
  video.addEventListener('error', showError);

  const downloadHref = download?.getAttribute('href') || '';
  if (download && !downloadHref && root.dataset.downloadUrl) {
    download.setAttribute('href', root.dataset.downloadUrl);
  }

  updateTime();
  updatePlayState();
  updateVolumeState();
  if (speed) speed.value = String(video.playbackRate || 1);
};

const formatTime = (seconds) => {
  const total = Number(seconds || 0);
  if (!Number.isFinite(total) || total <= 0) return '0:00';
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : `${minutes}:${String(secs).padStart(2, '0')}`;
};

export const bindPlayers = () => {
  document.querySelectorAll('[data-player]').forEach((root) => syncState(root));
};
