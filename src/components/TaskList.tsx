'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Check } from 'lucide-react'
import { useState } from 'react'

export function TaskList() {
  const tasks = useQuery(api.tasks.list)
  const createTask = useMutation(api.tasks.create)
  const toggleTask = useMutation(api.tasks.toggle)
  const removeTask = useMutation(api.tasks.remove)
  
  const [newTaskText, setNewTaskText] = useState('')

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newTaskText.trim()) {
      await createTask({ text: newTaskText.trim() })
      setNewTaskText('')
    }
  }

  if (tasks === undefined) {
    return <div className="p-4">Loading tasks...</div>
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Tasks
          <Badge variant="secondary">{tasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleCreateTask} className="flex gap-2">
          <Input
            placeholder="Add a new task..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
        
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task._id}
              className={`flex items-center gap-2 p-3 rounded-lg border ${
                task.isCompleted ? 'bg-muted/50' : ''
              }`}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleTask({ id: task._id })}
                className="shrink-0"
              >
                <Check className={`h-4 w-4 ${task.isCompleted ? 'text-green-600' : 'text-muted-foreground'}`} />
              </Button>
              
              <span
                className={`flex-1 ${
                  task.isCompleted ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {task.text}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTask({ id: task._id })}
                className="shrink-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}