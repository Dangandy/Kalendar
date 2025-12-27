'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useKalendarStore } from '@/lib/store'
import type { Priority, Recurrence, Task, TaskInstance } from '@/lib/store/types'

interface CreateTaskFormProps {
  date: string
  onSuccess: () => void
}

export function CreateTaskForm({ date, onSuccess }: CreateTaskFormProps) {
  const { schedules, addTask, addTaskInstance } = useKalendarStore()

  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>(4)
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([])
  const [recurrence, setRecurrence] = useState<Recurrence>('none')
  const [chunks, setChunks] = useState<string[]>([])
  const [newChunk, setNewChunk] = useState('')

  const handleScheduleToggle = (scheduleId: string, checked: boolean) => {
    if (checked) {
      setSelectedScheduleIds([...selectedScheduleIds, scheduleId])
    } else {
      setSelectedScheduleIds(selectedScheduleIds.filter((id) => id !== scheduleId))
    }
  }

  const handleAddChunk = () => {
    if (newChunk.trim()) {
      setChunks([...chunks, newChunk.trim()])
      setNewChunk('')
    }
  }

  const handleRemoveChunk = (index: number) => {
    setChunks(chunks.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || selectedScheduleIds.length === 0) {
      return
    }

    const now = new Date().toISOString()
    const taskId = uuidv4()

    // Create main task
    const task: Task = {
      id: taskId,
      title: title.trim(),
      description: null,
      priority,
      scheduleIds: selectedScheduleIds,
      recurrence,
      recurrenceEnd: null,
      parentId: null,
      createdAt: now,
      updatedAt: now,
    }

    addTask(task)

    // Create chunks
    chunks.forEach((chunkTitle) => {
      const chunk: Task = {
        id: uuidv4(),
        title: chunkTitle,
        description: null,
        priority: 4,
        scheduleIds: [],
        recurrence: 'none',
        recurrenceEnd: null,
        parentId: taskId,
        createdAt: now,
        updatedAt: now,
      }
      addTask(chunk)
    })

    // Create task instance for today
    const instance: TaskInstance = {
      id: uuidv4(),
      taskId,
      date,
      completed: false,
      completedAt: null,
    }

    addTaskInstance(instance)

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Task Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={priority.toString()}
          onValueChange={(v) => setPriority(parseInt(v) as Priority)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">P1 - Urgent</SelectItem>
            <SelectItem value="2">P2 - High</SelectItem>
            <SelectItem value="3">P3 - Medium</SelectItem>
            <SelectItem value="4">P4 - Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Schedules</Label>
        <div className="space-y-2">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="flex items-center gap-2">
              <Checkbox
                id={schedule.id}
                checked={selectedScheduleIds.includes(schedule.id)}
                onCheckedChange={(checked) =>
                  handleScheduleToggle(schedule.id, checked as boolean)
                }
              />
              <Label htmlFor={schedule.id} className="font-normal">
                {schedule.name} ({schedule.startTime} - {schedule.endTime})
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recurrence">Recurrence</Label>
        <Select
          value={recurrence}
          onValueChange={(v) => setRecurrence(v as Recurrence)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Sub-tasks (Chunks)</Label>
        <div className="flex gap-2">
          <Input
            value={newChunk}
            onChange={(e) => setNewChunk(e.target.value)}
            placeholder="Add sub-task"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddChunk()
              }
            }}
          />
          <Button type="button" variant="outline" onClick={handleAddChunk}>
            Add
          </Button>
        </div>
        {chunks.length > 0 && (
          <ul className="space-y-1 mt-2">
            {chunks.map((chunk, index) => (
              <li
                key={index}
                className="flex items-center justify-between bg-muted px-2 py-1 rounded"
              >
                <span className="text-sm">{chunk}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveChunk(index)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={!title.trim() || selectedScheduleIds.length === 0}>
          Create Task
        </Button>
      </div>
    </form>
  )
}
