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
import puppeteer, { Browser, Page } from 'puppeteer'

interface BrowserSession {
  browser: Browser
  page: Page
  lastActivity: number
}

class PuppeteerMcpServer {
  private server: Server
  private session: BrowserSession | null = null
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  private consoleLogs: string[] = []

  constructor() {
    this.server = new Server(
      {
        name: 'puppeteer-hackathon-server',
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
    this.startCleanupTimer()
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'puppeteer://console-logs',
          mimeType: 'text/plain',
          name: 'Console Logs',
          description: 'Browser console logs from the current session',
        },
        {
          uri: 'puppeteer://current-page',
          mimeType: 'application/json',
          name: 'Current Page Info',
          description: 'Information about the currently loaded page',
        },
      ],
    }))

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri.toString()

      try {
        switch (uri) {
          case 'puppeteer://console-logs': {
            return {
              contents: [
                {
                  uri,
                  mimeType: 'text/plain',
                  text: this.consoleLogs.join('\n') || 'No console logs available',
                },
              ],
            }
          }
          case 'puppeteer://current-page': {
            if (!this.session?.page) {
              return {
                contents: [
                  {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify({ error: 'No browser session active' }, null, 2),
                  },
                ],
              }
            }

            const url = this.session.page.url()
            const title = await this.session.page.title()
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify({ url, title, sessionActive: true }, null, 2),
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
          name: 'navigate',
          description: 'Navigate to a URL in the browser',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The URL to navigate to',
              },
            },
            required: ['url'],
          },
        },
        {
          name: 'screenshot',
          description: 'Take a screenshot of the current page or a specific element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'Optional CSS selector to screenshot a specific element',
              },
              fullPage: {
                type: 'boolean',
                description: 'Take a full page screenshot (default: false)',
              },
            },
            required: [],
          },
        },
        {
          name: 'click',
          description: 'Click an element on the page',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector of the element to click',
              },
            },
            required: ['selector'],
          },
        },
        {
          name: 'type',
          description: 'Type text into an input field',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector of the input field',
              },
              text: {
                type: 'string',
                description: 'Text to type',
              },
              clear: {
                type: 'boolean',
                description: 'Clear the field before typing (default: true)',
              },
            },
            required: ['selector', 'text'],
          },
        },
        {
          name: 'wait-for-element',
          description: 'Wait for an element to appear on the page',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector to wait for',
              },
              timeout: {
                type: 'number',
                description: 'Maximum time to wait in milliseconds (default: 5000)',
              },
            },
            required: ['selector'],
          },
        },
        {
          name: 'evaluate-js',
          description: 'Execute JavaScript code in the browser context',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'JavaScript code to execute',
              },
            },
            required: ['code'],
          },
        },
        {
          name: 'get-text',
          description: 'Get text content from an element or the page',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector to get text from (optional - gets page text if not provided)',
              },
            },
            required: [],
          },
        },
        {
          name: 'close-browser',
          description: 'Close the current browser session',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      ],
    }))

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'navigate': {
            const { url } = request.params.arguments as { url: string }
            await this.ensureBrowser()
            
            // Basic URL validation
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
              throw new Error('URL must start with http:// or https://')
            }

            await this.session!.page.goto(url, { waitUntil: 'networkidle2' })
            this.updateActivity()

            return {
              content: [
                {
                  type: 'text',
                  text: `Successfully navigated to ${url}`,
                },
              ],
            }
          }

          case 'screenshot': {
            const { selector, fullPage = false } = request.params.arguments as {
              selector?: string
              fullPage?: boolean
            }
            await this.ensureBrowser()

            let screenshot: string
            if (selector) {
              const element = await this.session!.page.$(selector)
              if (!element) {
                throw new Error(`Element not found: ${selector}`)
              }
              screenshot = await element.screenshot({ encoding: 'base64' })
            } else {
              screenshot = await this.session!.page.screenshot({ 
                encoding: 'base64',
                fullPage 
              })
            }
            
            this.updateActivity()

            return {
              content: [
                {
                  type: 'image',
                  data: screenshot,
                  mimeType: 'image/png',
                },
                {
                  type: 'text',
                  text: selector 
                    ? `Screenshot taken of element: ${selector}`
                    : `Screenshot taken of ${fullPage ? 'full page' : 'viewport'}`,
                },
              ],
            }
          }

          case 'click': {
            const { selector } = request.params.arguments as { selector: string }
            await this.ensureBrowser()

            await this.session!.page.click(selector)
            this.updateActivity()

            return {
              content: [
                {
                  type: 'text',
                  text: `Successfully clicked element: ${selector}`,
                },
              ],
            }
          }

          case 'type': {
            const { selector, text, clear = true } = request.params.arguments as {
              selector: string
              text: string
              clear?: boolean
            }
            await this.ensureBrowser()

            if (clear) {
              await this.session!.page.click(selector, { clickCount: 3 })
            }
            await this.session!.page.type(selector, text)
            this.updateActivity()

            return {
              content: [
                {
                  type: 'text',
                  text: `Successfully typed "${text}" into ${selector}`,
                },
              ],
            }
          }

          case 'wait-for-element': {
            const { selector, timeout = 5000 } = request.params.arguments as {
              selector: string
              timeout?: number
            }
            await this.ensureBrowser()

            await this.session!.page.waitForSelector(selector, { timeout })
            this.updateActivity()

            return {
              content: [
                {
                  type: 'text',
                  text: `Element found: ${selector}`,
                },
              ],
            }
          }

          case 'evaluate-js': {
            const { code } = request.params.arguments as { code: string }
            await this.ensureBrowser()

            const result = await this.session!.page.evaluate(code)
            this.updateActivity()

            return {
              content: [
                {
                  type: 'text',
                  text: `JavaScript executed successfully. Result: ${JSON.stringify(result)}`,
                },
              ],
            }
          }

          case 'get-text': {
            const { selector } = request.params.arguments as { selector?: string }
            await this.ensureBrowser()

            let text: string
            if (selector) {
              const element = await this.session!.page.$(selector)
              if (!element) {
                throw new Error(`Element not found: ${selector}`)
              }
              text = await this.session!.page.$eval(selector, el => el.textContent || '')
            } else {
              text = await this.session!.page.evaluate(() => document.body.textContent || '')
            }
            
            this.updateActivity()

            return {
              content: [
                {
                  type: 'text',
                  text: selector 
                    ? `Text from ${selector}: ${text}`
                    : `Page text: ${text.substring(0, 1000)}${text.length > 1000 ? '...' : ''}`,
                },
              ],
            }
          }

          case 'close-browser': {
            await this.closeBrowser()
            return {
              content: [
                {
                  type: 'text',
                  text: 'Browser session closed',
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

  private async ensureBrowser(): Promise<void> {
    if (!this.session || !this.session.browser.connected) {
      await this.createBrowserSession()
    }
  }

  private async createBrowserSession(): Promise<void> {
    try {
      const browser = await puppeteer.launch({
        headless: false, // Set to true for headless mode
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--allow-running-insecure-content',
        ],
      })

      const page = await browser.newPage()
      
      // Set user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      // Set viewport
      await page.setViewport({ width: 1280, height: 720 })

      // Listen to console logs
      page.on('console', (msg) => {
        const logEntry = `[${msg.type()}] ${msg.text()}`
        this.consoleLogs.push(logEntry)
        
        // Keep only last 100 logs
        if (this.consoleLogs.length > 100) {
          this.consoleLogs = this.consoleLogs.slice(-100)
        }
      })

      this.session = {
        browser,
        page,
        lastActivity: Date.now(),
      }

      console.error('Browser session created successfully')
    } catch (error) {
      throw new McpError(ErrorCode.InternalError, `Failed to create browser session: ${error}`)
    }
  }

  private updateActivity(): void {
    if (this.session) {
      this.session.lastActivity = Date.now()
    }
  }

  private async closeBrowser(): Promise<void> {
    if (this.session) {
      try {
        await this.session.browser.close()
      } catch (error) {
        console.error('Error closing browser:', error)
      }
      this.session = null
      this.consoleLogs = []
    }
  }

  private startCleanupTimer(): void {
    setInterval(async () => {
      if (this.session && Date.now() - this.session.lastActivity > this.SESSION_TIMEOUT) {
        console.error('Browser session timed out, closing...')
        await this.closeBrowser()
      }
    }, 60000) // Check every minute
  }

  async run() {
    // Ensure cleanup on exit
    process.on('SIGINT', async () => {
      await this.closeBrowser()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      await this.closeBrowser()
      process.exit(0)
    })

    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('Puppeteer MCP Server running on stdio')
  }
}

const server = new PuppeteerMcpServer()
server.run().catch(console.error)