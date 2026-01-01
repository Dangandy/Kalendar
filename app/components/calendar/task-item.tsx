'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatTimeDisplay } from '@/lib/utils/time'
import { ChunkItem } from './chunk-item'
import type { Task, TaskInstance, ChunkInstance } from '@/lib/store/types'

interface TaskItemProps {
  task: Task
  instance: TaskInstance | undefined
  chunks: Task[]
  chunkInstances: ChunkInstance[]
  onToggleTask: () => void
  onToggleChunk: (chunkInstanceId: string) => void
}

const priorityColors: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-blue-500',
  4: 'bg-gray-400',
}

export function TaskItem({
  task,
  instance,
  chunks,
  chunkInstances,
  onToggleTask,
  onToggleChunk,
}: TaskItemProps) {
  const [expanded, setExpanded] = useState(false)
  const isCompleted = instance?.completed ?? false
  const hasChunks = chunks.length > 0

  return (
    <div className="bg-background rounded border p-2">
      <div className="flex items-center gap-2">
        {hasChunks && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 hover:bg-muted rounded"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        <Checkbox
          checked={isCompleted}
          onCheckedChange={onToggleTask}
          className="h-4 w-4"
        />
        <span
          className={cn(
            'flex-1 text-sm',
            isCompleted && 'line-through text-muted-foreground'
          )}
        >
          {task.title}
          {instance?.startTime && (
            <span className="ml-2 text-xs text-muted-foreground">
              @ {formatTimeDisplay(instance.startTime)}
            </span>
          )}
          {task.startDate && (
            <span className="ml-2 text-xs text-muted-foreground">
              starts {task.startDate}
            </span>
          )}
          {task.scheduleIds.length > 1 && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({task.scheduleIds.length} schedules)
            </span>
          )}
        </span>
        <Badge
          variant="secondary"
          className={cn('text-white text-xs px-1.5 py-0', priorityColors[task.priority])}
        >
          P{task.priority}
        </Badge>
      </div>

      {task.description && (
        <p className="mt-1 ml-6 text-xs text-muted-foreground">
          {task.description}
        </p>
      )}

      {expanded && hasChunks && (
        <div className="mt-2 space-y-1">
          {chunks.map((chunk) => {
            const chunkInstance = chunkInstances.find(
              (ci) => ci.chunkId === chunk.id
            )
            return (
              <ChunkItem
                key={chunk.id}
                chunk={chunk}
                instance={chunkInstance}
                onToggle={() => chunkInstance && onToggleChunk(chunkInstance.id)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
