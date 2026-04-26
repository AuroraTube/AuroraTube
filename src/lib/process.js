import { spawn } from 'node:child_process';

export const runCommand = ({
  command,
  args = [],
  timeoutMs = 0,
  cwd,
  env,
}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  let stdout = '';
  let stderr = '';
  let settled = false;

  const finalize = (fn, value) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    fn(value);
  };

  const timer = timeoutMs > 0 ? setTimeout(() => {
    child.kill('SIGKILL');
    const error = new Error(`command timed out after ${timeoutMs}ms`);
    error.code = 'ETIMEDOUT';
    finalize(reject, error);
  }, timeoutMs) : null;

  child.stdout?.on('data', (chunk) => {
    stdout += chunk.toString('utf8');
  });

  child.stderr?.on('data', (chunk) => {
    stderr += chunk.toString('utf8');
  });

  child.once('error', (error) => {
    finalize(reject, error);
  });

  child.once('close', (code, signal) => {
    if (code === 0) {
      finalize(resolve, { stdout, stderr, code, signal });
      return;
    }

    const error = new Error(stderr.trim() || `exit code ${code}${signal ? ` signal ${signal}` : ''}`);
    error.exitCode = code;
    error.signal = signal;
    error.stderr = stderr.trim();
    finalize(reject, error);
  });
});
