# Integration Testing with Claude Code

This testing setup enables rapid integration validation for hackathon development with Claude Code automation.

## Quick Start

### For Claude Code (Recommended)
```bash
# Single integration check (recommended for Claude)
pnpm ci-check

# Or use the direct script
node tests/claude-integration.js check
```

### For Manual Testing
```bash
# Start development server in background
pnpm dev-bg

# Run integration tests (in another terminal)
pnpm test-integration
```

## Commands

### Package.json Scripts
- `pnpm ci-check` - Full integration check (starts server + runs tests + cleanup)
- `pnpm test-integration` - Run tests only (requires running server)
- `pnpm dev-bg` - Start all services in background (Next.js + Convex + MCP servers)

### Direct Script Usage
```bash
# Quick integration check
node tests/claude-integration.js check

# Continuous integration (retry until pass)
node tests/claude-integration.js continuous

# Start background dev server
node tests/claude-integration.js dev

# Run tests only
node tests/claude-integration.js test

# Install/update dependencies
node tests/claude-integration.js install
```

## Test Coverage

The integration tests validate:

### ✅ Homepage Functionality
- Page loads correctly
- TaskList component renders
- UI components are interactive

### ✅ TaskList Features
- **Create Task**: Add new tasks via form input
- **Toggle Task**: Mark tasks as completed/incomplete
- **Delete Task**: Remove tasks from list
- **Real-time Updates**: Convex synchronization works

### ✅ Full Stack Integration
- Next.js frontend ↔ Convex backend
- Real-time database operations
- UI state management
- Error handling

## Architecture

```
tests/
├── README.md                    # This documentation
├── claude-integration.js        # Claude Code automation script
├── runner.js                   # Test runner with retries
├── integration/
│   └── taskList.test.js        # Playwright integration tests
└── screenshots/                # Failure screenshots
```

## How It Works

1. **Server Startup**: Starts Next.js + Convex + MCP servers in background
2. **Health Check**: Waits for localhost:3000 to be ready
3. **Test Execution**: Runs Playwright tests against live application
4. **Retry Logic**: Automatically retries failed tests up to 3 times
5. **Cleanup**: Properly terminates all background processes
6. **Reporting**: Provides clear pass/fail status with screenshots

## For Claude Code Integration

This setup is optimized for Claude Code to run integration checks automatically:

### Background Mode
```bash
# Claude can run this to start server in background (Ctrl+B)
pnpm dev-bg
```

### Continuous Testing
```bash
# Claude can run this to keep testing until success
pnpm ci-check
```

The script will:
- ✅ Handle server startup/shutdown automatically
- ✅ Retry failed tests without manual intervention
- ✅ Provide clear success/failure feedback
- ✅ Take screenshots of any failures for debugging
- ✅ Continue until all tests pass (perfect for rapid development)

## Troubleshooting

### Port Conflicts
The runner automatically kills processes on port 3000 before starting.

### Test Failures
Check `tests/screenshots/` for failure screenshots showing the exact UI state.

### Convex Connection Issues
Ensure you've run `pnpm setup-convex` to initialize your Convex project.

### MCP Server Issues
Verify MCP servers are configured in `.mcp.json` and available in Claude Code.

## Benefits for Hackathon Development

🚀 **Rapid Validation**: Quickly verify your changes work end-to-end
⚡ **No Manual Steps**: Claude Code handles everything automatically
🔄 **Continuous Integration**: Keeps testing until success
📸 **Visual Debugging**: Screenshots on failures
🧹 **Clean Environment**: Proper cleanup between test runs
🎯 **Real User Testing**: Actual browser interactions with your app