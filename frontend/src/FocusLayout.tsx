import { Button } from "@/components/ui/button"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Node, Link } from "@/components/graph-viewer"
import api from "@/lib/api"
import { useNavigate, useOutletContext, Outlet } from "react-router-dom"
import { useEffect, useState } from "react"
import GraphViewer from "@/components/graph-viewer"
import ChatManager from "@/components/chat-manager"

export default function FocusLayout() {
  const [topics, setTopics] = useState<Node[]>([])
  const [dependencies, setDependencies] = useState<Link[]>([])
  const stackId = useOutletContext<string>()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const topicsResult = await api.get(`/stacks/${stackId}/topics`)
        const parsedTopics = topicsResult.data.map((t: any) => ({
          id: t.id,
          name: t.name
        }))
        setTopics(parsedTopics)

        const dependencyResult = await api.get(
          `/stacks/${stackId}/dependencies`
        )
        const parsedDeps = dependencyResult.data.map((d: any) => ({
          source: d.from_topic_id,
          target: d.to_topic_id
        }))
        setDependencies(parsedDeps)
      } catch (err) {
        console.error("Failed to fetch topic/dependency data:", err)
      }
    }

    fetchData()
  }, [stackId])

  return (
    <ResizablePanelGroup direction="horizontal" className="w-full h-full pt-4">
      <ResizablePanel className="pl-4">
        <Tabs defaultValue="graph" className="w-full h-full">
          <TabsList>
            <TabsTrigger value="graph">Graph View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
          <TabsContent value="graph">
            <GraphViewer
              nodes={topics}
              links={dependencies}
              onNodeClick={(node) => {
                navigate("#" + node.id)
              }}
              onLinkClick={() => {}}
            />
          </TabsContent>
          <TabsContent value="list">
            <div>
              <h2 className="text-lg font-semibold mb-4">Topics</h2>
              <ul className="list-disc pl-5">
                {topics.map((topic) => (
                  <li key={topic.id} className="mb-0">
                    <Button
                      variant="link"
                      onClick={() => navigate("#" + topic.id)}
                    >
                      {topic.name}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
          <TabsContent value="chat">
            <ChatManager />
          </TabsContent>
        </Tabs>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        <div className="min-h-0 h-full w-full overflow-hidden">
          <Outlet context={useOutletContext<string>()} />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
