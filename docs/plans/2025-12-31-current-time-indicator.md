# Current Time Indicator & Extended Hours Implementation Plan

**Status:** COMPLETED (2025-12-31)

**Goal:** Add a red horizontal line showing current time and extend the visible calendar hours to include midnight through 6 AM.

**Architecture:** Modify the timeline component to render a current time indicator line that updates every minute. Adjust the time utility to return 24 hours (0-23) instead of 18 hours (6-23), and update positioning calculations to use hour 0 as the baseline.

**Tech Stack:** React (useState, useEffect), Tailwind CSS, existing time utility functions

---

## Task 1: Extend Timeline Hours to Include Midnight

### Step 1.1: Modify getTimelineHours function

**Files:**
- Modify: `lib/utils/time.ts:18-21`

Update the function to return 24 hours starting from midnight:

```typescript
export function getTimelineHours(): number[] {
  // Midnight to 11 PM (full 24 hours)
  return Array.from({ length: 24 }, (_, i) => i)
}
```

### Step 1.2: Update Timeline positioning formula

**Files:**
- Modify: `app/components/calendar/timeline.tsx:34`

Change the hour offset from 6 to 0:

```typescript
style={{ top: `${hour * hourHeight}px` }}
```

### Step 1.3: Update Timeline label positioning

**Files:**
- Modify: `app/components/calendar/timeline.tsx:20`

Change the hour offset from 6 to 0:

```typescript
style={{ top: `${hour * hourHeight}px` }}
```

### Step 1.4: Update ScheduleBlock baseline calculation

**Files:**
- Modify: `app/components/calendar/schedule-block.tsx:31`

Change baseline from 6 hours (360 minutes) to 0:

```typescript
const topOffset = (startMinutes / 60) * hourHeight
```

### Step 1.5: Run the dev server and verify

**Run:** `npm run dev`

**Verify:**
1. Timeline shows hours from 12 AM to 11 PM
2. Schedule blocks still position correctly
3. Scrolling works properly (should start scrolled down to show current time area)

### Step 1.6: Commit

```bash
git add lib/utils/time.ts app/components/calendar/timeline.tsx app/components/calendar/schedule-block.tsx
git commit -m "feat: extend timeline hours from midnight to 11 PM"
```

---

## Task 2: Add Current Time Indicator Line

### Step 2.1: Add state and effect for current time in Timeline

**Files:**
- Modify: `app/components/calendar/timeline.tsx`

Add imports and state at the top of the component:

```typescript
"use client"

import { formatTime, getTimelineHours } from "@/lib/utils/time"
import { useState, useEffect } from "react"
```

Add state inside the Timeline component (after the hourHeight declaration):

```typescript
const [currentTime, setCurrentTime] = useState<Date | null>(null)

useEffect(() => {
  // Set initial time on client only
  setCurrentTime(new Date())

  const interval = setInterval(() => {
    setCurrentTime(new Date())
  }, 60000) // Update every minute

  return () => clearInterval(interval)
}, [])
```

### Step 2.2: Calculate current time position

**Files:**
- Modify: `app/components/calendar/timeline.tsx`

Add calculation after the state/effect (inside component, before return):

```typescript
const getCurrentTimePosition = () => {
  if (!currentTime) return null
  const hours = currentTime.getHours()
  const minutes = currentTime.getMinutes()
  return (hours + minutes / 60) * hourHeight
}

const timePosition = getCurrentTimePosition()
```

### Step 2.3: Render the current time indicator line

**Files:**
- Modify: `app/components/calendar/timeline.tsx`

Add the red line inside the timeline content area (after the hour grid lines map, before the closing `</div>` of the relative container):

```tsx
{/* Current time indicator */}
{timePosition !== null && (
  <div
    className="absolute left-0 right-0 z-10 pointer-events-none"
    style={{ top: `${timePosition}px` }}
  >
    <div className="relative">
      <div className="absolute -left-2 w-3 h-3 rounded-full bg-red-500 -translate-y-1/2" />
      <div className="h-0.5 bg-red-500 w-full" />
    </div>
  </div>
)}
```

### Step 2.4: Run the dev server and verify

**Run:** `npm run dev`

**Verify:**
1. Red line appears at the current time position
2. Red circle dot appears on the left side of the line
3. Line spans the full width of the timeline content
4. Line updates position when a minute passes (or test by temporarily changing interval to 1000ms)

### Step 2.5: Commit

```bash
git add app/components/calendar/timeline.tsx
git commit -m "feat: add current time indicator line"
```

---

## Task 3: Auto-scroll to Current Time on Load

### Step 3.1: Add ref and scroll effect to Timeline

**Files:**
- Modify: `app/components/calendar/timeline.tsx`

Add useRef import:

```typescript
import { useState, useEffect, useRef } from "react"
```

Add ref and scroll effect inside the component:

```typescript
const containerRef = useRef<HTMLDivElement>(null)
const hasScrolled = useRef(false)

useEffect(() => {
  if (timePosition !== null && containerRef.current && !hasScrolled.current) {
    // Scroll to show current time in the upper portion of the view
    const scrollPosition = Math.max(0, timePosition - 100)
    containerRef.current.scrollTop = scrollPosition
    hasScrolled.current = true
  }
}, [timePosition])
```

### Step 3.2: Attach ref to scrollable container

**Files:**
- Modify: `app/components/calendar/timeline.tsx`

Update the outer container div to include the ref:

```tsx
<div ref={containerRef} className="flex flex-1 overflow-auto">
```

### Step 3.3: Run the dev server and verify

**Run:** `npm run dev`

**Verify:**
1. On page load, the timeline scrolls to show the current time
2. Current time appears near the top of the visible area
3. User can still manually scroll freely after initial auto-scroll

### Step 3.4: Commit

```bash
git add app/components/calendar/timeline.tsx
git commit -m "feat: auto-scroll timeline to current time on load"
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `lib/utils/time.ts` | Extended hour range from 6-23 to 0-23 |
| `app/components/calendar/timeline.tsx` | Added current time state, indicator line, auto-scroll |
| `app/components/calendar/schedule-block.tsx` | Updated baseline calculation for 0-hour start |

**Total timeline height change:** 1080px → 1440px (24 hours × 60px)
