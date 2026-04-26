import { config } from '../config.js';
import { badRequest, unavailable } from '../lib/httpError.js';
import { isNonEmptyString } from '../lib/strings.js';
import { runCommand } from '../lib/process.js';

const DEFAULT_COMMANDS = [
  { command: 'yt-dlp', args: [] },
  { command: 'python3', args: ['-m', 'yt_dlp'] },
  { command: 'python', args: ['-m', 'yt_dlp'] },
];

const splitCommands = (value) =>
  String(value || '')
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [command, ...args] = entry.split(/\s+/).filter(Boolean);
      return command ? { command, args } : null;
    })
    .filter(Boolean);

const commandCandidates = () => {
  const custom = splitCommands(process.env.YTDLP_COMMANDS);
  if (custom.length) return custom;

  const single = String(process.env.YTDLP_COMMAND || '').trim();
  if (single) return [{ command: single, args: [] }];

  return DEFAULT_COMMANDS;
};

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

export const fetchYtDlpJson = async (input, { proxy = '', timeoutMs = config.requestTimeoutMs } = {}) => {
  if (!isNonEmptyString(String(input || '').trim())) {
    throw badRequest('video id or url required');
  }

  const args = buildArgs(input, { proxy });
  const errors = [];

  for (const candidate of commandCandidates()) {
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
