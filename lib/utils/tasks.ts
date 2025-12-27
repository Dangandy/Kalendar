import type { Task, TaskInstance, ChunkInstance } from '@/lib/store/types'

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
