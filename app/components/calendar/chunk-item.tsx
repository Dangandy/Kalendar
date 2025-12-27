'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { Task, ChunkInstance } from '@/lib/store/types'

interface ChunkItemProps {
  chunk: Task
  instance: ChunkInstance | undefined
  onToggle: () => void
}

export function ChunkItem({ chunk, instance, onToggle }: ChunkItemProps) {
  const isCompleted = instance?.completed ?? false

  return (
    <div className="flex items-center gap-2 pl-6">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={onToggle}
        className="h-3 w-3"
      />
      <span
        className={cn(
          'text-xs',
          isCompleted && 'line-through text-muted-foreground'
        )}
      >
        {chunk.title}
      </span>
    </div>
  )
}
