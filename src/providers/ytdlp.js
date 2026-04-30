import { config } from '../config.js';
import { badRequest, unavailable } from '../lib/httpError.js';
import { isNonEmptyString } from '../lib/strings.js';
import { runCommand } from '../lib/process.js';

const readCandidate = (value) => String(value || '').trim();

const buildCommandList = () => {
  const envCandidates = [
    readCandidate(process.env.YTDLP_BIN),
    readCandidate(process.env.YTDLP_COMMAND),
  ].filter(Boolean).map((command) => ({ command, args: [] }));

  return [
    ...envCandidates,
    { command: 'yt-dlp', args: [] },
    { command: 'python3', args: ['-m', 'yt_dlp'] },
    { command: 'python', args: ['-m', 'yt_dlp'] },
  ];
};

const DEFAULT_COMMANDS = buildCommandList();

const normalizeInput = (input) => {
  const value = String(input || '').trim();
  if (!value) return value;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://www.youtube.com/watch?v=${encodeURIComponent(value)}`;
};

const buildArgs = (input, { proxy } = {}) => {
  const args = [
    '--no-warnings',
    '--no-playlist',
    '--skip-download',
    '--dump-single-json',
    '--no-progress',
    '--no-color',
    '--socket-timeout',
    String(Math.max(1, Math.ceil(Number(config.requestTimeoutMs || 8000) / 1000))),
    '--extractor-retries',
    '2',
    '--fragment-retries',
    '2',
  ];
  if (isNonEmptyString(proxy)) {
    args.push('--proxy', proxy);
  }
  args.push(normalizeInput(input));
  return args;
};

const formatCommand = (command, args = []) => `${command}${args.length ? ` ${args.join(' ')}` : ''}`;

export const fetchYtDlpJson = async (input, { proxy = '', timeoutMs = config.requestTimeoutMs } = {}) => {
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
