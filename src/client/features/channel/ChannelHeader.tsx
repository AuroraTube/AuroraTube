import { joinParts } from '@/lib/format'
import type { ChannelDetail } from '@shared/types'

export function ChannelHeader({ data }: { data: ChannelDetail }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white">
      {data.banner ? (
        <img src={data.banner} className="h-28 w-full object-cover sm:h-40 md:h-52" alt="" />
      ) : (
        <div className="h-28 w-full bg-chip sm:h-40 md:h-52" />
      )}
      <div className="p-4 sm:p-5 md:p-6">
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end">
          {data.avatar ? (
            <img
              src={data.avatar}
              className="-mt-10 h-20 w-20 shrink-0 rounded-full object-cover ring-4 ring-white sm:-mt-14 sm:h-24 sm:w-24"
              alt=""
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="-mt-10 h-20 w-20 shrink-0 rounded-full bg-[#e5e5e5] ring-4 ring-white sm:-mt-14 sm:h-24 sm:w-24" />
          )}
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl md:text-3xl">
              {data.name}
            </h1>
            <p className="text-sm text-muted">{joinParts(data.handle, data.subscribersText)}</p>
          </div>
        </div>
        {data.description ? (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {data.description}
          </p>
        ) : null}
      </div>
    </div>
  )
}
