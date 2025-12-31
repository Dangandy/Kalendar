'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Task } from '@/lib/store/types'

interface TaskLinkConfig {
  triggerTaskId: string
  delayMinutes: number
}

interface TaskLinkSelectorProps {
  value: TaskLinkConfig | null
  availableTasks: Task[]
  onChange: (config: TaskLinkConfig | null) => void
}

export function TaskLinkSelector({
  value,
  availableTasks,
  onChange,
}: TaskLinkSelectorProps) {
  const [enabled, setEnabled] = useState(value !== null)

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked)
    if (!checked) {
      onChange(null)
    } else if (availableTasks.length > 0) {
      onChange({
        triggerTaskId: availableTasks[0].id,
        delayMinutes: 30,
      })
    }
  }

  const handleTaskChange = (taskId: string) => {
    onChange({
      triggerTaskId: taskId,
      delayMinutes: value?.delayMinutes ?? 30,
    })
  }

  const handleDelayChange = (delayStr: string) => {
    const delay = parseInt(delayStr, 10)
    if (!isNaN(delay) && delay >= 0 && value) {
      onChange({
        ...value,
        delayMinutes: delay,
      })
    }
  }

  if (availableTasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tasks available to link. Create other tasks first.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox
          id="enable-link"
          checked={enabled}
          onCheckedChange={handleEnabledChange}
        />
        <Label htmlFor="enable-link" className="text-sm font-normal">
          Schedule after another task completes
        </Label>
      </div>

      {enabled && (
        <div className="pl-6 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Trigger task</Label>
            <Select
              value={value?.triggerTaskId}
              onValueChange={handleTaskChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a task" />
              </SelectTrigger>
              <SelectContent>
                {availableTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Delay (minutes after completion)</Label>
            <Input
              type="number"
              min={0}
              value={value?.delayMinutes ?? 30}
              onChange={(e) => handleDelayChange(e.target.value)}
              className="w-32"
            />
          </div>
        </div>
      )}
    </div>
  )
}
