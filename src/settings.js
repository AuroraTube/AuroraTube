import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const settings = {
  appName: 'AuroraTube',
  publicDir: path.join(rootDir, 'public'),
  requestTimeoutMs: 8000,
  region: 'US',
  hl: 'ja',
  invidiousInstances: [
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
