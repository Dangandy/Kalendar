'use client'

import { getTimelineHours, formatTime } from '@/lib/utils/time'
import { useState, useEffect, useRef } from 'react'

interface TimelineProps {
  children: React.ReactNode
}

export function Timeline({ children }: TimelineProps) {
  const hours = getTimelineHours()
  const hourHeight = 60 // pixels per hour

  const containerRef = useRef<HTMLDivElement>(null)
  const hasScrolled = useRef(false)

  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    // Set initial time on client only
    setCurrentTime(new Date())

    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const getCurrentTimePosition = () => {
    if (!currentTime) return null
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    return (hours + minutes / 60) * hourHeight
  }

  const timePosition = getCurrentTimePosition()

  useEffect(() => {
    if (timePosition !== null && containerRef.current && !hasScrolled.current) {
      // Scroll to show current time in the upper portion of the view
      const scrollPosition = Math.max(0, timePosition - 100)
      containerRef.current.scrollTop = scrollPosition
      hasScrolled.current = true
    }
  }, [timePosition])

  return (
    <div ref={containerRef} className="flex flex-1 overflow-auto">
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

        {/* Current time indicator */}
        {timePosition !== null && (
          <div
            className="absolute left-0 right-0 z-10 pointer-events-none"
            style={{ top: `${timePosition}px` }}
          >
            <div className="relative">
              <div className="absolute -left-2 w-3 h-3 rounded-full bg-red-500 -translate-y-1/2 ring-2 ring-white" />
              <div className="h-0.5 bg-red-500 w-full shadow-[0_0_0_1px_white]" />
            </div>
          </div>
        )}

        {/* Schedule blocks */}
        <div className="relative" style={{ height: `${hours.length * hourHeight}px` }}>
          {children}
        </div>
      </div>
    </div>
  )
}
