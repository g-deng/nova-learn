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
import GraphViewer from "@/components/graph-viewer";
import type { Node, Link } from "@/components/graph-viewer";
import axios from "axios";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";

export default function FocusPage() {
  const [topics, setTopics] = useState<Node[]>([]);
  const [dependencies, setDependencies] = useState<Link[]>([]);
  const stackId = useOutletContext<string>();
  const navigate = useNavigate();

  const token = localStorage.getItem("authToken");
  if (!token) {
    navigate("/login");
    return;
  }

  const fetchTopicData = async () => {
    try {
      const topicsResult = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/stacks/${stackId}/topics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("topics:", topicsResult.data);
      const parsedTopics = topicsResult.data.map((t: any) => {
        return { id: t.id, name: t.name } as Node;
      });
      setTopics(parsedTopics);
      console.log("topics state set:", topics);
    } catch (error) {
      console.error("Failed to fetch topics:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    }
  }

  const fetchDependencyData = async () => {
    try {
      const dependencyResult = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/stacks/${stackId}/dependencies`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("dependencies:", dependencyResult.data);
      const parsedDeps = dependencyResult.data.map((d: any) => {
        return { source: d.from_topic_id, target: d.to_topic_id } as Link;
      });
      setDependencies(parsedDeps);
      console.log("dependencies state set:", dependencies);
    } catch (error) {
      console.error("Failed to fetch dependencies:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    }
  }

  useEffect(() => {
    fetchTopicData();
    fetchDependencyData();
  }, [navigate, token])

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen">
      <ResizablePanel>
        <Tabs defaultValue="stats" className="w-full h-full">
          <TabsList>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="learn">Learn</TabsTrigger>
            <TabsTrigger value="study">Study</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>
          <TabsContent value="stats">Stats</TabsContent>
          <TabsContent value="learn">Learn</TabsContent>
          <TabsContent value="study">Study</TabsContent>
          <TabsContent value="review">Review</TabsContent>
        </Tabs>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel className="pl-4">
        <Tabs defaultValue="graph" className="w-full h-full">
          <TabsList>
            <TabsTrigger value="graph">Graph View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          <TabsContent value="graph">
            <GraphViewer nodes={topics} links={dependencies} />
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
    </ResizablePanelGroup>
  );
}