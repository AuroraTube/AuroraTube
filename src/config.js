import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const parsePositiveInt = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

const splitList = (value) =>
  String(value || '')
    .split(',')
    .map((entry) => normalizeBaseUrl(entry))
    .filter(Boolean);

export const config = {
  appName: 'AuroraTube',
  port: parsePositiveInt(process.env.PORT, 3000),
  requestTimeoutMs: parsePositiveInt(process.env.REQUEST_TIMEOUT_MS, 8000),
  region: String(process.env.INVIDIOUS_REGION || 'US').trim().toUpperCase() || 'US',
  hl: String(process.env.INVIDIOUS_HL || 'ja').trim() || 'ja',
  publicDir: path.join(rootDir, 'public'),
  rootDir,
  invidiousInstances:
  [
    'https://inv.nadeko.net',
    'https://invidious.f5.si',
    'https://invidious.lunivers.trade',
    'https://iv.melmac.space',
    'https://yt.omada.cafe',
    'https://invidious.nerdvpn.de',
    'https://invidious.tiekoetter.com',
    'https://yewtu.be',
  ],
};

export const youtubeIdPattern = /^[a-zA-Z0-9_-]{11}$/;
