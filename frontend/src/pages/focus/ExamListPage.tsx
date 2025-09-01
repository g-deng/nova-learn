import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExamInfo } from "@/pages/focus/ExamInfoPage";
import { Skeleton } from "@/components/ui/skeleton";
import TopicFilter from "@/components/topic-filter";
import { Loader2 } from "lucide-react";

export default function ExamListPage() {
  const [exams, setExams] = useState<ExamInfo[]>([]);
  const [filteredExams, setFilteredExams] = useState<ExamInfo[]>([]);
  const [topicFilter, setTopicFilter] = useState<string[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [openCreator, setOpenCreator] = useState(false);
  const { stackId } = useOutletContext<{ stackId: string }>();
  useEffect(() => {
    setFilteredExams(
      exams.filter((exam) => {
        if (topicFilter.length === 0) return true;
        return topicFilter.every((topic) => exam.topics.includes(topic));
      })
    );
  }, [exams, topicFilter]);

  useEffect(() => {
    const getExams = async () => {
      try {
        setLoadingExams(true);
        const response = await api.get(`/exams/${stackId}/list`);
        setExams(
          response.data.map((examInfo: any) => {
            return {
              id: examInfo.id,
              name: examInfo.name,
              topics: examInfo.topics,
              createdAt: examInfo.created_at,
              bestAttempt: examInfo.best_attempt
                ? {
                    id: examInfo.best_attempt.id,
                    score: examInfo.best_attempt.score,
                    scoredQuestions: examInfo.best_attempt.scored_questions
                  }
                : examInfo
            };
          })
        );
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setLoadingExams(false);
      }
    };
    getExams();
  }, [openCreator, stackId]);

  return (
    <div className="h-full p-4">
      {/* Header */}
      <div className="flex justify-between items-center pb-4">
        <h2 className="text-lg font-bold">Exams</h2>
        <div className="flex gap-2">
          <TopicFilter
            topicFilter={topicFilter}
            setTopicFilter={setTopicFilter}
          />
          <ExamCreator open={openCreator} setOpen={setOpenCreator} />
        </div>
      </div>
      {/* Exam List */}
      <div className="h-full overflow-y-auto">
        {!loadingExams && filteredExams.length === 0 && (
          <div>
            <p>No exams found</p>
          </div>
        )}
        {loadingExams ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredExams.map((exam) => (
              <ExamLine key={exam.id} {...exam} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExamLine({ id, name, topics, createdAt, bestAttempt }: ExamInfo) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <h2 className="font-medium">{name}</h2>
          <p className="text-sm text-muted-foreground">
            {new Date(createdAt).toLocaleString()}
          </p>
        </div>
        {topics && topics.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1 mt-2">
            {topics.map((topic, i) => (
              <Badge key={i} variant="secondary">
                {topic}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-row gap-2">
          <Button
            className="h-6"
            variant="outline"
            onClick={() => navigate(`${id}`)}
          >
            View Exam
          </Button>
          <Button className="h-6" onClick={() => navigate(`${id}/take`)}>
            Take Exam
          </Button>
        </div>
        {bestAttempt?.score && (
          <Badge>
            Best: {bestAttempt.score} / {bestAttempt.scoredQuestions}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function ExamCreator({
  open,
  setOpen
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [numQuestions, setNumQuestions] = useState([5]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const { stackId } = useOutletContext<{ stackId: string }>();

  useEffect(() => {
    const getTopics = async () => {
      try {
        const response = await api.get(`stacks/${stackId}/topics`);
        setTopics(response.data.map((topic: { name: string }) => topic.name));
      } catch (error) {
        console.error("Error fetching topics:", error);
      }
    };
    getTopics();
  }, [stackId]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = async () => {
    try {
      setGenerating(true);
      await api.post(`/exams/${stackId}/generate`, {
        title,
        topics: selectedTopics,
        num_questions: numQuestions[0],
        prompt
      });
      setOpen(false);
    } catch (error) {
      console.error("Error creating exam:", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Generate Exam</Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Generate Exam</DialogTitle>
          <DialogDescription>
            Fill out the details to generate a new exam.
          </DialogDescription>
        </DialogHeader>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Title<span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter exam title"
            required
          />
        </div>

        {/* Topics multiselect */}
        <div className="space-y-2">
          <Label>
            Topics<span className="text-red-500">*</span>
          </Label>
          <div className="flex flex-row justify-between">
            <p className="text-sm text-muted-foreground">
              Selected:{" "}
              {selectedTopics.length > 0 ? selectedTopics.join(", ") : "None"}
            </p>
            {selectedTopics.length > 0 && (
              <p
                className="text-sm text-muted-foreground underline cursor-pointer"
                onClick={() => setSelectedTopics([])}
              >
                Deselect All
              </p>
            )}
            {selectedTopics.length === 0 && (
              <p
                className="text-sm text-muted-foreground underline cursor-pointer"
                onClick={() => setSelectedTopics(topics)}
              >
                Select All
              </p>
            )}
          </div>
          <Command>
            <CommandInput placeholder="Search topics..." />
            <CommandEmpty>No topics found.</CommandEmpty>
            <CommandGroup className="max-h-36 overflow-y-auto">
              {topics.map((topic) => (
                <CommandItem key={topic} onSelect={() => toggleTopic(topic)}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedTopics.includes(topic)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {topic}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </div>

        {/* Number of Questions */}
        <div className="space-y-4">
          <Label>Number of Questions: {numQuestions[0]}</Label>
          <Slider
            min={1}
            max={50}
            step={1}
            value={numQuestions}
            onValueChange={setNumQuestions}
          />
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Input
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Custom instructions..."
          />
        </div>

        <DialogFooter>
          <Button
            disabled={
              generating || title.trim() === "" || selectedTopics.length === 0
            }
            onClick={handleSubmit}
          >
            {generating ? <Loader2 className="mr-2 animate-spin" /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
