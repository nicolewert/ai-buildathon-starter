import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

export const listByUser = query({
  args: { 
    userId: v.id('users') 
  },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('notes')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect()
  },
})

export const get = query({
  args: { 
    id: v.id('notes') 
  },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id)
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    userId: v.id('users'),
  },
  handler: async (ctx, { title, content, userId }) => {
    const noteId = await ctx.db.insert('notes', {
      title,
      content,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return noteId
  },
})

export const update = mutation({
  args: {
    id: v.id('notes'),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, { id, title, content }) => {
    const note = await ctx.db.get(id)
    if (!note) {
      throw new Error('Note not found')
    }

    await ctx.db.patch(id, {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      updatedAt: Date.now(),
    })
  },
})

export const remove = mutation({
  args: { 
    id: v.id('notes') 
  },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id)
  },
})