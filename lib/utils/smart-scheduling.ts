import type { Task, TaskInstance, Schedule } from '@/lib/store/types'
import { timeToMinutes } from './time'

interface ScheduleSlot {
  scheduleId: string
  startMinutes: number
  endMinutes: number
  availableMinutes: number
}

/**
 * Get current time in minutes from midnight
 */
export function getCurrentTimeMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

/**
 * Convert minutes from midnight to HH:MM format
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Get available schedule slots starting from current time
 * Returns slots in chronological order with available time
 */
export function getAvailableSlots(
  schedules: Schedule[],
  currentTimeMinutes: number
): ScheduleSlot[] {
  const slots: ScheduleSlot[] = []

  const sortedSchedules = [...schedules].sort((a, b) =>
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

interface ScheduledTask {
  taskId: string
  scheduleId: string
  startTime: string
  endTime: string
}

/**
 * Smart schedule tasks into available slots
 * Returns array of scheduled tasks with their assigned times
 */
export function smartScheduleTasks(
  tasks: Task[],
  schedules: Schedule[],
  currentTimeMinutes: number
): ScheduledTask[] {
  const slots = getAvailableSlots(schedules, currentTimeMinutes)
  if (slots.length === 0) return []

  const scheduled: ScheduledTask[] = []

  // Track remaining time in each slot
  const slotRemaining = slots.map(s => ({ ...s }))

  // Sort tasks by priority (1 = highest)
  const sortedTasks = [...tasks].sort((a, b) => a.priority - b.priority)

  for (const task of sortedTasks) {
    const duration = task.duration || 30

    // Find first slot that can fit this task
    for (const slot of slotRemaining) {
      if (slot.availableMinutes >= duration) {
        const startTime = minutesToTime(slot.startMinutes)
        const endMinutes = slot.startMinutes + duration
        const endTime = minutesToTime(endMinutes)

        scheduled.push({
          taskId: task.id,
          scheduleId: slot.scheduleId,
          startTime,
          endTime,
        })

        // Update slot: move start forward, reduce available time
        slot.startMinutes = endMinutes
        slot.availableMinutes -= duration
        break
      }
    }
    // If no slot found, task won't be scheduled (dropped)
  }

  return scheduled
}

/**
 * Calculate smart schedule for a single task (for new task creation or linked task trigger)
 * Returns the startTime and scheduleId where the task should be placed
 */
export function getSmartScheduleForTask(
  task: Task,
  schedules: Schedule[],
  existingInstances: TaskInstance[],
  date: string,
  currentTimeMinutes: number
): { scheduleId: string; startTime: string } | null {
  // Get available slots
  const slots = getAvailableSlots(schedules, currentTimeMinutes)
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
