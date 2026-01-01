import type { Task, TaskInstance, ChunkInstance, Schedule } from '@/lib/store/types'
import { timeToMinutes } from './time'

export function getTasksForSchedule(
  tasks: Task[],
  scheduleId: string
): Task[] {
  return tasks
    .filter((task) => task.parentId === null && task.scheduleIds.includes(scheduleId))
    .sort((a, b) => a.priority - b.priority)
}

export function getChunksForTask(tasks: Task[], taskId: string): Task[] {
  return tasks.filter((task) => task.parentId === taskId)
}

export function getOrCreateTaskInstance(
  taskInstances: TaskInstance[],
  taskId: string,
  date: string
): TaskInstance | undefined {
  return taskInstances.find(
    (ti) => ti.taskId === taskId && ti.date === date
  )
}

export function shouldShowTaskOnDate(
  task: Task,
  date: string,
  taskInstances: TaskInstance[]
): boolean {
  // For non-recurring tasks, show only on creation date or if not completed
  if (task.recurrence === 'none') {
    const instance = taskInstances.find(
      (ti) => ti.taskId === task.id && ti.date === date
    )
    // Show if there's an instance for this date
    return instance !== undefined
  }

  // For recurring tasks, check if this date matches the recurrence pattern
  const taskCreatedDate = new Date(task.createdAt)
  const targetDate = new Date(date)

  // Don't show before task was created
  if (targetDate < taskCreatedDate) {
    return false
  }

  // Check recurrence end
  if (task.recurrenceEnd && targetDate > new Date(task.recurrenceEnd)) {
    return false
  }

  switch (task.recurrence) {
    case 'daily':
      return true
    case 'weekly':
      return taskCreatedDate.getDay() === targetDate.getDay()
    case 'monthly':
      return taskCreatedDate.getDate() === targetDate.getDate()
    default:
      return false
  }
}

export function isTaskCompletedInAnySchedule(
  task: Task,
  date: string,
  taskInstances: TaskInstance[]
): boolean {
  const instance = taskInstances.find(
    (ti) => ti.taskId === task.id && ti.date === date
  )
  return instance?.completed ?? false
}

/**
 * Determines which schedule a task should appear in based on current time.
 * Schedules act as fallback time slots - the task appears in the first schedule
 * where the current time hasn't passed the schedule's end time.
 *
 * @param task - The task to check
 * @param schedules - All available schedules (sorted by startTime)
 * @param currentTime - Current time in HH:MM format
 * @returns The schedule ID where the task should appear, or null if no schedules
 */
export function getActiveScheduleForTask(
  task: Task,
  schedules: Schedule[],
  currentTime: string
): string | null {
  if (task.scheduleIds.length === 0) return null

  const currentMinutes = timeToMinutes(currentTime)

  // Sort schedules by start time and filter to only those the task is assigned to
  const taskSchedules = schedules
    .filter((s) => task.scheduleIds.includes(s.id))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  if (taskSchedules.length === 0) return null

  // Find the first schedule that hasn't ended yet
  for (const schedule of taskSchedules) {
    const endMinutes = timeToMinutes(schedule.endTime)
    if (currentMinutes < endMinutes) {
      return schedule.id
    }
  }

  // All schedules have passed - return the last one (overdue)
  return taskSchedules[taskSchedules.length - 1].id
}
