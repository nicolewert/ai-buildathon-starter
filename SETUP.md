# Triple MCP Server Setup Guide

This guide walks you through setting up your hackathon starter with Convex database and triple global MCP server integration (Convex + Vercel + Playwright).

## Quick Setup (Recommended)

The fastest way to get started:

```bash
# 1. Fork and clone this repository
git clone <your-fork-url>
cd ai-buildathon-starter

# 2. Install dependencies
pnpm install

# 3. Set up Convex project
pnpm setup-convex

# 4. Start development (MCP servers auto-configured in .mcp.json)
pnpm dev-full                    # Convex + Next.js
pnpm dev-full-with-playwright   # All services with global Playwright MCP
```

**You're ready to hack!** 🚀

## What Each Command Does

### `pnpm setup-convex`
- Runs `npx convex dev --once` to create your Convex project
- Prompts you to log in with GitHub
- Creates a new Convex deployment
- Automatically adds the Convex URL to `.env.local`
- Sets up the database with your schema

### MCP Server Auto-Configuration
- All MCP servers are configured globally in `.mcp.json`
- Convex and Playwright MCP servers are automatically available in Claude Code
- Vercel MCP requires manual connection: `/connect mcp --url https://mcp.vercel.com` in Claude Code

### `pnpm dev-full`
- Starts Next.js development server (port 3000)
- Starts Convex sync in watch mode
- Note: All MCP servers (Convex, Playwright, Vercel) run globally/hosted, no local setup needed

### `pnpm dev-full-with-playwright`
- Same as `dev-full` - all MCP servers are global now
- Global Playwright MCP server available for browser automation
- Enables web scraping, screenshots, and form automation through Claude

## Manual Setup (If Needed)

If the quick setup doesn't work, here's the step-by-step process:

### 1. Set Up Convex

```bash
# Initialize Convex
npx convex dev

# This will:
# - Prompt you to log in with GitHub
# - Ask you to create a new project or select existing
# - Generate convex/_generated/ files
# - Start syncing your functions
```

### 2. Configure Environment Variables

Copy the Convex URL from the terminal output and add to `.env.local`:

```bash
NEXT_PUBLIC_CONVEX_URL=https://your-deployment-url.convex.cloud
CONVEX_URL=https://your-deployment-url.convex.cloud

# Optional: For advanced Vercel MCP features (usually not needed)
# VERCEL_API_TOKEN=your-vercel-api-token
```

**Note**: Vercel MCP works without API tokens through OAuth. The token is only needed for advanced programmatic access.

### 3. Build and Start MCP Servers

```bash
# All MCP servers are now global, no build steps needed!
# MCP servers are available via .mcp.json configuration
```

### 4. Configure Claude Code MCP Integration

MCP servers are automatically configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "convex": {
      "command": "npx",
      "args": ["-y", "convex@latest", "mcp", "start"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

Vercel MCP is connected separately via: `/connect mcp --url https://mcp.vercel.com`

## Testing Your Setup

### 1. Test Next.js + Convex Integration

Visit `http://localhost:3000` and you should see the homepage. Add the `TaskList` component to test Convex:

```tsx
// In src/app/page.tsx
import { TaskList } from '@/components/TaskList'

export default function Home() {
  return (
    <main className="container mx-auto py-8">
      <TaskList />
    </main>
  )
}
```

### 2. Test Global Convex MCP Server with Claude Code

In Claude Code, try these commands:
- "Show me all tasks from the database"
- "Create a new task called 'Test MCP integration'"
- "List all users"

### 3. Test Playwright MCP Server with Claude Code

In Claude Code, try these commands:
- "Navigate to https://example.com and take a screenshot"
- "Go to Google and search for 'hackathon ideas'"
- "Take a screenshot of the search results"
- "Get the text content from the page"

### 4. Test Vercel MCP Server with Claude Code

After setting up Vercel MCP, try these commands:
- "Search Vercel documentation for deployment configuration"
- "Show me the deployment logs for my latest build"
- "What are the current environment variables for this project?"
- "How do I configure custom domains in Vercel?"

## Troubleshooting

### Convex Issues

**Error: "Missing NEXT_PUBLIC_CONVEX_URL"**
- Make sure `.env.local` exists and has the Convex URL
- Check that the URL starts with `https://`
- Restart your development server after adding env vars

**Error: "ConvexError: Unauthenticated"**
- Run `npx convex auth` to authenticate
- Make sure you're logged into the same GitHub account

### MCP Server Issues

**Error: "Cannot find module"**
- All MCP servers are now global, no local build needed
- Verify `.mcp.json` configuration is correct
- Try running `npx convex@latest mcp start` manually to test

**Claude Code can't find MCP servers**
- Verify `.mcp.json` has correct configurations for all servers
- Ensure you have internet access for global MCP servers
- Restart Claude Code after configuration changes

**Playwright browser not launching**
- Run `npx playwright install` to install browsers
- On Linux, you may need: `npx playwright install-deps`
- Check console output for specific browser launch errors

### Vercel MCP Issues

**Error: "MCP server not connected"**
- Run `/connect mcp --url https://mcp.vercel.com` in Claude Code
- Make sure you have a Vercel account and are logged in
- Check that the MCP server URL is correct in settings

**Error: "Authentication required"**
- Follow the OAuth flow when connecting to Vercel MCP
- Make sure you grant necessary permissions to Claude Code
- Try disconnecting and reconnecting if auth fails

**Error: "No projects found"**
- Ensure you have projects in your Vercel account
- Check that you're connected to the right Vercel team
- Verify your account has access to the projects you're trying to query

### Development Server Issues

**Port conflicts**
- Next.js runs on port 3000
- If port is busy, Next.js will suggest an alternative
- Convex runs its own sync process (no port needed)

**Hot reloading not working**
- Make sure you're using `pnpm dev-full` for all services
- Convex changes auto-sync when files change
- Next.js changes trigger fast refresh

## Adding Sample Data

Load sample data into your Convex database:

```bash
# Import the sample data
npx convex import --table tasks convex/sampleData.jsonl
```

Or create data programmatically in Claude Code:
- "Create a user named John with email john@example.com"
- "Create a task called 'Build awesome hackathon project'"

## MCP Server Capabilities Overview

### Convex MCP Server (Global)
**Purpose**: Real-time database operations
**Tools**: create-task, toggle-task, create-user, create-note, list-user-notes
**Resources**: Tasks, Users, Notes from database
**Use cases**: Data management, CRUD operations, real-time updates

### Playwright MCP Server (Global)
**Purpose**: Browser automation and web scraping
**Tools**: navigate, screenshot, click, type, wait-for-element, evaluate-js, get-text, close-browser
**Resources**: Console logs, current page info, accessibility tree
**Use cases**: Web scraping, form automation, screenshot generation, testing, accessibility validation

### Vercel MCP Server (Hosted)
**Purpose**: Deployment management and documentation
**Tools**: Deployment logs, environment variables, project operations
**Resources**: Vercel documentation, deployment status
**Use cases**: DevOps automation, deployment troubleshooting, documentation search

## Database Schema

Your Convex database includes these tables:

### Tasks
- `text: string` - Task description
- `isCompleted: boolean` - Completion status
- `createdAt: number` - Creation timestamp

### Users
- `name: string` - User's name
- `email: string` - User's email (indexed)
- `avatarUrl?: string` - Optional avatar URL
- `createdAt: number` - Creation timestamp

### Notes
- `title: string` - Note title
- `content: string` - Note content
- `userId: Id<"users">` - Reference to user
- `createdAt: number` - Creation timestamp
- `updatedAt: number` - Last update timestamp

## Next Steps

1. **Customize the schema** - Edit `convex/schema.ts` for your project needs
2. **Add more queries/mutations** - Create new functions in `convex/`
3. **Build your UI** - Use the pre-installed shadcn/ui components
4. **Leverage all MCP servers**:
   - Use Claude Code to manage your database (Convex)
   - Automate web interactions and scraping (Playwright) 
   - Deploy and manage your project (Vercel)
5. **Extend MCP servers** - Add more global servers in `.mcp.json` configuration

## Support

- **Convex Docs**: https://docs.convex.dev/
- **MCP Docs**: https://modelcontextprotocol.io/
- **Issues**: Create issues in your forked repository
- **Claude Code**: Use `/help` for Claude Code assistance