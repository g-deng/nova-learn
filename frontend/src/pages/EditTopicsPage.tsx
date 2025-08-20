import { useEffect, useState } from 'react';
import axios from 'axios';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle } from '@/components/ui/alert';

export default function AddTopicsPage() {
  const stackId = useOutletContext<string>();
  const [topics, setTopics] = useState<{ name: string; description: string; id: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [repeatedNames, setRepeatedNames] = useState<string[]>([]); // repeated names
  const [saved, setSaved] = useState<{ name: string; description: string; id: string | null }[]>([]);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const navigate = useNavigate();
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
          return { name: t.name, description: t.description || '', id: t.id };
        });
        setTopics(parsedTopics);
        setSaved(parsedTopics);
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

  useEffect(() => {
    const names = new Set<string>();
    const repeated = [];
    for (const topic of topics) {
      if (names.has(topic.name)) {
        repeated.push(topic.name);
      } else {
        names.add(topic.name);
      }
    }
    setRepeatedNames(repeated);
  }, [topics]);

  useEffect(() => {
    setUnsavedChanges(
      JSON.stringify(topics) !== JSON.stringify(saved));
  }, [topics, saved])

  const hasEmptyFields = topics?.some(
    (t) => !t.name || !t.description || t.name.trim() === "" || t.description.trim() === ""
  );

  const deleteTopic = (index: number) => {
    if (topics[index]?.id) {
      if (!window.confirm("Are you sure you want to delete this topic? This action cannot be undone if you save it. Associated flashcards and other data will be lost.")) {
        return;
      }
    }
    setTopics(topics?.filter((_, i) => i !== index) || null);
    console.log("Deleted topic at index:", index);
    console.log(topics);
  }

  const editTopicName = (index: number, name: string) => {
    setTopics(topics?.map((topic, i) => i === index ? { ...topic, name } : topic) || null);
  }

  const editTopicDescription = (index: number, description: string) => {
    setTopics(topics?.map((topic, i) => i === index ? { ...topic, description } : topic) || null);
  }

  const newTopic = () => {
    if (topics && topics.length > 0 && topics[topics.length - 1].name === '') return;
    setTopics([...topics || [], { name: '', description: '', id: null }]);
  }

  const submitTopics = () => {
    if (hasEmptyFields) {
      alert("Please fill in all fields before submitting.");
      return;
    }
    if (repeatedNames.length > 0) {
      alert("Cannot have multiple topics with the same name: " + repeatedNames.join(", "));
      return;
    }
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    if (topics === null) {
      return;
    }

    const saveTopics = async () => {
      try {
        const saveResult = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/stacks/${stackId}/submit_topic_list`,
          {
            stack_id: stackId,
            new_topics: topics.reduce((acc, topic) => {
              if (!topic.id) acc[topic.name] = topic.description;
              return acc;
            }, {} as Record<string, string>),
            old_topics: topics.reduce((acc, topic) => {
              if (topic.id) acc[topic.id] = [topic.name, topic.description];
              return acc;
            }, {} as Record<string, [string, string]>),
            deleted_topics: saved.filter(t => t.id && !topics.some(topic => topic.id === t.id)).map(t => t.id),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (saveResult.status === 200) {
          for (const name in saveResult.data) {
            const index = topics.findIndex(t => t.name === name);
            if (index !== -1) {
              topics[index].id = saveResult.data[name];
            }
          }
          setSaved(topics);
          // navigate(`/create-stack/${stackId}/dependencies`);
        }
      } catch (error) {
        console.error("Failed to save topics:", error);
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            navigate("/login");
          }
        }
      }
    }
    saveTopics();
  }

  const generateTopics = async () => {
    console.log("Generating topics...");
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/stacks/${stackId}/generate_topics`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      var topicList = [];
      for (const topic in res.data) {
        topicList.push({
          name: topic,
          description: res.data[topic] || '',
          id: null
        });
      }
      console.log("Parsed topic list:", topicList);
      setTopics([...topics, ...topicList]);
    } catch (error) {
      console.error("Failed to generate topics:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header>
        <h1 className="text-xl font-bold">Edit Topics</h1>
      </header>
      <div className="flex flex-col gap-4 pb-4 overflow-y-auto">
        {topics && topics.map((topic, index) => (
          <TopicLine key={topic.name + index} topic={topic} index={index} repeatedNames={repeatedNames} editTopicName={editTopicName} editTopicDescription={editTopicDescription} deleteTopic={deleteTopic} />
        ))}
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-6">
              <Skeleton className="h-20 flex-1" />
            </div>
          ))
        }
        <Button onClick={newTopic} variant="outline" disabled={(loading) || (topics && topics.length > 0 && topics[topics.length - 1].name === '') || undefined}>New Topic</Button>
      </div>
      <div className="flex items-center gap-4 pb-4">
        <Button onClick={generateTopics} disabled={loading || unsavedChanges}>Generate Topics</Button>
        <Button onClick={submitTopics} disabled={loading || !unsavedChanges}>Save Changes</Button>
        <Button onClick={() => guardedNavigate(`/stack/${stackId}/edit-dependencies`)} disabled={loading}>Edit Dependencies</Button>
      </div>
    </div>
  )
}

export function TopicLine({ topic, index, repeatedNames, editTopicName, editTopicDescription, deleteTopic }: {
  topic: { name: string; description: string; id: string | null };
  index: number;
  repeatedNames: string[];
  editTopicName: (index: number, name: string) => void;
  editTopicDescription: (index: number, description: string) => void;
  deleteTopic: (index: number) => void;
}) {
  const [touched, setTouched] = useState(0);
  return (
    <div className="flex-row items-start">
      <div className={"flex items-center justify-between p-2 gap-6 border-b"}>
        <Input
          required
          defaultValue={topic.name}
          className={"w-[200px] " + (topic.id ? "bg-gray-200" : "")}
          onFocus={() => { setTouched(touched + 1); console.log("focus") }}
          onBlur={(e) => { editTopicName(index, e.target.value); setTouched(touched - 1) }}

        />
        <Textarea
          defaultValue={topic.description}
          className={(topic.id ? "bg-gray-200" : "")}
          onFocus={() => setTouched(touched + 1)}
          onBlur={(e) => { editTopicDescription(index, e.target.value); setTouched(touched - 1) }}
        />
        <Button onClick={() => deleteTopic(index)} variant="destructive">Delete</Button>
      </div>
      <div className="flex flex-col gap-2 pt-2">
        {topic.id && touched > 0 &&
          <Alert variant="destructive">
            <AlertTitle>
              You are editing an existing topic
            </AlertTitle>
          </Alert>}
        {repeatedNames.includes(topic.name) &&
          <Alert variant="destructive">
            <AlertTitle>
              Cannot have multiple topics with the same name
            </AlertTitle>
          </Alert>}
      </div>

    </div>)
}