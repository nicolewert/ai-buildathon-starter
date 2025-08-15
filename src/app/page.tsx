import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TaskList } from "@/components/TaskList"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-16">
          <Badge variant="secondary" className="mb-4">
            Hackathon Starter Template
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Ready to Build
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A minimal Next.js starter with shadcn/ui components, Tailwind CSS, and Claude Code integration. 
            Perfect for rapid hackathon development.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              View Components
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <CardTitle>⚡ Fast Development</CardTitle>
              <CardDescription>
                Turbopack-powered development with instant hot reloading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Pre-configured with Next.js 15, TypeScript, and Turbopack for the fastest development experience.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🎨 Beautiful UI</CardTitle>
              <CardDescription>
                shadcn/ui components with New York styling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Pre-installed essential components like buttons, cards, forms, and more for rapid prototyping.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🗄️ Convex Database</CardTitle>
              <CardDescription>
                Real-time, TypeScript-native database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Built-in Convex integration with MCP server for Claude Code database operations.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-center mb-8">Try the Convex Integration</h2>
          <TaskList />
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Ready for Your Next Hackathon</h2>
          <p className="text-muted-foreground">
            Start building immediately with this carefully crafted foundation
          </p>
        </div>
      </div>
    </div>
  )
}
