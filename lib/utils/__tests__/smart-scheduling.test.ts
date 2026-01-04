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
