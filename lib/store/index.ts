import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Schedule, Task, TaskInstance, ChunkInstance, TaskLink, StorageMode } from './types'
import { calculateLinkedTaskSchedule } from '@/lib/utils/time'

interface KalendarState {
  // Storage mode
  storageMode: StorageMode | null
  hasSeenLocalWarning: boolean

  // Data
  schedules: Schedule[]
  tasks: Task[]
  taskInstances: TaskInstance[]
  chunkInstances: ChunkInstance[]
  taskLinks: TaskLink[]

  // Actions
  setStorageMode: (mode: StorageMode) => void
  setHasSeenLocalWarning: (seen: boolean) => void

  // Schedule actions
  addSchedule: (schedule: Schedule) => void
  updateSchedule: (id: string, updates: Partial<Schedule>) => void
  deleteSchedule: (id: string) => void

  // Task actions
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void

  // Task instance actions
  addTaskInstance: (instance: TaskInstance) => void
  toggleTaskInstance: (id: string) => void

  // Chunk instance actions
  addChunkInstance: (instance: ChunkInstance) => void
  toggleChunkInstance: (id: string) => void

  // Task link actions
  addTaskLink: (link: TaskLink) => void
  deleteTaskLink: (id: string) => void
}

const DEFAULT_SCHEDULES: Schedule[] = [
  {
    id: 'default-morning',
    name: 'Morning',
    startTime: '06:00',
    endTime: '12:00',
    color: '#3b82f6', // blue
    isDefault: true,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-afternoon',
    name: 'Afternoon',
    startTime: '12:00',
    endTime: '18:00',
    color: '#f97316', // orange
    isDefault: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-evening',
    name: 'Evening',
    startTime: '18:00',
    endTime: '22:00',
    color: '#8b5cf6', // purple
    isDefault: true,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const useKalendarStore = create<KalendarState>()(
  persist(
    (set) => ({
      // Initial state
      storageMode: null,
      hasSeenLocalWarning: false,
      schedules: DEFAULT_SCHEDULES,
      tasks: [],
      taskInstances: [],
      chunkInstances: [],
      taskLinks: [],

      // Storage mode actions
      setStorageMode: (mode) => set({ storageMode: mode }),
      setHasSeenLocalWarning: (seen) => set({ hasSeenLocalWarning: seen }),

      // Schedule actions
      addSchedule: (schedule) =>
        set((state) => ({ schedules: [...state.schedules, schedule] })),
      updateSchedule: (id, updates) =>
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
          ),
        })),
      deleteSchedule: (id) =>
        set((state) => ({
          schedules: state.schedules.filter((s) => s.id !== id),
        })),

      // Task actions
      addTask: (task) =>
        set((state) => ({ tasks: [...state.tasks, task] })),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        })),
      deleteTask: (id) =>
        set((state) => ({
          // Delete task, its chunks, and associated links
          tasks: state.tasks.filter((t) => t.id !== id && t.parentId !== id),
          taskLinks: state.taskLinks.filter(
            (l) => l.triggerTaskId !== id && l.linkedTaskId !== id
          ),
        })),

      // Task instance actions
      addTaskInstance: (instance) =>
        set((state) => ({ taskInstances: [...state.taskInstances, instance] })),
      toggleTaskInstance: (id) =>
        set((state) => {
          const instance = state.taskInstances.find((ti) => ti.id === id)
          if (!instance) return state

          const isCompleting = !instance.completed
          const completedAt = isCompleting ? new Date().toISOString() : null

          const updatedInstances = state.taskInstances.map((ti) =>
            ti.id === id
              ? { ...ti, completed: isCompleting, completedAt }
              : ti
          )

          const newInstances: TaskInstance[] = []
          const newChunkInstances: ChunkInstance[] = []

          // If completing, create linked task instances
          if (isCompleting && completedAt) {
            const links = state.taskLinks.filter(
              (link) => link.triggerTaskId === instance.taskId
            )

            links.forEach((link) => {
              const { date, startTime } = calculateLinkedTaskSchedule(
                completedAt,
                link.delayMinutes
              )

              // Check if already exists
              const exists = updatedInstances.some(
                (ti) =>
                  ti.taskId === link.linkedTaskId &&
                  ti.date === date &&
                  ti.triggeredByLinkId === link.id
              )

              if (!exists) {
                const newInstanceId = uuidv4()
                newInstances.push({
                  id: newInstanceId,
                  taskId: link.linkedTaskId,
                  date,
                  completed: false,
                  completedAt: null,
                  startTime,
                  triggeredByLinkId: link.id,
                })

                // Also create chunk instances for this linked task
                const chunks = state.tasks.filter((t) => t.parentId === link.linkedTaskId)
                chunks.forEach((chunk) => {
                  newChunkInstances.push({
                    id: uuidv4(),
                    taskInstanceId: newInstanceId,
                    chunkId: chunk.id,
                    completed: false,
                    completedAt: null,
                  })
                })
              }
            })
          }

          return {
            taskInstances: [...updatedInstances, ...newInstances],
            chunkInstances: [...state.chunkInstances, ...newChunkInstances],
          }
        }),

      // Chunk instance actions
      addChunkInstance: (instance) =>
        set((state) => ({ chunkInstances: [...state.chunkInstances, instance] })),
      toggleChunkInstance: (id) =>
        set((state) => ({
          chunkInstances: state.chunkInstances.map((ci) =>
            ci.id === id
              ? {
                  ...ci,
                  completed: !ci.completed,
                  completedAt: !ci.completed ? new Date().toISOString() : null,
                }
              : ci
          ),
        })),

      // Task link actions
      addTaskLink: (link) =>
        set((state) => ({ taskLinks: [...state.taskLinks, link] })),
      deleteTaskLink: (id) =>
        set((state) => ({
          taskLinks: state.taskLinks.filter((l) => l.id !== id),
        })),
    }),
    {
      name: 'kalendar-storage',
    }
  )
)
