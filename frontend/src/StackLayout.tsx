import { Outlet, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";

export default function StackLayout() {
  const { stackId } = useParams<{ stackId: string }>();
  const [stack, setStack] = useState<any>(null);
  const navigate = useNavigate();
  if (!stackId) {
    return <div className="text-red-500">Invalid stack parameters</div>;
  }


  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchStackData = async () => {
      try {
        const stackResult = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/stacks/${stackId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("stack:", stackResult.data);
        setStack(stackResult.data);
      } catch (error) {
        console.error("Failed to fetch stack info:", error);
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            navigate("/login");
          }
        }
      }
    }

    fetchStackData();

  }, [navigate, stackId]);

  return (
    <div className="h-full w-full p-4 flex flex-col">
      <header className="pb-2 flex flex-row gap-4 items-center justify-between border-b">
        <h1 className="text-xl font-bold cursor-pointer" onClick={()=>navigate(`/stack/${stackId}/`)}>{stack?.name}</h1>
        <p className="text-gray-500">{stack?.description}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=>navigate(`/stack/${stackId}/edit-topics`)}>Edit Topics</Button>
          <Button variant="outline" onClick={()=>navigate(`/stack/${stackId}/edit-dependencies`)}>Edit Dependencies</Button>
        </div>
      </header>
      <div className="flex-1">
        <Outlet context={stackId} />
      </div>

    </div>
  );
}
