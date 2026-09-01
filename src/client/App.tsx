import { Route, Routes } from 'react-router-dom'
import { Shell } from '@/shell'
import { HomePage } from '@/pages/HomePage'
import { SearchPage } from '@/features/search'
import { WatchPage } from '@/features/watch'
import { ChannelPage } from '@/features/channel'
import { PlaylistPage } from '@/pages/PlaylistPage'
import { TrendingPage } from '@/pages/TrendingPage'
import { HealthPage } from '@/pages/HealthPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { NotFound } from '@/pages/NotFound'

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/watch/:videoId" element={<WatchPage />} />
        <Route path="/channel/:channelId" element={<ChannelPage />} />
        <Route path="/playlist/:playlistId" element={<PlaylistPage />} />
        <Route path="/trending" element={<TrendingPage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Shell>
  )
}
