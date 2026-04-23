import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const config = {
  port: Number(process.env.PORT || 3000),
  proxyUrl: process.env.PROXY_URL?.trim() || '',
  ytDlpBin: process.env.YT_DLP_BIN?.trim() || '/opt/venv/bin/yt-dlp',
  requestTimeoutMs: 5_000,
  ytDlpTimeoutMs: 10_000,
  instanceBanMs: 5 * 60 * 1000,
  publicDir: path.join(rootDir, 'public'),
  rootDir,
};

export const youtubeIdPattern = /^[a-zA-Z0-9_-]{11}$/;

export const invidiousInstances = [
  'https://inv.nadeko.net',
  'https://invidious.f5.si',
  'https://invidious.lunivers.trade',
  'https://iv.melmac.space',
  'https://yt.omada.cafe',
  'https://invidious.nerdvpn.de',
  'https://invidious.tiekoetter.com',
  'https://yewtu.be',
];

export const manifestKeys = [
  'hlsManifestUrl',
  'hls_manifest_url',
  'hlsUrl',
  'hls',
  'dashManifestUrl',
  'dash_manifest_url',
  'dashUrl',
  'manifest_url',
  'manifestUrl',
];
