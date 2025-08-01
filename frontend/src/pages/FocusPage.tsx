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
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

export default function FocusPage() {
  const { stackName, stackId } = useParams<{ stackName: string, stackId: string }>();
  const navigate = useNavigate();

  console.log("FocusPage stackName:", stackName);
  console.log("FocusPage stackId:", stackId);

  if (!stackName || !stackId) {
    return <div className="text-red-500">Invalid stack parameters</div>;
  }

  const token = localStorage.getItem("authToken");
  if (!token) {
    navigate("/login");
    return;
  }

  const fetchFocusData = async () => {
    try {
      const res = await axios.get(
        import.meta.env.VITE_BACKEND_URL + "/api/stacks",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("stackList:", res.data);
    } catch (error) {
      console.error("Failed to fetch stacks:", error);
    }
  }


  return (
    <div>
      <header>
        <h1 className="text-xl font-bold">{stackName}</h1>
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
          <GraphViewer />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}