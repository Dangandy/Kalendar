import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Schedule, Task, TaskInstance, ChunkInstance, StorageMode } from './types'

interface KalendarState {
  // Storage mode
  storageMode: StorageMode | null
  hasSeenLocalWarning: boolean

  // Data
  schedules: Schedule[]
  tasks: Task[]
  taskInstances: TaskInstance[]
  chunkInstances: ChunkInstance[]

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
          // Delete task and its chunks
          tasks: state.tasks.filter((t) => t.id !== id && t.parentId !== id),
        })),

      // Task instance actions
      addTaskInstance: (instance) =>
        set((state) => ({ taskInstances: [...state.taskInstances, instance] })),
      toggleTaskInstance: (id) =>
        set((state) => ({
          taskInstances: state.taskInstances.map((ti) =>
            ti.id === id
              ? {
                  ...ti,
                  completed: !ti.completed,
                  completedAt: !ti.completed ? new Date().toISOString() : null,
                }
              : ti
          ),
        })),

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
    }),
    {
      name: 'kalendar-storage',
    }
  )
)
