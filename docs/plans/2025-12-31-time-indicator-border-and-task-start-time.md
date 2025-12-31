# Time Indicator Border & Task Start Time Implementation Plan

**Status:** COMPLETED (2025-12-31)

**Goal:** Add a white border around the current time red line for better visibility, and allow users to set a start time for each task.

**Architecture:** The time indicator border will use CSS box-shadow to create a white outline effect around the red line and circle. For task start times, we'll add a `startTime` field to the Task type (not TaskInstance - this is the default/scheduled time), add a time picker to the create task form, and display the time in the task item.

**Tech Stack:** React, Tailwind CSS, shadcn/ui components (Input for time picker)

---

## Task 1: Add White Border to Current Time Indicator

### Step 1.1: Update the circle with white border

**Files:**
- Modify: `app/components/calendar/timeline.tsx:80`

Change the circle div to include a white ring:

```tsx
<div className="absolute -left-2 w-3 h-3 rounded-full bg-red-500 -translate-y-1/2 ring-2 ring-white" />
```

### Step 1.2: Update the line with white border

**Files:**
- Modify: `app/components/calendar/timeline.tsx:81`

Add shadow to create white border effect on the line:

```tsx
<div className="h-0.5 bg-red-500 w-full shadow-[0_0_0_1px_white]" />
```

### Step 1.3: Run the dev server and verify

**Run:** `npm run dev`

**Verify:**
1. The red circle has a white ring around it
2. The red line has a white border/outline effect
3. The indicator is more visible against schedule blocks

### Step 1.4: Commit

```bash
git add app/components/calendar/timeline.tsx
git commit -m "feat: add white border to current time indicator"
```

---

## Task 2: Add Start Time Field to Task Type

### Step 2.1: Update Task interface

**Files:**
- Modify: `lib/store/types.ts:19-30`

Add `startTime` field to the Task interface:

```typescript
export interface Task {
  id: string
  title: string
  description: string | null
  priority: Priority
  scheduleIds: string[]
  recurrence: Recurrence
  recurrenceEnd: string | null // ISO date
  parentId: string | null // null for top-level tasks, task id for chunks
  startTime: string | null // HH:MM format - scheduled start time
  createdAt: string
  updatedAt: string
}
```

### Step 2.2: Run TypeScript check

**Run:** `npx tsc --noEmit`

**Expected:** Errors in files that create Task objects without `startTime`

### Step 2.3: Update create-task-form to include startTime

**Files:**
- Modify: `app/components/forms/create-task-form.tsx:84-95`

Add startTime to task creation:

```typescript
const task: Task = {
  id: taskId,
  title: title.trim(),
  description: description.trim() || null,
  priority,
  scheduleIds: selectedScheduleIds,
  recurrence,
  recurrenceEnd: null,
  parentId: null,
  startTime: null, // Will add UI in next task
  createdAt: now,
  updatedAt: now,
}
```

### Step 2.4: Update chunk creation to include startTime

**Files:**
- Modify: `app/components/forms/create-task-form.tsx:100-115`

Add startTime to chunk creation:

```typescript
const chunk: Task = {
  id: chunkId,
  title: chunkTitle,
  description: null,
  priority: 4,
  scheduleIds: [],
  recurrence: 'none',
  recurrenceEnd: null,
  parentId: taskId,
  startTime: null,
  createdAt: now,
  updatedAt: now,
}
```

### Step 2.5: Run TypeScript check

**Run:** `npx tsc --noEmit`

**Expected:** No errors (or find other files that need updating)

### Step 2.6: Commit

```bash
git add lib/store/types.ts app/components/forms/create-task-form.tsx
git commit -m "feat: add startTime field to Task type"
```

---

## Task 3: Add Start Time Input to Create Task Form

### Step 3.1: Add startTime state to form

**Files:**
- Modify: `app/components/forms/create-task-form.tsx:33`

Add state for start time after the newChunk state:

```typescript
const [startTime, setStartTime] = useState<string>('')
```

### Step 3.2: Add time input UI after priority selector

**Files:**
- Modify: `app/components/forms/create-task-form.tsx` (after priority Select, around line 199)

Add the start time input section:

```tsx
<div className="space-y-2">
  <Label htmlFor="startTime">Start Time (optional)</Label>
  <Input
    id="startTime"
    type="time"
    value={startTime}
    onChange={(e) => setStartTime(e.target.value)}
    className="w-full"
  />
</div>
```

### Step 3.3: Use startTime in task creation

**Files:**
- Modify: `app/components/forms/create-task-form.tsx:84-95`

Update the task object to use the startTime state:

```typescript
const task: Task = {
  id: taskId,
  title: title.trim(),
  description: description.trim() || null,
  priority,
  scheduleIds: selectedScheduleIds,
  recurrence,
  recurrenceEnd: null,
  parentId: null,
  startTime: startTime || null,
  createdAt: now,
  updatedAt: now,
}
```

### Step 3.4: Run the dev server and verify

**Run:** `npm run dev`

**Verify:**
1. Time picker input appears in create task form
2. Can select a time using the native time picker
3. Task is created with the selected start time

### Step 3.5: Commit

```bash
git add app/components/forms/create-task-form.tsx
git commit -m "feat: add start time input to create task form"
```

---

## Task 4: Display Task Start Time in Task Item

### Step 4.1: Update TaskItem to show task's startTime

**Files:**
- Modify: `app/components/calendar/task-item.tsx:60-72`

Update the title section to also show task.startTime (with instance.startTime taking priority if present):

```tsx
<span
  className={cn(
    'flex-1 text-sm',
    isCompleted && 'line-through text-muted-foreground'
  )}
>
  {task.title}
  {(instance?.startTime || task.startTime) && (
    <span className="ml-2 text-xs text-muted-foreground">
      @ {formatTimeDisplay(instance?.startTime || task.startTime!)}
    </span>
  )}
</span>
```

### Step 4.2: Run the dev server and verify

**Run:** `npm run dev`

**Verify:**
1. Tasks with a start time show the time next to the title
2. The format is "@ HH:MM AM/PM"
3. Tasks without a start time don't show any time
4. Instance startTime (from linked tasks) takes precedence over task startTime

### Step 4.3: Commit

```bash
git add app/components/calendar/task-item.tsx
git commit -m "feat: display task start time in task item"
```

---

## Task 5: Run Build and Final Verification

### Step 5.1: Run TypeScript check

**Run:** `npx tsc --noEmit`

**Expected:** No errors

### Step 5.2: Run build

**Run:** `npm run build`

**Expected:** Build succeeds

### Step 5.3: Final verification

**Run:** `npm run dev`

**Verify:**
1. Current time indicator has white border on circle and line
2. Create task form has start time picker
3. Tasks display their start times
4. All existing functionality still works

### Step 5.4: Commit all remaining changes (if any)

```bash
git status
# If there are uncommitted changes:
git add -A
git commit -m "chore: cleanup and fixes"
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `app/components/calendar/timeline.tsx` | Added white border to time indicator circle and line |
| `lib/store/types.ts` | Added `startTime` field to Task interface |
| `app/components/forms/create-task-form.tsx` | Added start time state, input, and usage in task creation |
| `app/components/calendar/task-item.tsx` | Display task start time alongside title |

**Key Behavior:**
- Task `startTime` is the default/scheduled time set during creation
- TaskInstance `startTime` is the triggered time from linked tasks
- Display prioritizes instance.startTime over task.startTime

---

## Completion Summary

**Commits:**
- `36d72fd` feat: add white border to current time indicator
- `5a156a5` feat: add startTime field to Task type
- `71aa6cf` feat: add start time input to create task form
- `f42e574` feat: display task start time in task item

**Verification:**
- TypeScript: No errors
- Build: Compiled successfully
- All 4 tasks completed with spec and code quality reviews
