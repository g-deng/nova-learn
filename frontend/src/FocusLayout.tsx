import { Button } from "@/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import type { Node, Link } from "@/components/graph-viewer";
import api from "@/lib/api";
import { useNavigate, useOutletContext, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import GraphViewer from "@/components/graph-viewer";

export default function FocusLayout() {
  const [topics, setTopics] = useState<Node[]>([]);
  const [dependencies, setDependencies] = useState<Link[]>([]);
  const stackId = useOutletContext<string>();
  const navigate = useNavigate();

  const fetchTopicData = async () => {
    try {
      const topicsResult = await api.get(`/stacks/${stackId}/topics`);
      const parsedTopics = topicsResult.data.map((t: any) => {
        return { id: t.id, name: t.name } as Node;
      });
      setTopics(parsedTopics);
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    }
  }

  const fetchDependencyData = async () => {
    try {
      const dependencyResult = await api.get(`/stacks/${stackId}/dependencies`);
      const parsedDeps = dependencyResult.data.map((d: any) => {
        return { source: d.from_topic_id, target: d.to_topic_id } as Link;
      });
      setDependencies(parsedDeps);
    } catch (error) {
      console.error("Failed to fetch dependencies:", error);
    }
  }

  useEffect(() => {
    console.log("Rerender Focus Layout with stackId: ", stackId);
    fetchTopicData();
    fetchDependencyData();
  }, [stackId])

  return (
    <ResizablePanelGroup direction="horizontal" className="w-full h-full pt-4">
      <ResizablePanel className="pl-4">
        <Tabs defaultValue="graph" className="w-full h-full">
          <TabsList>
            <TabsTrigger value="graph">Graph View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          <TabsContent value="graph">
            <GraphViewer
              nodes={topics}
              links={dependencies}
              onNodeClick={(node) => {
                navigate("#" + node.id);
              }}
              onLinkClick={() => { }}
            />
          </TabsContent>
          <TabsContent value="list">
            <div>
              <h2 className="text-lg font-semibold mb-4">Topics</h2>
              <ul className="list-disc pl-5">
                {topics.map((topic) => (
                  <li key={topic.id} className="mb-0">
                    <Button variant="link" onClick={() => navigate("#" + topic.id)}>{topic.name}</Button>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        <Outlet context={useOutletContext<string>()}/>
      </ResizablePanel>
      
    </ResizablePanelGroup>
  );
}