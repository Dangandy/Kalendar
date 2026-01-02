'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Timeline } from './timeline'
import { ScheduleBlock } from './schedule-block'
import { CreateTaskDialog } from '../forms/create-task-dialog'
import { useKalendarStore } from '@/lib/store'
import { formatDate, formatDisplayDate, timeToMinutes } from '@/lib/utils/time'
import { getTasksForSchedule, getActiveScheduleForTask } from '@/lib/utils/tasks'
import { ensureTaskInstancesForDate } from '@/lib/utils/recurrence'

export function DayView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const {
    schedules,
    tasks,
    taskInstances,
    chunkInstances,
    toggleTaskInstance,
    toggleChunkInstance,
    addTaskInstance,
    addChunkInstance,
    rescheduleTasks,
  } = useKalendarStore()

  const dateStr = formatDate(currentDate)

  // Ensure task instances exist for current date
  useEffect(() => {
    ensureTaskInstancesForDate(
      dateStr,
      tasks,
      taskInstances,
      addTaskInstance,
      addChunkInstance,
      tasks
    )
  }, [dateStr, tasks, taskInstances, addTaskInstance, addChunkInstance])

  const goToPreviousDay = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() - 1)
      return newDate
    })
  }

  const goToNextDay = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() + 1)
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleReschedule = () => {
    rescheduleTasks(dateStr)
  }

  const getCurrentTime = (): string => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  // Sort schedules by start time
  const sortedSchedules = [...schedules].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  )

  // Check if a startTime falls within a schedule's time range
  const isTimeInSchedule = (startTime: string, schedule: { startTime: string; endTime: string }) => {
    const time = timeToMinutes(startTime)
    const scheduleStart = timeToMinutes(schedule.startTime)
    const scheduleEnd = timeToMinutes(schedule.endTime)
    return time >= scheduleStart && time < scheduleEnd
  }

  // Get tasks for each schedule, filtering by date
  const getScheduleTasks = (scheduleId: string) => {
    const schedule = sortedSchedules.find((s) => s.id === scheduleId)
    if (!schedule) return []

    const currentTime = getCurrentTime()
    const today = formatDate(new Date())
    const isToday = dateStr === today

    // Get regular tasks assigned to this schedule
    const scheduleTasks = getTasksForSchedule(tasks, scheduleId)

    // Also find linked tasks (with startTime) that should appear in this schedule
    const linkedTasks = tasks.filter((task) => {
      if (task.parentId !== null) return false // Skip chunks

      // Look specifically for an instance WITH startTime (triggered by a link)
      const instance = taskInstances.find(
        (ti) => ti.taskId === task.id && ti.date === dateStr && ti.startTime
      )

      if (!instance) return false

      // Check if already in regular scheduleTasks (don't duplicate)
      if (scheduleTasks.some((t) => t.id === task.id)) return false

      // Check if the startTime falls within this schedule
      const inSchedule = isTimeInSchedule(instance.startTime!, schedule)
      console.log('[DayView] Linked task candidate:', task.title, '| startTime:', instance.startTime, '| schedule:', schedule.name, '| inSchedule:', inSchedule, '| completed:', instance.completed)
      return inSchedule
    })

    const allTasks = [...scheduleTasks, ...linkedTasks]

    return allTasks.filter((task) => {
      // Check if there's an instance for this date
      // Prefer instance with startTime (for linked tasks that may have duplicate instances)
      const instance = taskInstances.find(
        (ti) => ti.taskId === task.id && ti.date === dateStr && ti.startTime
      ) || taskInstances.find(
        (ti) => ti.taskId === task.id && ti.date === dateStr
      )

      if (!instance) return false

      // For linked tasks (with startTime), always show in the schedule matching their startTime
      // This takes priority over both completion status and cascading logic
      if (instance.startTime) {
        return isTimeInSchedule(instance.startTime, schedule)
      }

      // If completed (non-linked), only show in first schedule
      if (instance.completed) {
        const firstScheduleId = task.scheduleIds.find((sid) =>
          sortedSchedules.some((s) => s.id === sid)
        )
        return scheduleId === firstScheduleId
      }

      // For multi-schedule tasks, apply cascading logic only for today
      if (task.scheduleIds.length > 1) {
        if (isToday) {
          // Today: show in active schedule based on current time
          const activeScheduleId = getActiveScheduleForTask(task, sortedSchedules, currentTime)
          if (scheduleId !== activeScheduleId) {
            return false
          }
        } else {
          // Past/Future days: show in first schedule only
          const firstScheduleId = task.scheduleIds.find((sid) =>
            sortedSchedules.some((s) => s.id === sid)
          )
          if (scheduleId !== firstScheduleId) {
            return false
          }
        }
      }

      return true
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleReschedule}
            title="Reschedule tasks to current time"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-xl font-semibold">
          {formatDisplayDate(currentDate)}
        </h2>
        <CreateTaskDialog
          date={dateStr}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </div>

      {/* Timeline */}
      <Timeline>
        {sortedSchedules.map((schedule) => (
          <ScheduleBlock
            key={schedule.id}
            schedule={schedule}
            tasks={getScheduleTasks(schedule.id)}
            allTasks={tasks}
            taskInstances={taskInstances.filter((ti) => ti.date === dateStr)}
            chunkInstances={chunkInstances}
            onToggleTask={toggleTaskInstance}
            onToggleChunk={toggleChunkInstance}
          />
        ))}
      </Timeline>
    </div>
  )
}
