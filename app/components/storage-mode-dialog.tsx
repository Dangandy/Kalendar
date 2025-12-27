'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useKalendarStore } from '@/lib/store'

export function StorageModeDialog() {
  const { storageMode, hasSeenLocalWarning, setStorageMode, setHasSeenLocalWarning } = useKalendarStore()
  const [showWarning, setShowWarning] = useState(false)

  // Don't show if storage mode already selected
  if (storageMode !== null) {
    return null
  }

  const handleLocalClick = () => {
    if (!hasSeenLocalWarning) {
      setShowWarning(true)
    } else {
      setStorageMode('local')
    }
  }

  const handleConfirmLocal = () => {
    setHasSeenLocalWarning(true)
    setStorageMode('local')
    setShowWarning(false)
  }

  if (showWarning) {
    return (
      <Dialog open={true}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Local Storage Warning</DialogTitle>
            <DialogDescription className="pt-4 space-y-2">
              <p>
                Your data will be stored locally in your browser. This means:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Data may be deleted if you clear browser data</li>
                <li>Data is not synced across devices</li>
                <li>Data cannot be recovered if lost</li>
              </ul>
              <p className="pt-2">
                You can upgrade to cloud storage later to sync your data.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowWarning(false)}>
              Go Back
            </Button>
            <Button onClick={handleConfirmLocal}>
              I Understand, Use Local
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Kalendar</DialogTitle>
          <DialogDescription className="pt-2">
            Choose how you want to store your data.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 pt-4">
          <Button
            variant="outline"
            className="h-auto flex flex-col items-start p-4 text-left"
            onClick={handleLocalClick}
          >
            <span className="font-semibold">Local Storage</span>
            <span className="text-sm text-muted-foreground">
              Store data in your browser. No account needed.
            </span>
          </Button>
          <Button
            className="h-auto flex flex-col items-start p-4 text-left"
            onClick={() => setStorageMode('cloud')}
          >
            <span className="font-semibold">Cloud Storage</span>
            <span className="text-sm text-muted-foreground">
              Sync across devices. Requires account.
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
