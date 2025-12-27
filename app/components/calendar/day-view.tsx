'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Timeline } from './timeline'
import { ScheduleBlock } from './schedule-block'
import { CreateTaskDialog } from '../forms/create-task-dialog'
import { useKalendarStore } from '@/lib/store'
import { formatDate, formatDisplayDate } from '@/lib/utils/time'
import { getTasksForSchedule, shouldShowTaskOnDate, isTaskCompletedInAnySchedule } from '@/lib/utils/tasks'

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
  } = useKalendarStore()

  const dateStr = formatDate(currentDate)

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

  // Sort schedules by start time
  const sortedSchedules = [...schedules].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  )

  // Get tasks for each schedule, filtering by date and completion status
  const getScheduleTasks = (scheduleId: string) => {
    return getTasksForSchedule(tasks, scheduleId).filter((task) => {
      // Check if task should show on this date
      if (!shouldShowTaskOnDate(task, dateStr, taskInstances)) {
        return false
      }

      // If completed in any schedule, only show in first schedule (for reference)
      if (isTaskCompletedInAnySchedule(task, dateStr, taskInstances)) {
        // Show in first matching schedule only
        const firstScheduleId = task.scheduleIds.find((sid) =>
          sortedSchedules.some((s) => s.id === sid)
        )
        return scheduleId === firstScheduleId
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
