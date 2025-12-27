# Kalendar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a task-based calendar app with scheduled time windows, priorities, recurring tasks, and local/cloud storage.

**Architecture:** Next.js 16 App Router with Zustand for state management. Supabase for cloud auth/storage. Tasks belong to named schedules (time blocks), support P1-P4 priorities, optional sub-tasks (chunks), and daily/weekly/monthly recurrence.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Zustand v5, Supabase (@supabase/ssr)

---

## Task 1: Project Setup

**Files:**
- Create: Project root with Next.js 16
- Create: `.env.local` (gitignored)
- Create: `.env.example`

**Step 1: Create Next.js 16 project**

Run:
```bash
cd /Users/macbook/Desktop/Projects/Kalendar
npx create-next-app@latest . --typescript --tailwind --eslint --app --turbopack --yes
```

Expected: Project scaffolded with Next.js 16, TypeScript, Tailwind v4, ESLint, App Router, Turbopack.

**Step 2: Verify project runs**

Run:
```bash
npm run dev
```

Expected: Dev server starts at http://localhost:3000

**Step 3: Create environment files**

Create `.env.example`:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Create `.env.local` with same structure (will add real values later).

**Step 4: Update .gitignore**

Ensure `.env.local` is in `.gitignore` (should be by default).

**Step 5: Commit**

```bash
git add .
git commit -m "chore: initialize Next.js 16 project with Tailwind and TypeScript"
```

---

## Task 2: Install shadcn/ui

**Files:**
- Modify: `package.json`
- Create: `components/ui/` directory
- Create: `lib/utils.ts`

**Step 1: Initialize shadcn**

Run:
```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

**Step 2: Add essential components**

Run:
```bash
npx shadcn@latest add button dialog input label select checkbox card badge
```

**Step 3: Verify components installed**

Check that `components/ui/` contains the added components.

**Step 4: Commit**

```bash
git add .
git commit -m "chore: add shadcn/ui with essential components"
```

---

## Task 3: Install and Configure Zustand

**Files:**
- Create: `lib/store/index.ts`
- Create: `lib/store/types.ts`
- Modify: `package.json`

**Step 1: Install Zustand**

Run:
```bash
npm install zustand
```

**Step 2: Create type definitions**

Create `lib/store/types.ts`:
```typescript
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
```

**Step 3: Create store with localStorage persistence**

Create `lib/store/index.ts`:
```typescript
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
          tasks: state.tasks.filter((t) => t.id !== id),
          // Also delete chunks of this task
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
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add Zustand store with types and localStorage persistence"
```

---

## Task 4: Setup Supabase

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware.ts`
- Create: `middleware.ts`
- Modify: `package.json`
- Modify: `.env.local`

**Step 1: Install Supabase packages**

Run:
```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Step 2: Create browser client**

Create `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 3: Create server client**

Create `lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  )
}
```

**Step 4: Create middleware helper**

Create `lib/supabase/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  await supabase.auth.getUser()

  return supabaseResponse
}
```

**Step 5: Create middleware**

Create `middleware.ts` at project root:
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add Supabase client setup with SSR support"
```

---

## Task 5: Create Storage Mode Selection Screen

**Files:**
- Modify: `app/page.tsx`
- Create: `app/components/storage-mode-dialog.tsx`

**Step 1: Create storage mode dialog component**

Create `app/components/storage-mode-dialog.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useKalendarStore } from '@/lib/store'

export function StorageModeDialog() {
  const { storageMode, hasSeenLocalWarning, setStorageMode, setHasSeenLocalWarning } = useKalendarStore()
  const [showWarning, setShowWarning] = useState(false)

  // Don't show if storage mode already selected
  if (storageMode !== null) {
    return null
  }

  const handleLocalClick = () => {
    if (!hasSeenLocalWarning) {
      setShowWarning(true)
    } else {
      setStorageMode('local')
    }
  }

  const handleConfirmLocal = () => {
    setHasSeenLocalWarning(true)
    setStorageMode('local')
    setShowWarning(false)
  }

  if (showWarning) {
    return (
      <Dialog open={true}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Local Storage Warning</DialogTitle>
            <DialogDescription className="pt-4 space-y-2">
              <p>
                Your data will be stored locally in your browser. This means:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Data may be deleted if you clear browser data</li>
                <li>Data is not synced across devices</li>
                <li>Data cannot be recovered if lost</li>
              </ul>
              <p className="pt-2">
                You can upgrade to cloud storage later to sync your data.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowWarning(false)}>
              Go Back
            </Button>
            <Button onClick={handleConfirmLocal}>
              I Understand, Use Local
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Kalendar</DialogTitle>
          <DialogDescription className="pt-2">
            Choose how you want to store your data.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 pt-4">
          <Button
            variant="outline"
            className="h-auto flex flex-col items-start p-4 text-left"
            onClick={handleLocalClick}
          >
            <span className="font-semibold">Local Storage</span>
            <span className="text-sm text-muted-foreground">
              Store data in your browser. No account needed.
            </span>
          </Button>
          <Button
            className="h-auto flex flex-col items-start p-4 text-left"
            onClick={() => setStorageMode('cloud')}
          >
            <span className="font-semibold">Cloud Storage</span>
            <span className="text-sm text-muted-foreground">
              Sync across devices. Requires account.
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Update main page**

Modify `app/page.tsx`:
```typescript
import { StorageModeDialog } from './components/storage-mode-dialog'

export default function Home() {
  return (
    <main className="min-h-screen">
      <StorageModeDialog />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold">Kalendar</h1>
        {/* Calendar view will go here */}
      </div>
    </main>
  )
}
```

**Step 3: Verify dialog appears**

Run dev server and check that the storage mode dialog appears on first load.

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add storage mode selection dialog with local warning"
```

---

## Task 6: Create Day View Layout

**Files:**
- Create: `app/components/calendar/day-view.tsx`
- Create: `app/components/calendar/schedule-block.tsx`
- Create: `app/components/calendar/timeline.tsx`
- Create: `lib/utils/time.ts`

**Step 1: Create time utilities**

Create `lib/utils/time.ts`:
```typescript
export function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number)
  return { hours, minutes }
}

export function formatTime(hours: number, minutes: number = 0): string {
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  const displayMinutes = minutes.toString().padStart(2, '0')
  return `${displayHours}:${displayMinutes} ${period}`
}

export function timeToMinutes(time: string): number {
  const { hours, minutes } = parseTime(time)
  return hours * 60 + minutes
}

export function getTimelineHours(): number[] {
  // 6 AM to 11 PM
  return Array.from({ length: 18 }, (_, i) => i + 6)
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
```

**Step 2: Create timeline component**

Create `app/components/calendar/timeline.tsx`:
```typescript
'use client'

import { getTimelineHours, formatTime } from '@/lib/utils/time'

interface TimelineProps {
  children: React.ReactNode
}

export function Timeline({ children }: TimelineProps) {
  const hours = getTimelineHours()
  const hourHeight = 60 // pixels per hour

  return (
    <div className="flex flex-1 overflow-auto">
      {/* Time labels */}
      <div className="flex-shrink-0 w-20 border-r">
        {hours.map((hour) => (
          <div
            key={hour}
            className="h-[60px] pr-2 text-right text-sm text-muted-foreground"
          >
            {formatTime(hour)}
          </div>
        ))}
      </div>

      {/* Timeline content */}
      <div className="flex-1 relative">
        {/* Hour grid lines */}
        {hours.map((hour) => (
          <div
            key={hour}
            className="absolute w-full border-t border-muted"
            style={{ top: `${(hour - 6) * hourHeight}px` }}
          />
        ))}

        {/* Schedule blocks */}
        <div className="relative" style={{ height: `${hours.length * hourHeight}px` }}>
          {children}
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Create schedule block component**

Create `app/components/calendar/schedule-block.tsx`:
```typescript
'use client'

import { timeToMinutes } from '@/lib/utils/time'
import type { Schedule } from '@/lib/store/types'

interface ScheduleBlockProps {
  schedule: Schedule
  children?: React.ReactNode
}

export function ScheduleBlock({ schedule, children }: ScheduleBlockProps) {
  const hourHeight = 60 // pixels per hour
  const startMinutes = timeToMinutes(schedule.startTime)
  const endMinutes = timeToMinutes(schedule.endTime)
  const durationMinutes = endMinutes - startMinutes

  // Calculate position (6 AM is the start)
  const topOffset = ((startMinutes - 6 * 60) / 60) * hourHeight
  const height = (durationMinutes / 60) * hourHeight

  return (
    <div
      className="absolute left-1 right-1 rounded-lg p-2 overflow-hidden"
      style={{
        top: `${topOffset}px`,
        height: `${height}px`,
        backgroundColor: `${schedule.color}20`,
        borderLeft: `3px solid ${schedule.color}`,
      }}
    >
      <div className="font-medium text-sm" style={{ color: schedule.color }}>
        {schedule.name}
      </div>
      <div className="mt-1 space-y-1">
        {children}
      </div>
    </div>
  )
}
```

**Step 4: Create day view component**

Create `app/components/calendar/day-view.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Timeline } from './timeline'
import { ScheduleBlock } from './schedule-block'
import { useKalendarStore } from '@/lib/store'
import { formatDate, formatDisplayDate } from '@/lib/utils/time'

export function DayView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const { schedules } = useKalendarStore()

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
        <div className="w-[140px]" /> {/* Spacer for centering */}
      </div>

      {/* Timeline */}
      <Timeline>
        {sortedSchedules.map((schedule) => (
          <ScheduleBlock key={schedule.id} schedule={schedule}>
            {/* Tasks will go here */}
          </ScheduleBlock>
        ))}
      </Timeline>
    </div>
  )
}
```

**Step 5: Update main page to use day view**

Modify `app/page.tsx`:
```typescript
import { StorageModeDialog } from './components/storage-mode-dialog'
import { DayView } from './components/calendar/day-view'

export default function Home() {
  return (
    <main className="h-screen flex flex-col">
      <StorageModeDialog />
      <DayView />
    </main>
  )
}
```

**Step 6: Verify day view renders with schedule blocks**

Run dev server and verify the timeline shows with colored schedule blocks.

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add day view with timeline and schedule blocks"
```

---

## Task 7: Create Task Display Component

**Files:**
- Create: `app/components/calendar/task-item.tsx`
- Create: `app/components/calendar/chunk-item.tsx`

**Step 1: Create chunk item component**

Create `app/components/calendar/chunk-item.tsx`:
```typescript
'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { Task, ChunkInstance } from '@/lib/store/types'

interface ChunkItemProps {
  chunk: Task
  instance: ChunkInstance | undefined
  onToggle: () => void
}

export function ChunkItem({ chunk, instance, onToggle }: ChunkItemProps) {
  const isCompleted = instance?.completed ?? false

  return (
    <div className="flex items-center gap-2 pl-6">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={onToggle}
        className="h-3 w-3"
      />
      <span
        className={cn(
          'text-xs',
          isCompleted && 'line-through text-muted-foreground'
        )}
      >
        {chunk.title}
      </span>
    </div>
  )
}
```

**Step 2: Create task item component**

Create `app/components/calendar/task-item.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChunkItem } from './chunk-item'
import type { Task, TaskInstance, ChunkInstance } from '@/lib/store/types'

interface TaskItemProps {
  task: Task
  instance: TaskInstance | undefined
  chunks: Task[]
  chunkInstances: ChunkInstance[]
  onToggleTask: () => void
  onToggleChunk: (chunkInstanceId: string) => void
}

const priorityColors: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-blue-500',
  4: 'bg-gray-400',
}

export function TaskItem({
  task,
  instance,
  chunks,
  chunkInstances,
  onToggleTask,
  onToggleChunk,
}: TaskItemProps) {
  const [expanded, setExpanded] = useState(false)
  const isCompleted = instance?.completed ?? false
  const hasChunks = chunks.length > 0

  return (
    <div className="bg-background rounded border p-2">
      <div className="flex items-center gap-2">
        {hasChunks && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 hover:bg-muted rounded"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        <Checkbox
          checked={isCompleted}
          onCheckedChange={onToggleTask}
          className="h-4 w-4"
        />
        <span
          className={cn(
            'flex-1 text-sm',
            isCompleted && 'line-through text-muted-foreground'
          )}
        >
          {task.title}
        </span>
        <Badge
          variant="secondary"
          className={cn('text-white text-xs px-1.5 py-0', priorityColors[task.priority])}
        >
          P{task.priority}
        </Badge>
      </div>

      {expanded && hasChunks && (
        <div className="mt-2 space-y-1">
          {chunks.map((chunk) => {
            const chunkInstance = chunkInstances.find(
              (ci) => ci.chunkId === chunk.id
            )
            return (
              <ChunkItem
                key={chunk.id}
                chunk={chunk}
                instance={chunkInstance}
                onToggle={() => chunkInstance && onToggleChunk(chunkInstance.id)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add task and chunk item components with priority badges"
```

---

## Task 8: Wire Up Tasks to Schedule Blocks

**Files:**
- Modify: `app/components/calendar/schedule-block.tsx`
- Modify: `app/components/calendar/day-view.tsx`
- Create: `lib/utils/tasks.ts`

**Step 1: Create task utilities**

Create `lib/utils/tasks.ts`:
```typescript
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
```

**Step 2: Update schedule block to accept tasks**

Modify `app/components/calendar/schedule-block.tsx`:
```typescript
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

  // Calculate position (6 AM is the start)
  const topOffset = ((startMinutes - 6 * 60) / 60) * hourHeight
  const height = (durationMinutes / 60) * hourHeight

  return (
    <div
      className="absolute left-1 right-1 rounded-lg p-2 overflow-auto"
      style={{
        top: `${topOffset}px`,
        height: `${height}px`,
        backgroundColor: `${schedule.color}20`,
        borderLeft: `3px solid ${schedule.color}`,
      }}
    >
      <div className="font-medium text-sm mb-2" style={{ color: schedule.color }}>
        {schedule.name}
      </div>
      <div className="space-y-1">
        {tasks.map((task) => {
          const instance = taskInstances.find((ti) => ti.taskId === task.id)
          const chunks = allTasks.filter((t) => t.parentId === task.id)
          const taskChunkInstances = chunkInstances.filter(
            (ci) => chunks.some((c) => c.id === ci.chunkId)
          )

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
    </div>
  )
}
```

**Step 3: Update day view to wire up tasks**

Modify `app/components/calendar/day-view.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Timeline } from './timeline'
import { ScheduleBlock } from './schedule-block'
import { useKalendarStore } from '@/lib/store'
import { formatDate, formatDisplayDate } from '@/lib/utils/time'
import { getTasksForSchedule, shouldShowTaskOnDate, isTaskCompletedInAnySchedule } from '@/lib/utils/tasks'

export function DayView() {
  const [currentDate, setCurrentDate] = useState(new Date())
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
        <div className="w-[140px]" /> {/* Spacer for centering */}
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
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: wire up tasks to schedule blocks with completion toggling"
```

---

## Task 9: Create Task Creation Form

**Files:**
- Create: `app/components/forms/create-task-form.tsx`
- Create: `app/components/forms/create-task-dialog.tsx`
- Modify: `app/components/calendar/day-view.tsx`

**Step 1: Install uuid for ID generation**

Run:
```bash
npm install uuid
npm install -D @types/uuid
```

**Step 2: Create task creation form**

Create `app/components/forms/create-task-form.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useKalendarStore } from '@/lib/store'
import type { Priority, Recurrence, Task, TaskInstance } from '@/lib/store/types'

interface CreateTaskFormProps {
  date: string
  onSuccess: () => void
}

export function CreateTaskForm({ date, onSuccess }: CreateTaskFormProps) {
  const { schedules, addTask, addTaskInstance } = useKalendarStore()

  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>(4)
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([])
  const [recurrence, setRecurrence] = useState<Recurrence>('none')
  const [chunks, setChunks] = useState<string[]>([])
  const [newChunk, setNewChunk] = useState('')

  const handleScheduleToggle = (scheduleId: string, checked: boolean) => {
    if (checked) {
      setSelectedScheduleIds([...selectedScheduleIds, scheduleId])
    } else {
      setSelectedScheduleIds(selectedScheduleIds.filter((id) => id !== scheduleId))
    }
  }

  const handleAddChunk = () => {
    if (newChunk.trim()) {
      setChunks([...chunks, newChunk.trim()])
      setNewChunk('')
    }
  }

  const handleRemoveChunk = (index: number) => {
    setChunks(chunks.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || selectedScheduleIds.length === 0) {
      return
    }

    const now = new Date().toISOString()
    const taskId = uuidv4()

    // Create main task
    const task: Task = {
      id: taskId,
      title: title.trim(),
      description: null,
      priority,
      scheduleIds: selectedScheduleIds,
      recurrence,
      recurrenceEnd: null,
      parentId: null,
      createdAt: now,
      updatedAt: now,
    }

    addTask(task)

    // Create chunks
    chunks.forEach((chunkTitle) => {
      const chunk: Task = {
        id: uuidv4(),
        title: chunkTitle,
        description: null,
        priority: 4,
        scheduleIds: [],
        recurrence: 'none',
        recurrenceEnd: null,
        parentId: taskId,
        createdAt: now,
        updatedAt: now,
      }
      addTask(chunk)
    })

    // Create task instance for today
    const instance: TaskInstance = {
      id: uuidv4(),
      taskId,
      date,
      completed: false,
      completedAt: null,
    }

    addTaskInstance(instance)

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Task Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={priority.toString()}
          onValueChange={(v) => setPriority(parseInt(v) as Priority)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">P1 - Urgent</SelectItem>
            <SelectItem value="2">P2 - High</SelectItem>
            <SelectItem value="3">P3 - Medium</SelectItem>
            <SelectItem value="4">P4 - Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Schedules</Label>
        <div className="space-y-2">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="flex items-center gap-2">
              <Checkbox
                id={schedule.id}
                checked={selectedScheduleIds.includes(schedule.id)}
                onCheckedChange={(checked) =>
                  handleScheduleToggle(schedule.id, checked as boolean)
                }
              />
              <Label htmlFor={schedule.id} className="font-normal">
                {schedule.name} ({schedule.startTime} - {schedule.endTime})
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recurrence">Recurrence</Label>
        <Select
          value={recurrence}
          onValueChange={(v) => setRecurrence(v as Recurrence)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Sub-tasks (Chunks)</Label>
        <div className="flex gap-2">
          <Input
            value={newChunk}
            onChange={(e) => setNewChunk(e.target.value)}
            placeholder="Add sub-task"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddChunk()
              }
            }}
          />
          <Button type="button" variant="outline" onClick={handleAddChunk}>
            Add
          </Button>
        </div>
        {chunks.length > 0 && (
          <ul className="space-y-1 mt-2">
            {chunks.map((chunk, index) => (
              <li
                key={index}
                className="flex items-center justify-between bg-muted px-2 py-1 rounded"
              >
                <span className="text-sm">{chunk}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveChunk(index)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={!title.trim() || selectedScheduleIds.length === 0}>
          Create Task
        </Button>
      </div>
    </form>
  )
}
```

**Step 3: Create task dialog wrapper**

Create `app/components/forms/create-task-dialog.tsx`:
```typescript
'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CreateTaskForm } from './create-task-form'

interface CreateTaskDialogProps {
  date: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTaskDialog({ date, open, onOpenChange }: CreateTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <CreateTaskForm date={date} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
```

**Step 4: Add dialog to day view**

Modify `app/components/calendar/day-view.tsx` to add the create task button in the header:
```typescript
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
```

**Step 5: Add lucide-react if not installed**

Run:
```bash
npm install lucide-react
```

**Step 6: Test task creation flow**

Run dev server and test:
1. Select storage mode
2. Click "Add Task" button
3. Fill out form and create task
4. Verify task appears in schedule block

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add task creation form with chunks and recurrence"
```

---

## Task 10: Handle Recurring Task Instances

**Files:**
- Create: `lib/utils/recurrence.ts`
- Modify: `app/components/calendar/day-view.tsx`

**Step 1: Create recurrence utilities**

Create `lib/utils/recurrence.ts`:
```typescript
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
```

**Step 2: Update day view to ensure instances exist**

Add effect to `app/components/calendar/day-view.tsx`:
```typescript
'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Timeline } from './timeline'
import { ScheduleBlock } from './schedule-block'
import { CreateTaskDialog } from '../forms/create-task-dialog'
import { useKalendarStore } from '@/lib/store'
import { formatDate, formatDisplayDate } from '@/lib/utils/time'
import { getTasksForSchedule } from '@/lib/utils/tasks'
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

  // Sort schedules by start time
  const sortedSchedules = [...schedules].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  )

  // Get tasks for each schedule, filtering by date
  const getScheduleTasks = (scheduleId: string) => {
    const scheduleTasks = getTasksForSchedule(tasks, scheduleId)

    return scheduleTasks.filter((task) => {
      // Check if there's an instance for this date
      const instance = taskInstances.find(
        (ti) => ti.taskId === task.id && ti.date === dateStr
      )

      if (!instance) return false

      // If completed, only show in first schedule
      if (instance.completed) {
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
```

**Step 3: Test recurring tasks**

1. Create a daily recurring task
2. Navigate to next day
3. Verify task appears with fresh checkbox

**Step 4: Commit**

```bash
git add .
git commit -m "feat: handle recurring task instances automatically"
```

---

## Summary

This plan covers the core v1 functionality:

1. **Task 1-4**: Project setup with Next.js 16, shadcn/ui, Zustand, and Supabase
2. **Task 5**: Storage mode selection with local warning
3. **Task 6-8**: Day view with timeline and schedule blocks displaying tasks
4. **Task 9**: Task creation form with chunks and recurrence
5. **Task 10**: Automatic recurring task instance generation

**Not included in v1** (future tasks):
- Supabase database schema and cloud sync
- Auth flows (email/password, magic link)
- Schedule management UI (create/edit/delete schedules)
- Task editing and deletion
- Vim keybindings
- Google/Apple calendar sync
