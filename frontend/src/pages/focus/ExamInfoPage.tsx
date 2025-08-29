// ExamInfoPage.tsx
import api from "@/lib/api"
import DeletionDialog from "@/components/deletion-dialog"
import { useEffect, useState } from "react"
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ExamInfo = {
  id: string
  stackId: string
  name: string
  createdAt: string
  topics: string[]
}

type ExamAttempt = {
  id: string
  examId: string
  completedAt: string
  scoredQuestions?: number
  score?: number
}

type Question = {
  id: string
  text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  answer: "A" | "B" | "C" | "D"
}

export default function ExamInfoPage() {
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null)
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([])
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null)
  const [questionAttempts, setQuestionAttempts] = useState<{ [questionId: string]: string }>({});
  const [questions, setQuestions] = useState<Question[]>([])
  const [revealAll, setRevealAll] = useState(false)
  const navigate = useNavigate()

  const stackId = useOutletContext<string>();
  const { examId } = useParams<{ examId: string }>();
  const attemptId = useLocation().hash.slice(1);

  useEffect(() => {
    if (attemptId) {
      const selected = examAttempts.find(a => a.id === attemptId);
      setSelectedAttempt(selected || null);
      const getSelectedAnswers = async () => {
        try {
          const response = await api.get(`/exams/${examId}/attempt/${attemptId}/questions`);
          const attempts = response.data;
          const answersMap: { [questionId: string]: string } = {};
          attempts.forEach((attempt: any) => {
            answersMap[attempt.question_id] = attempt.selected_option;
          });
          setQuestionAttempts(answersMap);
          console.log(answersMap);
        } catch (error) {
          console.error("Error fetching question attempts:", error);
        }
      }
      getSelectedAnswers();
    }
  }, [attemptId]);

  useEffect(() => {
    const getExamInfo = async () => {
      try {
        const response = await api.get(`/exams/${examId}/info`)
        setExamInfo({
          id: response.data.id,
          stackId: response.data.stack_id,
          name: response.data.name,
          createdAt: response.data.created_at,
          topics: response.data.topics,
        })
        const responseAttempts = await api.get(`/exams/${examId}/attempts`)
        setExamAttempts(
          responseAttempts.data.map((attempt: any) => ({
            id: attempt.id,
            examId: attempt.exam_id,
            completedAt: attempt.completed_at,
            scoredQuestions: attempt.scored_questions,
            score: attempt.score,
          }))
        )
        const responseQuestions = await api.get(`/exams/${examId}/questions`)
        setQuestions(responseQuestions.data)
      } catch (error) {
        console.error("Error fetching exam information:", error)
      }
    }
    getExamInfo()
  }, [stackId, examId])

  const handleTakeExam = () => {
    navigate("take");
  }
  const handleDeleteExam = async () => {
    try {
      await api.post(`/exams/${examId}/delete`);
      navigate(`/stack/${stackId}/exams`);
    } catch (error) {
      console.error("Error deleting exam:", error);
    }
  }
  const handleDeleteExamAttempt = async () => {
    
  }
  const onSelectionValueChange = (val: string) => {
    if (val == "x") {
      setSelectedAttempt(null);
      navigate("#");
    } else {
      const selected = examAttempts.find(a => a.id === val);
      setSelectedAttempt(selected || null);
      navigate(`#${val}`);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/stack/${stackId}/exams`)}><ChevronLeft /></Button>
          <h2 className="text-xl font-semibold">{examInfo?.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleTakeExam}>Take Exam</Button>
          <DeletionDialog
            triggerLabel=""
            title="Delete Exam"
            description="Are you sure you want to delete this exam? This action cannot be undone."
            onConfirm={handleDeleteExam}
            confirmLabel="Delete"
            showIcon={true}
          />
        </div>
      </div>

      {/* Attempts Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Past Attempts</h3>
          <Select
            value={selectedAttempt?.id || ""}
            onValueChange={onSelectionValueChange}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select attempt..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="clear" value={"x"}>No Selection</SelectItem>
              {examAttempts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {new Date(a.completedAt).toLocaleString()} -{" "}
                  {a.score}/{a.scoredQuestions}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Questions */}
        <div>
          <div className="w-full flex flex-col items-center justify-between mb-2">
            {selectedAttempt && <div className="w-full flex items-center justify-between">
              <h2 className="text-lg font-medium underline">{`Reviewing Attempt at ${new Date(selectedAttempt.completedAt).toLocaleString()}`}</h2>
              <DeletionDialog
                triggerLabel="Delete Attempt"
                title="Delete Attempt"
                description="Are you sure you want to delete this exam attempt? This action cannot be undone. The exam and other attempts will be preserved."
                onConfirm={handleDeleteExamAttempt}
                confirmLabel="Delete"
                showIcon={false}
              />
            </div>}
            <div className="w-full flex items-center justify-between">
              <h3 className="text-lg font-medium">{`Questions`}</h3>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Reveal All</span>
                  <Switch
                    checked={revealAll}
                    onCheckedChange={setRevealAll}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {!selectedAttempt && questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                index={idx}
                question={q}
                revealAll={revealAll}
              />
            ))}
            {selectedAttempt && questions.map((q, idx) => (
              <ReviewQuestionCard
                key={q.id}
                index={idx}
                question={q}
                selection={questionAttempts[q.id]}
                revealAll={revealAll}
              />
            ))}
          </div>
        </div>
      </div>
    </div>)
}

function QuestionCard({
  question,
  index,
  revealAll,
}: {
  question: Question
  index: number
  revealAll: boolean
}) {
  const [reveal, setReveal] = useState(false)
  const showAnswer = revealAll || reveal

  return (
    <Card>
      <CardContent className="flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="font-medium">
            {index + 1}. {question.text}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Reveal</span>
            <Switch checked={reveal} onCheckedChange={setReveal} />
          </div>
        </div>
        <div className="space-y-1">
          {[
            ["A", question.option_a],
            ["B", question.option_b],
            ["C", question.option_c],
            ["D", question.option_d],
          ].map(([val, label]) => (
            <div
              key={val}
              className={`p-2 rounded ${showAnswer && val === question.answer
                ? "bg-green-200 dark:bg-green-800"
                : "bg-muted"
                }`}
            >
              {val}. {label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ReviewQuestionCard({
  question,
  index,
  revealAll,
  selection
}: {
  question: Question
  index: number
  revealAll: boolean
  selection: string | undefined
}) {
  const [reveal, setReveal] = useState(false)
  const [giveCredit, setGiveCredit] = useState(false)
  const [unscored, setUnscored] = useState(false)

  const showAnswer = revealAll || reveal
  const shading = (val: string) => {
    if (showAnswer) {
      if (val === question.answer) { // correct
        if (val === selection) { // correct, selected
          return "bg-green-200 dark:bg-green-800 border-2 border-green-500";
        } else { // correct, not selected
          return "bg-green-200 dark:bg-green-800";
        }
      } else { // incorrect
        if (val === selection) { // incorrect, selected
          return "bg-muted border-2 border-red-500";
        } else { // incorrect, not selected
          return "bg-muted";
        }
      }
    } else {
      if (val === selection) {
        return "bg-muted border-2 border-blue-500";
      } else {
        return "bg-muted";
      }
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="font-medium">
            {index + 1}. {question.text}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-sm">Reveal</span>
              <Switch checked={reveal} onCheckedChange={setReveal} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm">Give Credit</span>
              <Switch checked={giveCredit} onCheckedChange={setGiveCredit} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm">Unscored</span>
              <Switch checked={unscored} onCheckedChange={setUnscored} />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {[
            ["A", question.option_a],
            ["B", question.option_b],
            ["C", question.option_c],
            ["D", question.option_d],
          ].map(([val, label]) => (
            <div
              key={val}
              className={`p-2 rounded ${shading(val)}`}
            >
              {val}. {label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
