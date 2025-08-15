# Hackathon Starter

A minimal Next.js starter template optimized for rapid hackathon development.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Convex (real-time, TypeScript-native)
- **Styling**: Tailwind CSS v3
- **Components**: shadcn/ui (New York style)
- **Package Manager**: pnpm
- **Build Tool**: Turbopack for fast development
- **Language**: TypeScript
- **MCP Servers**: Convex (local) + Puppeteer (local) + Vercel (hosted) for Claude Code

## Quick Setup for Triple MCP Integration

**One-time setup (per fork):**
```bash
# 1. Install dependencies
pnpm install

# 2. Set up Convex project (creates your database)
pnpm setup-convex

# 3. Connect all MCP servers to Claude Code
pnpm mcp-connect-all

# 4. Set up Vercel MCP integration (optional but recommended)
pnpm setup-vercel-mcp
```

**Daily development:**
```bash
# Standard development (Next.js + Convex + Convex MCP)
pnpm dev-full

# Full development with browser automation
pnpm dev-full-with-puppeteer

# Background development (for Claude Code integration testing)
pnpm dev-bg

# Note: Vercel MCP runs hosted, so no local setup needed
```

## Standard Next.js Commands

```bash
# Start development server only
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Global styles and CSS variables
│   ├── layout.tsx       # Root layout with ConvexClientProvider
│   └── page.tsx         # Homepage
├── components/
│   ├── ui/              # shadcn/ui components
│   └── TaskList.tsx     # Example Convex integration component
├── providers/
│   └── ConvexClientProvider.tsx  # Convex React provider
└── lib/
    └── utils.ts         # Utility functions

convex/
├── schema.ts            # Database schema (tasks, users, notes)
├── tasks.ts             # Task queries and mutations
├── users.ts             # User queries and mutations
├── notes.ts             # Notes queries and mutations
└── sampleData.jsonl     # Sample data for testing

mcp-servers/             # Organized MCP server architecture
├── convex/              # Database operations
│   ├── index.ts         # Convex MCP server
│   ├── tsconfig.json    # TypeScript config
│   └── package.json     # Dependencies
├── puppeteer/           # Browser automation
│   ├── index.ts         # Puppeteer MCP server  
│   ├── tsconfig.json    # TypeScript config
│   └── package.json     # Dependencies
└── shared/              # Common utilities
    └── types.ts         # Shared MCP types

.claude/
├── settings.json        # Claude Code + Triple MCP configuration
├── commands/            # Custom Claude commands
└── agents/              # Specialized agent configurations

tests/                   # Integration testing with Claude Code
├── README.md            # Testing documentation
├── claude-integration.js # Claude Code automation script
├── runner.js            # Test runner with retries
├── integration/         # Puppeteer integration tests
│   └── taskList.test.js # TaskList component tests
└── screenshots/         # Failure screenshots
```

## Available shadcn/ui Components

Pre-installed components for rapid prototyping:
- Button, Card, Input, Label, Textarea
- Select, Form, Dropdown Menu, Dialog
- Alert, Badge, Separator, Avatar

Add more components:
```bash
pnpm dlx shadcn@latest add [component-name]
```

## Development Commands

### MCP Server Commands
- `pnpm setup-convex` - One-time Convex project setup
- `pnpm dev-full` - Start Next.js + Convex + Convex MCP
- `pnpm dev-full-with-puppeteer` - Start all services + browser automation
- `pnpm dev-bg` - Background development (for Claude integration testing)
- `pnpm mcp-connect-all` - Connect all MCP servers to Claude Code
- `pnpm mcp:build` - Build all MCP servers
- `pnpm mcp:build:convex` - Build Convex MCP server only
- `pnpm mcp:build:puppeteer` - Build Puppeteer MCP server only
- `pnpm mcp:dev:convex` - Start Convex MCP server only
- `pnpm mcp:dev:puppeteer` - Start Puppeteer MCP server only

### Integration Testing Commands
- `pnpm ci-check` - Full integration check (Claude Code recommended)
- `pnpm test-integration` - Run Puppeteer integration tests only

### Standard Commands
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Lint code
- `pnpm type-check` - Run TypeScript type checking

## Claude Code Integration

This project includes triple MCP server integration with Claude Code:

### Convex MCP Server (Local)
- **Database Resources**: Read tasks, users, notes from Convex
- **Database Tools**: Create/update tasks, users, notes via Claude
- **Real-time Sync**: Changes reflect immediately in your app
- **Custom Schema**: Tailored to your project's data structure

### Puppeteer MCP Server (Local)
- **Browser Automation**: Navigate websites, fill forms, take screenshots
- **Web Scraping**: Extract data from dynamic web pages
- **Testing Support**: Automate UI testing and form interactions
- **Security-First**: Controlled browser environment with safety measures

### Vercel MCP Server (Hosted)
- **Deployment Management**: Access deployment logs and status
- **Documentation Search**: Query official Vercel documentation
- **Project Operations**: Manage environment variables and settings
- **Error Resolution**: AI-assisted deployment troubleshooting

### Additional Features
- **Settings**: Hook configuration in `.claude/settings.json`
- **Commands**: Empty commands folder for custom Claude commands
- **Agents**: Pre-configured specialized agents for UI, API, and DevOps tasks

## Environment Variables

Environment variables are automatically configured by `pnpm setup-convex`:
```bash
# Auto-configured by setup-convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_URL=https://your-deployment.convex.cloud

# Optional: For advanced Puppeteer configuration
# PUPPETEER_EXECUTABLE_PATH=/path/to/chrome
# PUPPETEER_HEADLESS=true

# Add additional environment variables here
# NEXT_PUBLIC_API_URL=
# API_SECRET_KEY=
```

## Deployment

This project is optimized for deployment on Vercel:
```bash
# Deploy to Vercel
npx vercel
```

## Tips for Hackathons

1. **Fast UI Development**: Use pre-installed shadcn/ui components
2. **Rapid Database Setup**: Convex handles backend instantly
3. **Real-time Features**: Convex subscriptions for live updates
4. **AI-Assisted Development**: Triple MCP servers for database, browser automation, and deployment
5. **Web Automation**: Puppeteer MCP for data scraping and form automation
6. **Rapid Styling**: Leverage Tailwind's utility classes
7. **Type Safety**: TypeScript + Convex for end-to-end type safety
8. **Performance**: Turbopack enables fast hot reloading
9. **Continuous Integration**: Use `pnpm ci-check` for automatic testing with Claude Code
10. **Complete AI Workflow**: From database to browser automation to deployment, all manageable through Claude Code
11. **Scalable Architecture**: Organized MCP structure for easy extension

## License

MIT License - feel free to use this template for your hackathon projects!