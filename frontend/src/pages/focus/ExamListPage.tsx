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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExamInfo } from "./ExamInfoPage";

export default function ExamListPage() {
  const [exams, setExams] = useState<ExamInfo[]>([]);
  const [openCreator, setOpenCreator] = useState(false);
  const stackId = useOutletContext<string>();
  const navigate = useNavigate();

  useEffect(() => {
    const getExams = async () => {
      try {
        const response = await api.get(`/exams/${stackId}/list`);
        setExams(response.data.map((examInfo: any) => {
          return {
            id: examInfo.id,
            name: examInfo.name,
            topics: examInfo.topics,
            createdAt: examInfo.created_at,
            bestAttempt: examInfo.best_attempt ? {
              id: examInfo.best_attempt.id,
              score: examInfo.best_attempt.score,
              scoredQuestions: examInfo.best_attempt.scored_questions
            } : examInfo
          };
        }));
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching exams:", error);
      }
    }
    getExams();
  }, [openCreator]);

  return (
    <div className="h-full p-4">
      <div className="flex justify-between items-center pb-4">
        <h2 className="text-lg font-bold">Exams</h2>
        <ExamCreator open={openCreator} setOpen={setOpenCreator} />
      </div>
      {exams.length === 0 &&
        <div>
          <p>No exams found</p>
        </div>
      }
      <div className="grid grid-cols-1 gap-4 overflow-y-auto">
        {exams.map((exam) => (
          <ExamLine key={exam.id} {...exam} />
        ))}
      </div>
    </div>
  );
}


function ExamLine({ id, name, topics, createdAt, bestAttempt }: ExamInfo) {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <h2 className="font-medium">{name}</h2>
          <p className="text-sm text-muted-foreground">{new Date(createdAt).toLocaleString()}</p>
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
          <Button className="h-6" variant="outline" onClick={() => navigate(`${id}`)}>View Exam</Button>
          <Button className="h-6" onClick={() => navigate(`${id}/take`)}>Take Exam</Button>
        </div>
        {bestAttempt && <Badge>Best: {bestAttempt.score} / {bestAttempt.scoredQuestions}</Badge>}
      </CardContent>
    </Card>
  )
}


function ExamCreator({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const [title, setTitle] = useState("")
  const [prompt, setPrompt] = useState("")
  const [numQuestions, setNumQuestions] = useState([5])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [generating, setGenerating] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const stackId = useOutletContext<string>();

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
    )
  }

  const handleSubmit = async () => {
    try {
      setGenerating(true);
      const response = await api.post(`/exams/${stackId}/generate`, {
        title,
        topics: selectedTopics,
        num_questions: numQuestions[0],
        prompt,
      });
      setOpen(false);
    } catch (error) {
      console.error("Error creating exam:", error);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Exam</Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Create Exam</DialogTitle>
          <DialogDescription>
            Fill out the details to generate a new exam.
          </DialogDescription>
        </DialogHeader>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter exam title"
          />
        </div>

        {/* Topics multiselect */}
        <div className="space-y-2">
          <Label>Topics</Label>
          <div className="flex flex-row justify-between">
            <p className="text-sm text-muted-foreground">
              Selected:{" "}
              {selectedTopics.length > 0
                ? selectedTopics.join(", ")
                : "None"}
            </p>
            <p className="text-sm text-muted-foreground underline cursor-pointer" onClick={() => setSelectedTopics([])}>Deselect All</p>
          </div>
          <Command>
            <CommandInput placeholder="Search topics..." />
            <CommandEmpty>No topics found.</CommandEmpty>
            <CommandGroup className="max-h-36 overflow-y-auto">
              {topics.map((topic) => (
                <CommandItem
                  key={topic}
                  onSelect={() => toggleTopic(topic)}
                >
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
          <Button disabled={generating} onClick={handleSubmit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
