import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('tasks')
      .withIndex('by_created_at')
      .order('desc')
      .collect()
  },
})

export const create = mutation({
  args: { 
    text: v.string() 
  },
  handler: async (ctx, { text }) => {
    const taskId = await ctx.db.insert('tasks', {
      text,
      isCompleted: false,
      createdAt: Date.now(),
    })
    return taskId
  },
})

export const toggle = mutation({
  args: { 
    id: v.id('tasks') 
  },
  handler: async (ctx, { id }) => {
    const task = await ctx.db.get(id)
    if (!task) {
      throw new Error('Task not found')
    }
    
    await ctx.db.patch(id, {
      isCompleted: !task.isCompleted,
    })
  },
})

export const remove = mutation({
  args: { 
    id: v.id('tasks') 
  },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id)
  },
})