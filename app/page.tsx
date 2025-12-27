import { StorageModeDialog } from './components/storage-mode-dialog'
import { DayView } from './components/calendar/day-view'

export default function Home() {
  return (
    <main className="h-screen flex flex-col">
      <StorageModeDialog />
      <DayView />
    </main>
  )
}
