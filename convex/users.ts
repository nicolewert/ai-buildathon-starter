import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('users').collect()
  },
})

export const getByEmail = query({
  args: { 
    email: v.string() 
  },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first()
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, { name, email, avatarUrl }) => {
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first()
    
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const userId = await ctx.db.insert('users', {
      name,
      email,
      avatarUrl,
      createdAt: Date.now(),
    })
    return userId
  },
})