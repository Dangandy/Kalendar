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
            style={{ top: `${hour * hourHeight}px` }}
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
