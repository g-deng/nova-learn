import { Outlet, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
          `${import.meta.env.VITE_BACKEND_URL}/api/stacks/${stackId}`,
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
    <div>
      <header className="flex items-center gap-4 pb-4">
        <h1 className="text-xl font-bold">{stack?.name}</h1>
        <p className="text-gray-500">{stack?.description}</p>
      </header>
      <Outlet context={stackId} />
    </div>
  );
}
