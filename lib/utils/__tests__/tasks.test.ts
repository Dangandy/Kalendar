import { describe, it, expect } from 'vitest'
import { getActiveScheduleForTask } from '../tasks'
import type { Task, Schedule } from '@/lib/store/types'

describe('getActiveScheduleForTask', () => {
  const mockSchedules: Schedule[] = [
    { id: 'morning', name: 'Morning', startTime: '06:00', endTime: '12:00', color: '#fff', isDefault: true, order: 0, createdAt: '', updatedAt: '' },
    { id: 'afternoon', name: 'Afternoon', startTime: '12:00', endTime: '18:00', color: '#fff', isDefault: true, order: 1, createdAt: '', updatedAt: '' },
    { id: 'evening', name: 'Evening', startTime: '18:00', endTime: '22:00', color: '#fff', isDefault: true, order: 2, createdAt: '', updatedAt: '' },
  ]

  const createTask = (scheduleIds: string[]): Task => ({
    id: 'task-1',
    title: 'Test Task',
    description: null,
    priority: 2,
    scheduleIds,
    recurrence: 'none',
    recurrenceEnd: null,
    parentId: null,
    startDate: null,
    duration: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  it('returns first schedule when current time is before all schedules', () => {
    const task = createTask(['morning', 'afternoon', 'evening'])
    // 05:00 - before morning starts
    const result = getActiveScheduleForTask(task, mockSchedules, '05:00')
    expect(result).toBe('morning')
  })

  it('returns first schedule when current time is within first schedule', () => {
    const task = createTask(['morning', 'afternoon', 'evening'])
    // 10:00 - within morning
    const result = getActiveScheduleForTask(task, mockSchedules, '10:00')
    expect(result).toBe('morning')
  })

  it('cascades to second schedule when first schedule has passed', () => {
    const task = createTask(['morning', 'afternoon', 'evening'])
    // 14:00 - morning has passed, within afternoon
    const result = getActiveScheduleForTask(task, mockSchedules, '14:00')
    expect(result).toBe('afternoon')
  })

  it('cascades to last schedule when earlier schedules have passed', () => {
    const task = createTask(['morning', 'afternoon', 'evening'])
    // 20:00 - only evening remains
    const result = getActiveScheduleForTask(task, mockSchedules, '20:00')
    expect(result).toBe('evening')
  })

  it('returns last schedule when all schedules have passed (overdue)', () => {
    const task = createTask(['morning', 'afternoon', 'evening'])
    // 23:00 - all schedules have passed
    const result = getActiveScheduleForTask(task, mockSchedules, '23:00')
    expect(result).toBe('evening')
  })

  it('returns the only schedule if task has single schedule', () => {
    const task = createTask(['afternoon'])
    const result = getActiveScheduleForTask(task, mockSchedules, '10:00')
    expect(result).toBe('afternoon')
  })

  it('skips schedules not in task scheduleIds', () => {
    const task = createTask(['morning', 'evening']) // no afternoon
    // 14:00 - morning passed, afternoon not in task, should go to evening
    const result = getActiveScheduleForTask(task, mockSchedules, '14:00')
    expect(result).toBe('evening')
  })

  it('returns null for task with no schedules', () => {
    const task = createTask([])
    const result = getActiveScheduleForTask(task, mockSchedules, '10:00')
    expect(result).toBeNull()
  })
})
