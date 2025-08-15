#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { ConvexHttpClient } from 'convex/browser'

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.CONVEX_URL || '')

class ConvexMcpServer {
  private server: Server

  constructor() {
    this.server = new Server(
      {
        name: 'convex-hackathon-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    )

    this.setupHandlers()
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'convex://tasks',
          mimeType: 'application/json',
          name: 'Tasks Database',
          description: 'All tasks from the Convex database',
        },
        {
          uri: 'convex://users',
          mimeType: 'application/json', 
          name: 'Users Database',
          description: 'All users from the Convex database',
        },
        {
          uri: 'convex://notes',
          mimeType: 'application/json',
          name: 'Notes Database', 
          description: 'All notes from the Convex database',
        },
      ],
    }))

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri.toString()

      try {
        switch (uri) {
          case 'convex://tasks': {
            const tasks = await convex.query('tasks:list', {})
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(tasks, null, 2),
                },
              ],
            }
          }
          case 'convex://users': {
            const users = await convex.query('users:list', {})
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(users, null, 2),
                },
              ],
            }
          }
          case 'convex://notes': {
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: 'Notes require a userId parameter. Use the create-note or list-user-notes tools.',
                },
              ],
            }
          }
          default:
            throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`)
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to read resource ${uri}: ${error}`
        )
      }
    })

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'create-task',
          description: 'Create a new task in the database',
          inputSchema: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'The task description',
              },
            },
            required: ['text'],
          },
        },
        {
          name: 'toggle-task',
          description: 'Toggle a task completion status',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'The task ID to toggle',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'create-user',
          description: 'Create a new user in the database',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'User name',
              },
              email: {
                type: 'string',
                description: 'User email',
              },
              avatarUrl: {
                type: 'string',
                description: 'Optional avatar URL',
              },
            },
            required: ['name', 'email'],
          },
        },
        {
          name: 'create-note',
          description: 'Create a new note for a user',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Note title',
              },
              content: {
                type: 'string',
                description: 'Note content',
              },
              userId: {
                type: 'string',
                description: 'User ID who owns the note',
              },
            },
            required: ['title', 'content', 'userId'],
          },
        },
        {
          name: 'list-user-notes',
          description: 'List all notes for a specific user',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'User ID to get notes for',
              },
            },
            required: ['userId'],
          },
        },
      ],
    }))

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'create-task': {
            const { text } = request.params.arguments as { text: string }
            const taskId = await convex.mutation('tasks:create', { text })
            return {
              content: [
                {
                  type: 'text',
                  text: `Task created successfully with ID: ${taskId}`,
                },
              ],
            }
          }
          
          case 'toggle-task': {
            const { id } = request.params.arguments as { id: string }
            await convex.mutation('tasks:toggle', { id })
            return {
              content: [
                {
                  type: 'text',
                  text: `Task ${id} toggled successfully`,
                },
              ],
            }
          }

          case 'create-user': {
            const { name, email, avatarUrl } = request.params.arguments as {
              name: string
              email: string
              avatarUrl?: string
            }
            const userId = await convex.mutation('users:create', { name, email, avatarUrl })
            return {
              content: [
                {
                  type: 'text',
                  text: `User created successfully with ID: ${userId}`,
                },
              ],
            }
          }

          case 'create-note': {
            const { title, content, userId } = request.params.arguments as {
              title: string
              content: string
              userId: string
            }
            const noteId = await convex.mutation('notes:create', { title, content, userId })
            return {
              content: [
                {
                  type: 'text',
                  text: `Note created successfully with ID: ${noteId}`,
                },
              ],
            }
          }

          case 'list-user-notes': {
            const { userId } = request.params.arguments as { userId: string }
            const notes = await convex.query('notes:listByUser', { userId })
            return {
              content: [
                {
                  type: 'text',
                  text: `Found ${notes.length} notes for user ${userId}:\n${JSON.stringify(notes, null, 2)}`,
                },
              ],
            }
          }

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`)
        }
      } catch (error) {
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`)
      }
    })
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('Convex MCP Server running on stdio')
  }
}

const server = new ConvexMcpServer()
server.run().catch(console.error)