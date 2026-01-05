# Schedule Filtering Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix smart scheduling to respect task's `scheduleIds` - tasks should only be scheduled into their assigned schedules (e.g., "Breakfast" with Morning-only should never appear in Afternoon/Evening).

**Architecture:** Modify `getAvailableSlots` to accept a filter parameter for allowed schedule IDs. Update all callers (`getSmartScheduleForTask`, `rescheduleTasks`) to pass the task's `scheduleIds` as the filter.

**Tech Stack:** TypeScript, Zustand store

---

## Bug Analysis

The `getAvailableSlots` function iterates through ALL schedules without filtering by which schedules a task is assigned to. When a task has `scheduleIds: ['default-morning']` (Morning only), the smart scheduler can still place it in Afternoon or Evening if Morning is full or past.

**Root cause locations:**
- `lib/utils/smart-scheduling.ts:32-64` - `getAvailableSlots` doesn't filter by task
- `lib/utils/smart-scheduling.ts:126-173` - `getSmartScheduleForTask` passes all schedules
- `lib/store/index.ts:280` - `rescheduleTasks` passes all schedules

---

### Task 1: Update getAvailableSlots to Accept Schedule Filter

**Files:**
- Modify: `lib/utils/smart-scheduling.ts:32-64`

**Step 1: Write the failing test**

Create test file `lib/utils/__tests__/smart-scheduling.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getAvailableSlots } from '../smart-scheduling'
import type { Schedule } from '@/lib/store/types'

const mockSchedules: Schedule[] = [
  {
    id: 'morning',
    name: 'Morning',
    startTime: '06:00',
    endTime: '12:00',
    color: '#3b82f6',
    isDefault: true,
    order: 0,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'afternoon',
    name: 'Afternoon',
    startTime: '12:00',
    endTime: '18:00',
    color: '#f97316',
    isDefault: true,
    order: 1,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'evening',
    name: 'Evening',
    startTime: '18:00',
    endTime: '22:00',
    color: '#8b5cf6',
    isDefault: true,
    order: 2,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
]

describe('getAvailableSlots', () => {
  it('returns only slots for allowed schedules when filter is provided', () => {
    // At 7:00 AM (420 minutes), only allow morning schedule
    const slots = getAvailableSlots(mockSchedules, 420, ['morning'])

    expect(slots).toHaveLength(1)
    expect(slots[0].scheduleId).toBe('morning')
  })

  it('returns slots for multiple allowed schedules', () => {
    // At 7:00 AM, allow morning and afternoon
    const slots = getAvailableSlots(mockSchedules, 420, ['morning', 'afternoon'])

    expect(slots).toHaveLength(2)
    expect(slots.map(s => s.scheduleId)).toEqual(['morning', 'afternoon'])
  })

  it('returns all schedules when no filter provided (backward compatibility)', () => {
    // At 7:00 AM, no filter
    const slots = getAvailableSlots(mockSchedules, 420)

    expect(slots).toHaveLength(3)
  })

  it('returns empty when allowed schedule has already ended', () => {
    // At 2:00 PM (840 minutes), only allow morning (already ended)
    const slots = getAvailableSlots(mockSchedules, 840, ['morning'])

    expect(slots).toHaveLength(0)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/utils/__tests__/smart-scheduling.test.ts`
Expected: FAIL - `getAvailableSlots` doesn't accept third parameter

**Step 3: Update getAvailableSlots signature and implementation**

Modify `lib/utils/smart-scheduling.ts`:

```typescript
/**
 * Get available schedule slots starting from current time
 * Returns slots in chronological order with available time
 * @param schedules - All available schedules
 * @param currentTimeMinutes - Current time in minutes from midnight
 * @param allowedScheduleIds - Optional filter: only include these schedule IDs
 */
export function getAvailableSlots(
  schedules: Schedule[],
  currentTimeMinutes: number,
  allowedScheduleIds?: string[]
): ScheduleSlot[] {
  const slots: ScheduleSlot[] = []

  // Filter schedules if allowedScheduleIds provided
  const filteredSchedules = allowedScheduleIds
    ? schedules.filter(s => allowedScheduleIds.includes(s.id))
    : schedules

  const sortedSchedules = [...filteredSchedules].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  )

  for (const schedule of sortedSchedules) {
    const startMinutes = timeToMinutes(schedule.startTime)
    const endMinutes = timeToMinutes(schedule.endTime)

    // Skip schedules that have already ended
    if (endMinutes <= currentTimeMinutes) continue

    // Calculate actual start (either schedule start or current time, whichever is later)
    const actualStart = Math.max(startMinutes, currentTimeMinutes)
    const availableMinutes = endMinutes - actualStart

    if (availableMinutes > 0) {
      slots.push({
        scheduleId: schedule.id,
        startMinutes: actualStart,
        endMinutes,
        availableMinutes,
      })
    }
  }

  return slots
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run lib/utils/__tests__/smart-scheduling.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/utils/smart-scheduling.ts lib/utils/__tests__/smart-scheduling.test.ts
git commit -m "feat: add schedule filter to getAvailableSlots"
```

---

### Task 2: Update getSmartScheduleForTask to Use Task's Schedules

**Files:**
- Modify: `lib/utils/smart-scheduling.ts:126-173`
- Modify: `lib/utils/__tests__/smart-scheduling.test.ts`

**Step 1: Write the failing test**

Add to `lib/utils/__tests__/smart-scheduling.test.ts`:

```typescript
import { getSmartScheduleForTask } from '../smart-scheduling'
import type { Task, TaskInstance } from '@/lib/store/types'

describe('getSmartScheduleForTask', () => {
  const createTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'task-1',
    name: 'Test Task',
    scheduleIds: ['morning'],
    priority: 1,
    duration: 30,
    parentId: null,
    recurrence: 'none',
    recurrenceEnd: null,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides,
  })

  it('only schedules into task assigned schedules', () => {
    // Task assigned only to morning
    const task = createTask({ scheduleIds: ['morning'] })

    // At 2:00 PM (840 minutes) - morning has ended
    const result = getSmartScheduleForTask(
      task,
      mockSchedules,
      [],
      '2024-01-15',
      840
    )

    // Should return null because morning has ended, NOT schedule into afternoon
    expect(result).toBeNull()
  })

  it('schedules into first available assigned schedule', () => {
    // Task assigned to morning and evening (skipping afternoon)
    const task = createTask({ scheduleIds: ['morning', 'evening'] })

    // At 7:00 AM (420 minutes)
    const result = getSmartScheduleForTask(
      task,
      mockSchedules,
      [],
      '2024-01-15',
      420
    )

    expect(result).not.toBeNull()
    expect(result!.scheduleId).toBe('morning')
  })

  it('falls back to later assigned schedule when earlier is full', () => {
    // Task assigned to morning and evening
    const task = createTask({ scheduleIds: ['morning', 'evening'], duration: 30 })

    // At 11:50 AM (710 minutes) - only 10 mins left in morning, need 30
    const result = getSmartScheduleForTask(
      task,
      mockSchedules,
      [],
      '2024-01-15',
      710
    )

    // Should schedule into evening, not afternoon (which isn't assigned)
    expect(result).not.toBeNull()
    expect(result!.scheduleId).toBe('evening')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/utils/__tests__/smart-scheduling.test.ts`
Expected: FAIL - tasks get scheduled into non-assigned schedules

**Step 3: Update getSmartScheduleForTask implementation**

Modify `lib/utils/smart-scheduling.ts`:

```typescript
/**
 * Calculate smart schedule for a single task (for new task creation or linked task trigger)
 * Returns the startTime and scheduleId where the task should be placed
 * Only considers schedules the task is assigned to (task.scheduleIds)
 */
export function getSmartScheduleForTask(
  task: Task,
  schedules: Schedule[],
  existingInstances: TaskInstance[],
  date: string,
  currentTimeMinutes: number
): { scheduleId: string; startTime: string } | null {
  // Get available slots - ONLY for schedules this task is assigned to
  const slots = getAvailableSlots(schedules, currentTimeMinutes, task.scheduleIds)
  if (slots.length === 0) return null

  // Calculate already occupied time in each slot
  const slotOccupancy = new Map<string, number>()

  for (const instance of existingInstances) {
    if (instance.date !== date || instance.completed) continue
    if (!instance.startTime) continue

    const startMins = timeToMinutes(instance.startTime)

    for (const slot of slots) {
      if (startMins >= slot.startMinutes && startMins < slot.endMinutes) {
        const current = slotOccupancy.get(slot.scheduleId) || 0
        slotOccupancy.set(slot.scheduleId, current + 30) // Assume 30 min
        break
      }
    }
  }

  const duration = task.duration || 30

  // Find first slot with enough remaining time
  for (const slot of slots) {
    const occupied = slotOccupancy.get(slot.scheduleId) || 0
    const remaining = slot.availableMinutes - occupied

    if (remaining >= duration) {
      // Calculate start time based on current occupancy
      const startMinutes = slot.startMinutes + occupied
      return {
        scheduleId: slot.scheduleId,
        startTime: minutesToTime(startMinutes),
      }
    }
  }

  return null
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run lib/utils/__tests__/smart-scheduling.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/utils/smart-scheduling.ts lib/utils/__tests__/smart-scheduling.test.ts
git commit -m "fix: getSmartScheduleForTask respects task.scheduleIds"
```

---

### Task 3: Update rescheduleTasks to Use Task's Schedules

**Files:**
- Modify: `lib/store/index.ts:262-316`

**Step 1: Read current implementation**

The `rescheduleTasks` function at line 262-316 needs to filter slots per-task.

**Step 2: Update rescheduleTasks implementation**

Modify `lib/store/index.ts` in the `rescheduleTasks` function:

```typescript
// Smart scheduling action
rescheduleTasks: (date) =>
  set((state) => {
    const currentTimeMinutes = getCurrentTimeMinutes()

    // Get uncompleted task instances for this date
    const uncompletedInstances = state.taskInstances.filter(
      (ti) => ti.date === date && !ti.completed
    )

    // Get corresponding tasks
    const tasksToSchedule = uncompletedInstances
      .map((ti) => state.tasks.find((t) => t.id === ti.taskId))
      .filter((t): t is Task => t !== undefined && t.parentId === null)

    // Sort by priority
    tasksToSchedule.sort((a, b) => a.priority - b.priority)

    // Track slot usage per schedule
    const slotUsageMap = new Map<string, { currentStart: number; remaining: number }>()

    // Initialize slot usage for all schedules
    for (const schedule of state.schedules) {
      const startMinutes = timeToMinutes(schedule.startTime)
      const endMinutes = timeToMinutes(schedule.endTime)

      // Skip schedules that have already ended
      if (endMinutes <= currentTimeMinutes) continue

      const actualStart = Math.max(startMinutes, currentTimeMinutes)
      const availableMinutes = endMinutes - actualStart

      if (availableMinutes > 0) {
        slotUsageMap.set(schedule.id, {
          currentStart: actualStart,
          remaining: availableMinutes,
        })
      }
    }

    const updatedInstances = state.taskInstances.map((ti) => {
      if (ti.date !== date || ti.completed) return ti

      const task = tasksToSchedule.find((t) => t.id === ti.taskId)
      if (!task) return ti

      const duration = task.duration || 30

      // Find slot that can fit this task - ONLY from task's assigned schedules
      for (const scheduleId of task.scheduleIds) {
        const slot = slotUsageMap.get(scheduleId)
        if (slot && slot.remaining >= duration) {
          const newStartTime = minutesToTime(slot.currentStart)

          // Update slot
          slot.currentStart += duration
          slot.remaining -= duration

          return { ...ti, startTime: newStartTime }
        }
      }

      // No slot found in assigned schedules, keep original (or null)
      return ti
    })

    return { taskInstances: updatedInstances }
  }),
```

**Step 3: Add missing import**

Add `timeToMinutes` import at the top of `lib/store/index.ts` if not present:

```typescript
import { timeToMinutes } from '@/lib/utils/time'
```

**Step 4: Run build to verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add lib/store/index.ts
git commit -m "fix: rescheduleTasks respects task.scheduleIds"
```

---

### Task 4: Manual Testing

**Step 1: Start the dev server**

Run: `npm run dev`

**Step 2: Test scenario 1 - Create morning-only task in afternoon**

1. Open app in browser
2. Create a task "Breakfast" assigned ONLY to Morning schedule
3. Create it in the afternoon (after 12:00)
4. Verify the task does NOT appear in Afternoon or Evening blocks
5. Verify the task either:
   - Gets scheduled to the next day's morning, OR
   - Shows as unscheduled (no startTime), OR
   - Returns null from smart scheduling

**Step 3: Test scenario 2 - Reschedule button**

1. Create a task assigned to Morning and Evening (skip Afternoon)
2. Complete morning to trigger reschedule
3. Click the reschedule button
4. Verify task moves to Evening, not Afternoon

**Step 4: Test scenario 3 - Linked task trigger**

1. Create Task A (any schedule)
2. Create Task B assigned ONLY to Evening
3. Link Task A → Task B (on complete, start B)
4. Complete Task A in the morning
5. Verify Task B appears in Evening block with startTime at 18:00 (or first available in evening)

---

### Task 5: Final Cleanup

**Step 1: Run full test suite**

Run: `npm test` (if available) or `npx vitest run`
Expected: All tests pass

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Final commit**

```bash
git add -A
git commit -m "test: add smart-scheduling tests for schedule filtering"
```

---

## Summary

This fix ensures that:
1. `getAvailableSlots` can filter by allowed schedule IDs
2. `getSmartScheduleForTask` only considers schedules in `task.scheduleIds`
3. `rescheduleTasks` respects each task's assigned schedules
4. A "Breakfast" task assigned only to Morning will NEVER appear in Afternoon/Evening
