import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

function TopicLine({ name, description, deleteTopic, editName, editDescription }: { name: string, description: string, deleteTopic: () => void, editName: (name: string) => void, editDescription: (description: string) => void }) {
  return (
    <div className="flex items-center justify-between p-2 gap-6 border-b">
      <Input required defaultValue={name} onChange={(e) => { editName(e.target.value) }} className="w-[200px]" />
      <Textarea defaultValue={description} onChange={(e) => { editDescription(e.target.value) }} />
      <Button onClick={deleteTopic} variant="destructive">Delete</Button>
    </div>
  );
}

export default function AddTopicsPage() {
  const { stackId } = useParams<{ stackId: string }>();
  const [topics, setTopics] = useState<{ name: string; description: string }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const hasEmptyFields = topics?.some(
    (t) => t.name.trim() === "" || t.description.trim() === ""
  );

  const deleteTopic = (index: number) => {
    setTopics(topics?.filter((_, i) => i !== index) || null);
  }

  const editTopicName = (index: number, name: string) => {
    setTopics(topics?.map((topic, i) => i === index ? { ...topic, name } : topic) || null);
  }

  const editTopicDescription = (index: number, description: string) => {
    setTopics(topics?.map((topic, i) => i === index ? { ...topic, description } : topic) || null);
  }

  const newTopic = () => {
    if (topics && topics.length > 0 && topics[topics.length - 1].name === '') return;
    setTopics([...topics || [], { name: '', description: '' }]);
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
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/stacks/${stackId}/submit_topic_list`,
          {
            stack_id: stackId,
            topics: topics.reduce((acc, topic) => {
              acc[topic.name] = topic.description;
              return acc;
            }, {} as Record<string, string>),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
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

    navigate(`/create-stack/${stackId}/dependencies`);
  }

  const generateTopics = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    if (topics !== null) {
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
          description: res.data[topic] || ''
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
        {loading ?
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-6">
              <Skeleton className="h-10 w-[200px]" />
              <Skeleton className="h-20 flex-1" />
              <Skeleton className="h-10 w-[100px]" />
            </div>
          ))
          : topics?.map((topic, index) => (
            <TopicLine
              key={index}
              name={topic.name}
              description={topic.description}
              deleteTopic={() => deleteTopic(index)}
              editName={(name) => editTopicName(index, name)}
              editDescription={(desc) => editTopicDescription(index, desc)}
            />
          ))}
        <Button onClick={newTopic} variant="outline" disabled={(topics && topics.length > 0 && topics[topics.length - 1].name === '') || undefined}>New Topic</Button>
      </div>
      <Button onClick={submitTopics}>Submit Topics</Button>
    </div>
  )
}