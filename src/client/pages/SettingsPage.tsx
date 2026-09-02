import { useMediaProxyEnabled, setMediaProxyEnabled } from '@/lib/settings'

function ToggleSwitch({
  id,
  checked,
  onChange,
  label,
}: {
  id?: string
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-red-600' : 'bg-line',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  )
}

export function SettingsPage() {
  const mediaProxyEnabled = useMediaProxyEnabled()

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">設定</h1>

      <section className="rounded-xl border border-line bg-surface">
        <div className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0 space-y-1">
            <label htmlFor="media-proxy-toggle" className="block text-sm font-medium text-ink">
              動画・音声のメディアプロキシを使用する
            </label>
            <p className="text-sm text-muted">
              オンにすると、動画・音声の再生リクエストがサーバー側のプロキシ (
              <code className="rounded bg-chip px-1 py-0.5 text-xs">/api/media-proxy</code>
              ) を経由します。プロキシが不安定な場合はオフにすると改善することがあります。
              サムネイルなどの画像には影響しません。この設定はこの端末にのみ保存され、変更は次に再生を開始したときから反映されます。
              なお、HLS(m3u8)形式の再生はこの設定に関わらず、常にメディアプロキシを経由します。
            </p>
          </div>
          <div>
            <ToggleSwitch
              id="media-proxy-toggle"
              checked={mediaProxyEnabled}
              onChange={setMediaProxyEnabled}
              label="動画・音声のメディアプロキシを使用する"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
