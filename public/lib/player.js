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

export const playerMarkup = ({
  videoId = '',
  poster = '',
  short = false,
  playback = {},
} = {}) => {
  const safeVideoId = escapeAttr(videoId);
  const playbackUrl = playback.playUrl || playback.streamUrl || (safeVideoId ? `/api/watch/${encodeURIComponent(videoId)}/stream` : '');
  const downloadUrl = safeVideoId ? `/api/watch/${encodeURIComponent(videoId)}/download` : playbackUrl;
  const finalUrl = playback.finalUrl || '';
  const proxy = Boolean(playback.proxy);
  const warning = String(playback.warning || '');
  const proxyLabel = proxy ? 'PROXY' : 'DIRECT';

  return `
    <section class="player-frame player-shell ${short ? 'player-frame-short player-shell-short' : ''}" data-player data-video-id="${safeVideoId}" data-playback-url="${escapeAttr(playbackUrl)}" data-final-url="${escapeAttr(finalUrl)}" data-proxy="${proxy ? 'true' : 'false'}" data-warning="${escapeAttr(warning)}">
      <div class="player-stage">
        <video class="player-video" playsinline preload="metadata"${poster ? ` poster="${escapeAttr(poster)}"` : ''} src="${escapeAttr(playbackUrl)}"></video>
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

  if (!video || root.dataset.playerMounted === 'true') return;
  root.dataset.playerMounted = 'true';

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
};

export const bindPlayers = () => {
  document.querySelectorAll('[data-player]').forEach((root) => syncState(root));
};
