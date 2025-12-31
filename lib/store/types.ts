export type Priority = 1 | 2 | 3 | 4

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly'

export type StorageMode = 'local' | 'cloud'

export interface Schedule {
  id: string
  name: string
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  color: string // hex color
  isDefault: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  priority: Priority
  scheduleIds: string[]
  recurrence: Recurrence
  recurrenceEnd: string | null // ISO date
  parentId: string | null // null for top-level tasks, task id for chunks
  startDate: string | null // YYYY-MM-DD format - scheduled start date
  createdAt: string
  updatedAt: string
}

export interface TaskInstance {
  id: string
  taskId: string
  date: string // ISO date (YYYY-MM-DD)
  completed: boolean
  completedAt: string | null
  startTime?: string | null // HH:MM format for linked tasks
  triggeredByLinkId?: string | null // Which TaskLink created this instance
}

export interface TaskLink {
  id: string
  triggerTaskId: string // Task that triggers when completed
  linkedTaskId: string // Task to be scheduled
  delayMinutes: number // Minutes after completion
  createdAt: string
}

export interface ChunkInstance {
  id: string
  taskInstanceId: string
  chunkId: string
  completed: boolean
  completedAt: string | null
}
