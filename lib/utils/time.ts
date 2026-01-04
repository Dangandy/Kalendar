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
  // Midnight to 11 PM (full 24 hours)
  return Array.from({ length: 24 }, (_, i) => i)
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

export function formatTimeDisplay(time: string): string {
  const { hours, minutes } = parseTime(time)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function calculateLinkedTaskSchedule(
  completedAt: string,
  delayMinutes: number
): { date: string; startTime: string } {
  const completedDate = new Date(completedAt)
  const scheduledDate = new Date(completedDate.getTime() + delayMinutes * 60 * 1000)

  // Use local date, not UTC date
  const year = scheduledDate.getFullYear()
  const month = (scheduledDate.getMonth() + 1).toString().padStart(2, '0')
  const day = scheduledDate.getDate().toString().padStart(2, '0')
  const date = `${year}-${month}-${day}`

  const hours = scheduledDate.getHours().toString().padStart(2, '0')
  const minutes = scheduledDate.getMinutes().toString().padStart(2, '0')

  return { date, startTime: `${hours}:${minutes}` }
}
