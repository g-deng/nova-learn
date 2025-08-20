import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import GraphViewer from '@/components/graph-viewer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useOutletContext } from 'react-router-dom';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { Node, Link } from '@/components/graph-viewer';

export default function AddDependenciesPage() {
  const navigate = useNavigate();
  const stackId = useOutletContext<string>();
  const [topics, setTopics] = useState<Node[]>([]);
  const [dependencies, setDependencies] = useState<{ from: string, to: string, fromId: string | null, toId: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<{ from: string, to: string, fromId: string | null, toId: string | null }[]>([]);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const guardedNavigate = (path: string) => {
    if (!unsavedChanges || window.confirm("Unsaved changes will be lost. Do you want to continue?")) {
      navigate(path);
    }
  }
  
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = ""; // required for Chrome
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [unsavedChanges]);

  
  useEffect(() => {
    setUnsavedChanges(
      JSON.stringify(dependencies) !== JSON.stringify(saved));
  }, [dependencies, saved])


  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
    const loadExisting = async () => {
      setLoading(true);
      try {
        const topicsResult = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/stacks/${stackId}/topics`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const parsedTopics = topicsResult.data.map((t: any) => {
          return { id: t.id, name: t.name } as Node;
        });
        setTopics(parsedTopics);

        const dependenciesResult = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/stacks/${stackId}/dependencies`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const parsedDependencies = dependenciesResult.data.map((d: any) => ({
          from: parsedTopics.find((t: any) => t.id == d.from_topic_id)?.name || 'error',
          to: parsedTopics.find((t: any) => t.id == d.to_topic_id)?.name || 'error',
          fromId: d.from_topic_id || null,
          toId: d.to_topic_id || null,
        }));
        setDependencies(parsedDependencies);
        setSaved(parsedDependencies);
      } catch (error) {
        console.error("Failed to fetch topics:", error);
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            navigate("/login");
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadExisting();
  }, []);

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
      const generated = res.data.map((dep: string[]) => ({
        from: dep[0], to: dep[1], fromId: null, toId: null
      }));
      setDependencies([...dependencies, ...generated]);
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
        {
          new_dependencies: dependencies.filter(dep => !dep.fromId).map((dep) => [dep.from, dep.to]),
          old_dependencies: saved.reduce((acc, dep) => {
            if (dep.fromId && dep.toId) acc[dep.fromId + "," + dep.toId] = [dep.from, dep.to]; 
            return acc;
          }, {} as Record<string, [string, string]>),
          deleted_dependencies: saved.filter(dep => dep.fromId && !dependencies.some(d => d.fromId == dep.fromId && d.toId == dep.toId)).map(dep => [dep.fromId, dep.toId]),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Dependencies submitted successfully:", res.data);

      if (res.status === 200) {
        setDependencies(dependencies.map(dep => {
          const existing = res.data[dep.from + "," + dep.to];
          return existing ? { ...dep, fromId: existing[0], toId: existing[1] } : dep;
        }));
        setSaved(dependencies);
      }
    } catch (error) {
      console.error("Failed to submit dependencies:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    }
  }

  const editToTopic = (index: number, to: string) => {
    setDependencies(dependencies.map((dep, i) => (i == index) ? { ...dep, to } : dep))
  }

  const editFromTopic = (index: number, from: string) => {
    setDependencies(dependencies.map((dep, i) => (i == index) ? { ...dep, from } : dep))
  }

  const deleteDependency = (index: number) => {
    setDependencies(dependencies.filter((_, i) => i !== index));
  }

  const newDependency = () => {
    setDependencies([...dependencies, { from: '', to: '', fromId: null, toId: null }]);
    console.log(dependencies)
    console.log(topics)
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 flex flex-row">
        <div className="flex-none min-w-[500px] p-2">
          <h2 className="text-xl font-bold"> Edit Dependencies</h2>
          <div className="flex flex-col gap-4 pb-4 overflow-y-auto">
            {dependencies && dependencies.map((dep, index) => (
              <DependencyLine
                key={dep.from + dep.to + index}
                dependency={dep} index={index}
                topics={topics} editToTopic={editToTopic}
                editFromTopic={editFromTopic}
                deleteDependency={deleteDependency} />
            ))}
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-6">
                  <Skeleton className="h-20 flex-1" />
                </div>
              ))
            }
            <Button
              onClick={newDependency}
              variant="outline"
              disabled={(dependencies.length > 0 && (dependencies[dependencies.length - 1].from === '' || dependencies[dependencies.length - 1].to === '')) || undefined}
            >New Dependency
            </Button>
          </div>
          <div className="flex items-center gap-4 pb-4">
            <Button onClick={generateDependencies} disabled={loading || unsavedChanges}>Generate Dependencies</Button>
            <Button onClick={submitDependencies} disabled={loading || !unsavedChanges}>Save Dependencies</Button>
          </div>
        </div>
        <div className="flex-1 h-full pb-4 flex flex-col border border-red-500">
          <h2 className="text-xl font-bold">Dependency Graph</h2>
          <p className="text-sm text-gray-500 pb-2">Only shows saved dependencies.</p>
          <GraphViewer
            nodes={topics}
            links={dependencies.filter(dep => dep.fromId && dep.toId).map(dep => ({
              source: dep.fromId,
              target: dep.toId,
            } as Link))}
            onNodeClick={() => { }}
            onLinkClick={() => { }}
          />
        </div>
      </div>
    </div>
  )
}

export function DependencyLine({ dependency, index, topics, editFromTopic, editToTopic, deleteDependency }: {
  dependency: { from: string; to: string; fromId: string | null; toId: string | null };
  index: number;
  topics: Node[];
  editFromTopic: (index: number, name: string) => void;
  editToTopic: (index: number, description: string) => void;
  deleteDependency: (index: number) => void;
}) {
  const [touched, setTouched] = useState(false);
  return (
    <div className="flex-row items-start" onFocus={() => setTouched(true)} onBlur={() => setTouched(false)}>
      <div className={"flex items-center justify-between p-2 gap-6 border-b "}>
        <Select onValueChange={(newVal) => editFromTopic(index, newVal)} >
          <SelectTrigger className={"w-[180px] " + (dependency.fromId ? "bg-gray-200" : "")}>
            <SelectValue placeholder={dependency.from || "from"} />
          </SelectTrigger>
          <SelectContent>
            {topics.map((topic) => (
              <SelectItem key={topic.id} value={topic.name || ''}>{topic.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(newVal) => editToTopic(index, newVal)}>
          <SelectTrigger className={"w-[180px] " + (dependency.fromId ? "bg-gray-200" : "")}>
            <SelectValue placeholder={dependency.to || "to"} />
          </SelectTrigger>
          <SelectContent>
            {topics.map((topic) => (
              <SelectItem value={topic.name || ''}>{topic.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => deleteDependency(index)} variant="destructive">Delete</Button>
      </div>
      <div className="pt-2">
        {dependency.fromId && touched &&
          <Alert variant="destructive">
            <AlertTitle>
              You are editing an existing dependency
            </AlertTitle>
          </Alert>}
      </div>
    </div>)
}