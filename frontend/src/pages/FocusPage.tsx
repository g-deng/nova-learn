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
import { useParams } from "react-router-dom";

export default function FocusPage() {
  const { stackId } = useParams<{ stackId: string }>();
  return (
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
        <GraphViewer />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}