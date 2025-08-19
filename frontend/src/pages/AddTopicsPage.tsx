import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle } from '@/components/ui/alert';

export default function AddTopicsPage() {
  const { stackId } = useParams<{ stackId: string }>();
  const [topics, setTopics] = useState<{ name: string; description: string; id: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletedTopics, setDeletedTopics] = useState<string[]>([]); // ids
  const navigate = useNavigate();

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

  const hasEmptyFields = topics?.some(
    (t) => !t.name || !t.description || t.name.trim() === "" || t.description.trim() === ""
  );

  const deleteTopic = (index: number) => {
    if (topics[index]?.id) {
      if (window.confirm("Are you sure you want to delete this topic? This action cannot be undone. Associated flashcards and other data will be lost.")) {
        setDeletedTopics([...deletedTopics, topics[index].id]);
      } else {
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
            deleted_topics: deletedTopics
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (saveResult.status === 200) {
          navigate(`/create-stack/${stackId}/dependencies`);
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
      setTopics(topicList);
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
      <Button onClick={generateTopics} disabled={loading}>Generate Topics</Button>
      <div className="flex flex-col gap-4 pb-4">
        {topics && topics.map((topic, index) => (
          <TopicLine key={topic.name + index} topic={topic} index={index} editTopicName={editTopicName} editTopicDescription={editTopicDescription} deleteTopic={deleteTopic} />
        ))}
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-6">
              <Skeleton className="h-10 w-[200px]" />
              <Skeleton className="h-20 flex-1" />
              <Skeleton className="h-10 w-[100px]" />
            </div>
          ))
        }
        <Button onClick={newTopic} variant="outline" disabled={(topics && topics.length > 0 && topics[topics.length - 1].name === '') || undefined}>New Topic</Button>
      </div>
      <Button onClick={submitTopics} disabled={loading}>Submit Topics</Button>
    </div>
  )
}

export function TopicLine({ topic, index, editTopicName, editTopicDescription, deleteTopic }: {
  topic: { name: string; description: string; id: string | null };
  index: number;
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
          onChange={(e) => { editTopicName(index, e.target.value) }}
          className={"w-[200px] " + (topic.id ? "bg-gray-200" : "")}
          onFocus={() => { setTouched(touched + 1); console.log("focus") }}
          onBlur={() => setTouched(touched - 1)}

        />
        <Textarea
          defaultValue={topic.description}
          onChange={(e) => { editTopicDescription(index, e.target.value) }}
          className={(topic.id ? "bg-gray-200" : "")}
          onFocus={() => setTouched(touched + 1)}
          onBlur={() => setTouched(touched - 1)}
        />
        <Button onClick={() => deleteTopic(index)} variant="destructive">Delete</Button>
      </div>
      {topic.id && touched > 0 &&
        <Alert variant="destructive">
          <AlertTitle>
            You are editing an existing topic
          </AlertTitle>
        </Alert>}
    </div>)
}