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
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function FocusPage() {
  const { stackId } = useParams<{ stackId: string }>();
  const [topics, setTopics] = useState<Node[]>([]);
  const [dependencies, setDependencies] = useState<Link[]>([]);
  const navigate = useNavigate();

  if (!stackId) {
    return <div className="text-red-500">Invalid stack parameters</div>;
  }

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
  }, [navigate, stackId, token])

  return (
    <div>
      <header>
        <h1 className="text-xl font-bold">"Placeholder"</h1>
      </header>
      <ResizablePanelGroup direction="horizontal" className="min-h-screen">
        <ResizablePanel>
          <Tabs defaultValue="stats" className="w-full h-full p-4">
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
        <ResizableHandle withHandle />
        <ResizablePanel>
          <GraphViewer nodes={topics} links={dependencies}/>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}