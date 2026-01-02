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
import { TaskLinkSelector } from './task-link-selector'
import type { Priority, Recurrence, Task, TaskInstance, TaskLink, ChunkInstance } from '@/lib/store/types'
import { getSmartScheduleForTask, getCurrentTimeMinutes } from '@/lib/utils/smart-scheduling'

interface CreateTaskFormProps {
  date: string
  onSuccess: () => void
}

export function CreateTaskForm({ date, onSuccess }: CreateTaskFormProps) {
  const { schedules, tasks, addTask, addTaskInstance, addChunkInstance, addTaskLink } = useKalendarStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>(4)
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([])
  const [recurrence, setRecurrence] = useState<Recurrence>('none')
  const [chunks, setChunks] = useState<string[]>([])
  const [newChunk, setNewChunk] = useState('')
  const [linkConfig, setLinkConfig] = useState<{
    triggerTaskId: string
    delayMinutes: number
  } | null>(null)
  const [startDate, setStartDate] = useState<string>('')
  const [duration, setDuration] = useState<number>(30)

  // Only show top-level tasks (not chunks) as linkable
  const availableTasks = tasks.filter((t) => t.parentId === null)

  const handleLinkConfigChange = (config: typeof linkConfig) => {
    setLinkConfig(config)
    // Reset recurrence and schedules when link is configured
    // Linked tasks inherit trigger's recurrence and use startTime instead of schedules
    if (config) {
      setRecurrence('none')
      setSelectedScheduleIds([])
    }
  }

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

    // Require schedules only for non-linked tasks
    if (!title.trim() || (!linkConfig && selectedScheduleIds.length === 0)) {
      return
    }

    const now = new Date().toISOString()
    const taskId = uuidv4()

    // Create main task
    const task: Task = {
      id: taskId,
      title: title.trim(),
      description: description.trim() || null,
      priority,
      scheduleIds: selectedScheduleIds,
      recurrence,
      recurrenceEnd: null,
      parentId: null,
      startDate: startDate || null,
      duration,
      createdAt: now,
      updatedAt: now,
    }

    addTask(task)

    // Create chunks (always, they're part of the task template)
    chunks.forEach((chunkTitle) => {
      const chunkId = uuidv4()
      const chunk: Task = {
        id: chunkId,
        title: chunkTitle,
        description: null,
        priority: 4,
        scheduleIds: [],
        recurrence: 'none',
        recurrenceEnd: null,
        parentId: taskId,
        startDate: null,
        duration: 15,
        createdAt: now,
        updatedAt: now,
      }
      addTask(chunk)
    })

    if (linkConfig) {
      // For linked tasks: only create the link, instance is created when trigger completes
      const link: TaskLink = {
        id: uuidv4(),
        triggerTaskId: linkConfig.triggerTaskId,
        linkedTaskId: taskId,
        delayMinutes: linkConfig.delayMinutes,
        createdAt: now,
      }
      addTaskLink(link)
    } else {
      // For regular tasks: create instance with smart scheduling
      const instanceId = uuidv4()

      // Get smart schedule position
      const smartSchedule = getSmartScheduleForTask(
        task,
        schedules,
        useKalendarStore.getState().taskInstances,
        date,
        getCurrentTimeMinutes()
      )

      const instance: TaskInstance = {
        id: instanceId,
        taskId,
        date,
        completed: false,
        completedAt: null,
        startTime: smartSchedule?.startTime || null,
      }
      addTaskInstance(instance)

      // Create chunk instances for this task instance
      const allTasks = useKalendarStore.getState().tasks
      const chunkTasks = allTasks.filter((t) => t.parentId === taskId)

      chunkTasks.forEach((chunk) => {
        const chunkInstance: ChunkInstance = {
          id: uuidv4(),
          taskInstanceId: instanceId,
          chunkId: chunk.id,
          completed: false,
          completedAt: null,
        }
        addChunkInstance(chunkInstance)
      })
    }

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
        <Label htmlFor="description">Description (optional)</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details about this task"
          className="w-full min-h-[60px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-y"
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
        <Label htmlFor="startDate">Start Date (optional)</Label>
        <Input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duration (minutes)</Label>
        <Input
          id="duration"
          type="number"
          min={5}
          max={480}
          step={5}
          value={duration}
          onChange={(e) => setDuration(Math.max(5, parseInt(e.target.value) || 30))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label>Trigger After</Label>
        <TaskLinkSelector
          value={linkConfig}
          availableTasks={availableTasks}
          onChange={handleLinkConfigChange}
        />
      </div>

      {!linkConfig && (
        <>
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
        </>
      )}

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
        <Button type="submit" disabled={!title.trim() || (!linkConfig && selectedScheduleIds.length === 0)}>
          Create Task
        </Button>
      </div>
    </form>
  )
}
