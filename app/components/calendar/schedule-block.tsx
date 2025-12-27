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
