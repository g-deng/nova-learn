import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Stack({ name, description, id }: { name: string, description: string, id: string }) {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(`/focus/${id}`);
  }
  return (
    <Card onClick={handleClick} className="cursor-pointer">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export default function StacksPage() {
  const [stacks, setStacks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchStacks = async () => {
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
        setStacks(res.data);
      } catch (error) {
        console.error("Failed to fetch stacks:", error);
      }
    };

    fetchStacks();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-6">Hi, Grace.</h1>
        <p className="text-lg mb-4">What do you want to study today?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl w-full px-4">
        {stacks.map((stack: any) => (
          <Stack
            key={stack.id}
            name={stack.name}
            description={stack.description}
            id={stack.id}
          />
        ))}
        <Card onClick={()=>navigate("/create-stack")} className="cursor-pointer bg-gray-100 hover:bg-gray-200 transition-colors items-center text-3xl">
          +
        </Card>
      </div>
    </div>
  );
}
