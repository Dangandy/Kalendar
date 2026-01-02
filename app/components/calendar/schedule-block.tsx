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

  // Calculate position (midnight is the start)
  const topOffset = (startMinutes / 60) * hourHeight
  const height = (durationMinutes / 60) * hourHeight

  // Separate tasks with startTime (positioned) from those without (listed)
  const tasksWithTime: Array<{ task: Task; instance: TaskInstance; startMins: number }> = []
  const tasksWithoutTime: Array<{ task: Task; instance: TaskInstance | undefined }> = []

  tasks.forEach((task) => {
    const instance = taskInstances.find((ti) => ti.taskId === task.id && ti.startTime)
      || taskInstances.find((ti) => ti.taskId === task.id)

    if (instance?.startTime) {
      const startMins = timeToMinutes(instance.startTime)
      // Only include if within this schedule's time range
      if (startMins >= startMinutes && startMins < endMinutes) {
        tasksWithTime.push({ task, instance, startMins })
      }
    } else {
      tasksWithoutTime.push({ task, instance })
    }
  })

  // Calculate task position within schedule block
  const getTaskPosition = (taskStartMinutes: number, taskDuration: number) => {
    const offsetFromScheduleStart = taskStartMinutes - startMinutes
    const top = (offsetFromScheduleStart / 60) * hourHeight
    const taskHeight = Math.max((taskDuration / 60) * hourHeight, 40) // Minimum 40px height
    return { top, height: taskHeight }
  }

  return (
    <div
      className="absolute left-1 right-1 rounded-lg overflow-hidden"
      style={{
        top: `${topOffset}px`,
        height: `${height}px`,
        backgroundColor: `${schedule.color}20`,
        borderLeft: `3px solid ${schedule.color}`,
      }}
    >
      {/* Schedule name header */}
      <div className="sticky top-0 z-10 px-2 py-1 font-medium text-sm" style={{ color: schedule.color, backgroundColor: `${schedule.color}10` }}>
        {schedule.name}
      </div>

      {/* Positioned tasks container */}
      <div className="relative" style={{ height: `${height - 28}px` }}>
        {tasksWithTime.map(({ task, instance, startMins }) => {
          const chunks = allTasks.filter((t) => t.parentId === task.id)
          const taskChunkInstances = chunkInstances.filter((ci) => ci.taskInstanceId === instance.id)
          const { top, height: taskHeight } = getTaskPosition(startMins, task.duration || 30)

          return (
            <div
              key={task.id}
              className="absolute left-1 right-1"
              style={{ top: `${top}px`, minHeight: `${taskHeight}px` }}
            >
              <TaskItem
                task={task}
                instance={instance}
                chunks={chunks}
                chunkInstances={taskChunkInstances}
                onToggleTask={() => onToggleTask(instance.id)}
                onToggleChunk={onToggleChunk}
              />
            </div>
          )
        })}

        {/* Tasks without startTime - shown at top of schedule */}
        {tasksWithoutTime.length > 0 && (
          <div className="absolute left-1 right-1 top-0 space-y-1 p-1">
            {tasksWithoutTime.map(({ task, instance }) => {
              const chunks = allTasks.filter((t) => t.parentId === task.id)
              const taskChunkInstances = instance
                ? chunkInstances.filter((ci) => ci.taskInstanceId === instance.id)
                : []

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
        )}
      </div>
    </div>
  )
}
