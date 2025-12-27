import { v4 as uuidv4 } from 'uuid'
import type { Task, TaskInstance, ChunkInstance } from '@/lib/store/types'

export function ensureTaskInstancesForDate(
  date: string,
  tasks: Task[],
  existingInstances: TaskInstance[],
  addTaskInstance: (instance: TaskInstance) => void,
  addChunkInstance: (instance: ChunkInstance) => void,
  allTasks: Task[]
) {
  const targetDate = new Date(date)

  tasks.forEach((task) => {
    // Skip chunks (they're handled with parent)
    if (task.parentId !== null) return

    // Check if instance already exists for this date
    const existingInstance = existingInstances.find(
      (ti) => ti.taskId === task.id && ti.date === date
    )

    if (existingInstance) return

    // Check if task should appear on this date based on recurrence
    if (!shouldTaskAppearOnDate(task, date)) return

    // Create new instance
    const instanceId = uuidv4()
    const instance: TaskInstance = {
      id: instanceId,
      taskId: task.id,
      date,
      completed: false,
      completedAt: null,
    }

    addTaskInstance(instance)

    // Create chunk instances for this task instance
    const chunks = allTasks.filter((t) => t.parentId === task.id)
    chunks.forEach((chunk) => {
      const chunkInstance: ChunkInstance = {
        id: uuidv4(),
        taskInstanceId: instanceId,
        chunkId: chunk.id,
        completed: false,
        completedAt: null,
      }
      addChunkInstance(chunkInstance)
    })
  })
}

function shouldTaskAppearOnDate(task: Task, date: string): boolean {
  if (task.recurrence === 'none') {
    // Non-recurring tasks only show on creation date
    const createdDate = task.createdAt.split('T')[0]
    return createdDate === date
  }

  const taskCreatedDate = new Date(task.createdAt)
  const targetDate = new Date(date)

  // Reset time for comparison
  taskCreatedDate.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)

  // Don't show before task was created
  if (targetDate < taskCreatedDate) {
    return false
  }

  // Check recurrence end
  if (task.recurrenceEnd) {
    const endDate = new Date(task.recurrenceEnd)
    endDate.setHours(0, 0, 0, 0)
    if (targetDate > endDate) {
      return false
    }
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
