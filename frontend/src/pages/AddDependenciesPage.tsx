import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';

export default function AddDependenciesPage() {
  const navigate = useNavigate();
  const { stackId } = useParams<{ stackId: string }>();
  const [dependencies, setDependencies] = useState<{ from: string, to: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const generateDependencies = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/stacks/${stackId}/infer_dependencies`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDependencies(res.data);
    } catch (error) {
      console.error("Failed to generate dependencies:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const submitDependencies = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/stacks/${stackId}/submit_dependencies`,
        { dependencies },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Dependencies submitted successfully:", res.data);

      navigate(`/focus/${stackId}`);
    } catch (error) {
      console.error("Failed to submit dependencies:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    }

  }

  return (
    <div>
      <Button onClick={generateDependencies} disabled={loading}>Generate Dependencies</Button>
      {loading ? "loading" : JSON.stringify(dependencies)}
      <Button onClick={submitDependencies}>Submit Dependencies</Button>
    </div>
  )
}