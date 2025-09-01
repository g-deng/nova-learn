import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle } from "@/components/ui/alert";
import api from "@/lib/api";
import { ArrowUpFromDot, Check, Loader2, Sparkles } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import DeletionDialog from "./deletion-dialog";

type Dependencies = {
  from_topic_id: string;
  to_topic_id: string;
};

type Topic = {
  id: string | null;
  name: string;
  description: string;
  prerequisites: Dependencies[];
};

export default function StackEditor() {
  const stackId = useOutletContext<string>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [saved, setSaved] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/stacks/${stackId}/topics_with_prereqs`);
        setTopics(res.data);
        setSaved(res.data);
        console.log(res.data);
      } catch (error) {
        console.error("Error fetching topics:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [stackId, navigate]);

  useEffect(() => {
    setUnsavedChanges(JSON.stringify(topics) !== JSON.stringify(saved));
  }, [topics, saved]);

  const editTopic = (id: string | null, field: keyof Topic, value: any) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const saveAll = async () => {
    try {
      const res = await api.post(
        `/stacks/${stackId}/submit_topics_with_prereqs`,
        { topics: topics.filter((t) => t.name !== "") }
      );
      setSaved(topics);
      console.log("Saved:", res.data);
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const generateTopics = async () => {
    try {
      setGenerating(true);
      console.log("Generating");
      const res = await api.post(`/stacks/${stackId}/generate_topics`);
      setTopics(res.data);
      setSaved(res.data);
    } catch (err) {
      console.error("Topic generation failed", err);
    } finally {
      setGenerating(false);
    }
  };

  const generatePrereqs = async () => {
    try {
      setGenerating(true);
      const res = await api.post(`/stacks/${stackId}/infer_dependencies`);
      setTopics(res.data);
      setSaved(res.data);
    } catch (err) {
      console.error("Prerequisite generation failed", err);
    } finally {
      setGenerating(false);
    }
  };

  const addTopic = () => {
    const newTopic: Topic = {
      id: null,
      name: "",
      description: "",
      prerequisites: []
    };
    setTopics((prev) => [...prev, newTopic]);
  };

  return (
    <div className="p-4 flex flex-col gap-4 h-full min-h-0">
      <h1 className="text-2xl font-bold">Manage Topics & Prerequisites</h1>
      <div className="flex gap-2">
        <Button
          onClick={generateTopics}
          disabled={generating || loading || unsavedChanges}
        >
          {generating ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <Sparkles />
          )}{" "}
          Generate Topics
        </Button>
        <Button
          onClick={generatePrereqs}
          disabled={generating || loading || unsavedChanges}
        >
          {generating ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <Sparkles />
          )}{" "}
          Generate Prereqs
        </Button>
        <Button onClick={saveAll} disabled={!unsavedChanges}>
          Save Changes
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4 shadow-inner">
        {loading && <Skeleton className="h-20 w-full" />}
        {topics.map((t) => (
          <TopicCard
            key={t.id || t.name}
            topic={t}
            allTopics={topics}
            onChange={(field, val) => editTopic(t.id, field, val)}
            onDelete={() => {
              if (t.id)
                setTopics((prev) => prev.filter((topic) => topic.id !== t.id));
              else setTopics(topics.slice(0, -1));
            }}
          />
        ))}
        <Button onClick={addTopic} disabled={generating || loading}>
          Add Topic
        </Button>
        {unsavedChanges && (
          <Alert>
            <AlertTitle>Unsaved changes</AlertTitle>
          </Alert>
        )}
      </div>
    </div>
  );
}

function TopicCard({
  topic,
  allTopics,
  onChange,
  onDelete
}: {
  topic: Topic;
  allTopics: Topic[];
  onChange: (field: keyof Topic, value: any) => void;
  onDelete: () => void;
}) {
  const togglePrereq = (id: string) => {
    console.log(id);
    const current = topic.prerequisites;
    const index = topic.prerequisites.findIndex((p) => p.from_topic_id == id);
    if (index != -1) current.splice(index);
    else current.push({from_topic_id: id, to_topic_id: topic.id!});
    onChange("prerequisites", current);
  };

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3">
      <Input
        defaultValue={topic.name}
        onBlur={(e) => onChange("name", e.target.value)}
      />
      <Textarea
        defaultValue={topic.description}
        onBlur={(e) => onChange("description", e.target.value)}
      />

      <label className="text-sm font-medium">Prerequisites</label>
      <div className="flex gap-2 justify-between items-center">
        <div className="flex gap-2 items-center">
          <PrereqSelect
            topic={topic}
            allTopics={allTopics}
            togglePrereq={togglePrereq}
            onChange={onChange}
          />
          {topic.prerequisites.length > 0 && (
            <div className="flex flex-wrap gap-2 h-full">
              {topic.prerequisites.map((p) => (
                p && 
                <Badge
                  className="h-6"
                  key={`${p.from_topic_id}-${p.to_topic_id}`}
                  variant="secondary"
                >
                  {allTopics.find((t) => t.id === p.from_topic_id)?.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <DeletionDialog
          triggerLabel=""
          title="Delete Topic"
          description="This will delete this topic permanently and any associated materials."
          onConfirm={onDelete}
        />
      </div>
    </div>
  );
}

function PrereqSelect({
  topic,
  allTopics,
  togglePrereq,
  onChange
}: {
  topic: Topic;
  allTopics: Topic[];
  togglePrereq: (id: string) => void;
  onChange: (field: keyof Topic, value: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const prereqIds = new Set(topic.prerequisites.map((p) => p.from_topic_id));
  const selected = allTopics.filter((t) => prereqIds.has(t.id!));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <ArrowUpFromDot className="h-4 w-4 rotate-45" />
          {"Select"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0">
        <Command>
          <CommandInput placeholder="Search topics..." />
          <CommandEmpty>No topics found.</CommandEmpty>
          <CommandGroup className="max-h-48 overflow-y-auto">
            {allTopics
              .filter((t) => t.id !== topic.id)
              .map((t) => (
                <CommandItem
                  key={t.id}
                  onSelect={() => togglePrereq(t.id!)}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      prereqIds.has(t.id!) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {t.name}
                </CommandItem>
              ))}
          </CommandGroup>
        </Command>
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1 border-t p-2">
            {selected.map((t) => (
              <Badge
                key={t.id}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => togglePrereq(t.id!)}
              >
                {t.name} ✕
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs"
              onClick={() => onChange("prerequisites", [])}
            >
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
