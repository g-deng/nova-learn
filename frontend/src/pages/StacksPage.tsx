import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import api from "@/lib/api";
import { Loader2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Stack({
  name,
  description,
  id
}: {
  name: string;
  description: string;
  id: string;
}) {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(`/stack/${id}`);
  };
  return (
    <Card onClick={handleClick} className="cursor-pointer hover:bg-muted transition-colors">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default function StacksPage() {
  const [stacks, setStacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStacks = async () => {
      try {
        setLoading(true);
        const res = await api.get("/stacks");
        console.log("stackList:", res.data);
        setStacks(res.data);
      } catch (error) {
        console.error("Failed to fetch stacks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStacks();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-6">
          {(() => {
            const hour = new Date().getHours();
            if (hour < 5) return "Good evening~"
            if (hour < 12) return "Good morning~";
            if (hour < 18) return "Good afternoon~";
            return "Good evening!";
          })()}
        </h1>
        <p className="text-lg mb-4">What do you want to study today?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl w-full px-4">
        <Card
          onClick={() => navigate("/create-stack")}
          className="cursor-pointer hover:bg-muted transition-colors flex flex-col text-center justify-center items-center text-3xl"
        >
          <Plus className="w-10 h-10" />
        </Card>
        {stacks.map((stack: any) => (
          <Stack
            key={stack.id}
            name={stack.name}
            description={stack.description}
            id={stack.id}
          />
        ))}
        {loading && <Loader2 className="animate-spin mr-2" />}
      </div>
    </div>
  );
}
