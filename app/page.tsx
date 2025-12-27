import { StorageModeDialog } from './components/storage-mode-dialog'

export default function Home() {
  return (
    <main className="min-h-screen">
      <StorageModeDialog />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold">Kalendar</h1>
        {/* Calendar view will go here */}
      </div>
    </main>
  )
}
