import { config } from '../config.js';
import { settings } from '../settings.js';
import { badRequest, unavailable } from '../lib/httpError.js';
import { isNonEmptyString } from '../lib/strings.js';
import { runCommand } from '../lib/process.js';

const DEFAULT_COMMANDS = [
  { command: '/opt/venv/bin/yt-dlp', args: [] },
  { command: 'yt-dlp', args: [] },
  { command: 'python3', args: ['-m', 'yt_dlp'] },
  { command: 'python', args: ['-m', 'yt_dlp'] },
];

const normalizeInput = (input) => {
  const value = String(input || '').trim();
  if (!value) return value;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://www.youtube.com/watch?v=${encodeURIComponent(value)}`;
};

const buildArgs = (input, { proxy } = {}) => {
  const args = ['--no-warnings', '--no-playlist', '--skip-download', '--dump-single-json'];
  if (isNonEmptyString(proxy)) {
    args.push('--proxy', proxy);
  }
  args.push(normalizeInput(input));
  return args;
};

const formatCommand = (command, args = []) => `${command}${args.length ? ` ${args.join(' ')}` : ''}`;

export const fetchYtDlpJson = async (input, { proxy = config.proxy_url, timeoutMs = settings.requestTimeoutMs } = {}) => {
  if (!isNonEmptyString(String(input || '').trim())) {
    throw badRequest('video id or url required');
  }

  const args = buildArgs(input, { proxy });
  const errors = [];

  for (const candidate of DEFAULT_COMMANDS) {
    try {
      const { stdout } = await runCommand({
        command: candidate.command,
        args: [...candidate.args, ...args],
        timeoutMs,
      });

      const data = JSON.parse(stdout || '{}');
      return {
        command: formatCommand(candidate.command, candidate.args),
        proxy: isNonEmptyString(proxy) ? proxy : '',
        data,
      };
    } catch (error) {
      errors.push(`${formatCommand(candidate.command, candidate.args)}: ${error?.message || String(error)}`);
    }
  }

  throw unavailable('yt-dlp is not available', errors);
};
