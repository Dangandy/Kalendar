'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CreateTaskForm } from './create-task-form'

interface CreateTaskDialogProps {
  date: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTaskDialog({ date, open, onOpenChange }: CreateTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <CreateTaskForm date={date} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
