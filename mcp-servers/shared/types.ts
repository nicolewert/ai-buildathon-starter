export interface MCPServerConfig {
  name: string
  version: string
  description?: string
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

export interface MCPResource {
  uri: string
  mimeType: string
  name: string
  description: string
}

export interface MCPServerCapabilities {
  resources?: {}
  tools?: {}
  prompts?: {}
}