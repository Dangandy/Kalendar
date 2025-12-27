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
  createdAt: string
  updatedAt: string
}

export interface TaskInstance {
  id: string
  taskId: string
  date: string // ISO date (YYYY-MM-DD)
  completed: boolean
  completedAt: string | null
}

export interface ChunkInstance {
  id: string
  taskInstanceId: string
  chunkId: string
  completed: boolean
  completedAt: string | null
}
