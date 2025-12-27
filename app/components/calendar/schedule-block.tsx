'use client'

import { timeToMinutes } from '@/lib/utils/time'
import { TaskItem } from './task-item'
import type { Schedule, Task, TaskInstance, ChunkInstance } from '@/lib/store/types'

interface ScheduleBlockProps {
  schedule: Schedule
  tasks: Task[]
  allTasks: Task[] // For getting chunks
  taskInstances: TaskInstance[]
  chunkInstances: ChunkInstance[]
  onToggleTask: (taskInstanceId: string) => void
  onToggleChunk: (chunkInstanceId: string) => void
}

export function ScheduleBlock({
  schedule,
  tasks,
  allTasks,
  taskInstances,
  chunkInstances,
  onToggleTask,
  onToggleChunk,
}: ScheduleBlockProps) {
  const hourHeight = 60 // pixels per hour
  const startMinutes = timeToMinutes(schedule.startTime)
  const endMinutes = timeToMinutes(schedule.endTime)
  const durationMinutes = endMinutes - startMinutes

  // Calculate position (6 AM is the start)
  const topOffset = ((startMinutes - 6 * 60) / 60) * hourHeight
  const height = (durationMinutes / 60) * hourHeight

  return (
    <div
      className="absolute left-1 right-1 rounded-lg p-2 overflow-auto"
      style={{
        top: `${topOffset}px`,
        height: `${height}px`,
        backgroundColor: `${schedule.color}20`,
        borderLeft: `3px solid ${schedule.color}`,
      }}
    >
      <div className="font-medium text-sm mb-2" style={{ color: schedule.color }}>
        {schedule.name}
      </div>
      <div className="space-y-1">
        {tasks.map((task) => {
          const instance = taskInstances.find((ti) => ti.taskId === task.id)
          const chunks = allTasks.filter((t) => t.parentId === task.id)
          const taskChunkInstances = chunkInstances.filter(
            (ci) => chunks.some((c) => c.id === ci.chunkId)
          )

          return (
            <TaskItem
              key={task.id}
              task={task}
              instance={instance}
              chunks={chunks}
              chunkInstances={taskChunkInstances}
              onToggleTask={() => instance && onToggleTask(instance.id)}
              onToggleChunk={onToggleChunk}
            />
          )
        })}
      </div>
    </div>
  )
}
