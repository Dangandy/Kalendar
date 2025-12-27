# Kalendar - Task-Based Calendar App Design

## Overview

A keyboard-first calendar app focused on task management with scheduled time windows. Tasks belong to named schedules (time blocks) and can recur daily, weekly, or monthly.

## Tech Stack

- **Next.js 16** with App Router
- **React 19**
- **Tailwind CSS v4** + **shadcn/ui**
- **Supabase** for auth and database
- **Zustand v5** for client state with localStorage persistence

## Core Concepts

### Schedule
A named time window defining when tasks can be done.
- Has a name, start time, end time, and color
- Default schedules: Morning, Afternoon, Evening
- User can create custom schedules
- Displayed as colored blocks on the timeline (Google Calendar style)

### Task
A to-do item assigned to one or more schedules.
- Must belong to at least one schedule
- Has priority: P1, P2, P3, P4 (sorted P1 at top)
- Can have sub-tasks (chunks) - one level only
- Can recur: none, daily, weekly, monthly

### Chunk (Sub-task)
A child task belonging to a parent task.
- One level of nesting only (no sub-sub-tasks)
- Recurring tasks include their chunks on each instance

### Recurrence
- Options: none, daily, weekly, monthly
- Each occurrence is date-bound
- Missed tasks disappear (no backlog)
- Looking at past days won't show incomplete recurring tasks

## Storage Modes

### Local Mode
- Data stored in localStorage via Zustand persist
- One-time warning shown on first app launch
- Warning: "Your data is stored locally and may be deleted if you clear browser data"

### Cloud Mode
- Data stored in Supabase
- Auth options: email/password OR magic link
- Can migrate from local to cloud (one-way)

## Data Models

### Schedule
```
id: uuid
name: string
start_time: time (HH:MM)
end_time: time (HH:MM)
color: string (hex)
is_default: boolean
order: number
user_id: uuid | null (null for local)
created_at: datetime
updated_at: datetime
```

### Task
```
id: uuid
title: string
description: string | null
priority: 1 | 2 | 3 | 4
schedule_ids: uuid[] (many-to-many)
recurrence: 'none' | 'daily' | 'weekly' | 'monthly'
recurrence_end: date | null
parent_id: uuid | null (for chunks)
user_id: uuid | null
created_at: datetime
updated_at: datetime
```

### TaskInstance
```
id: uuid
task_id: uuid
date: date
completed: boolean
completed_at: datetime | null
```

### ChunkInstance
```
id: uuid
task_instance_id: uuid
chunk_id: uuid (references Task where parent_id is not null)
completed: boolean
completed_at: datetime | null
```

## UI Design

### Main View (Day/Agenda)
- Google Calendar-style timeline (vertical, hourly)
- Schedules appear as colored blocks spanning their time range
- Tasks listed inside their schedule blocks, sorted by priority
- Completed tasks show with strikethrough, remain in place
- Tasks in multiple schedules only appear in one (first uncompleted window, or first if all done)

### Task Display
- Checkbox + title + priority badge (P1/P2/P3/P4)
- Expand to show chunks (sub-tasks) with their own checkboxes
- Strikethrough when completed

### Navigation
- Day view is primary
- Navigate between days
- Week/month views for future consideration

### Forms
- Structured form for task creation (modal)
- Fields: title, description, priority (default P4), schedules (multi-select), recurrence
- Default duration: 30 minutes (for future time-specific features)

## Default Schedules

1. **Morning** - 6:00 AM - 12:00 PM - Blue
2. **Afternoon** - 12:00 PM - 6:00 PM - Orange
3. **Evening** - 6:00 PM - 10:00 PM - Purple

## Future Features (Not in v1)

- Vim-style keybindings with Space as leader key
- Google Calendar sync (two-way)
- Apple Calendar sync (two-way)
- Week view
- Month view
- Dark mode toggle (light mode default)
