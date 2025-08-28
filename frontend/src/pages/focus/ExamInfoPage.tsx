// ExamInfoPage.tsx
import api from "@/lib/api"
import { useEffect, useState } from "react"
import { useOutletContext, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Settings, Trash } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const [questions, setQuestions] = useState<Question[]>([])
  const [sortBy, setSortBy] = useState<"time" | "score">("time")
  const [revealAll, setRevealAll] = useState(false)
  const [deleteExamDialog, setDeleteExamDialog] = useState(false)
  const [deleteAttemptId, setDeleteAttemptId] = useState<string | null>(null)

  const stackId = useOutletContext<string>()
  const { examId } = useParams<{ examId: string }>()

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

  const handleTakeExam = () => { }
  const handleDeleteExam = () => { }
  const handleDeleteAttempt = (id: string) => { }

  const sortedAttempts = [...examAttempts].sort((a, b) => {
    if (sortBy === "time") {
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    }
    return (b.score ?? 0) - (a.score ?? 0)
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{examInfo?.name}</h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleTakeExam}>Take Exam</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => setDeleteExamDialog(true)}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete Exam
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Attempts Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Past Attempts</h3>
          <Select
            value={selectedAttempt?.id || ""}
            onValueChange={(val) => setSelectedAttempt(examAttempts.find(a => a.id === val) || null)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select attempt..." />
            </SelectTrigger>
            <SelectContent>
              {examAttempts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {new Date(a.completedAt).toLocaleString()} –{" "}
                  {a.score}/{a.scoredQuestions}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Questions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">{selectedAttempt ? `Reviewing Attempt from ${new Date(selectedAttempt.completedAt).toLocaleString()} - Questions` : "Questions"}</h3>
            <div className="flex items-center gap-2">
                <span className="text-sm">Reveal All</span>
                <Switch
                  checked={revealAll}
                  onCheckedChange={setRevealAll}
                />
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
                revealAll={revealAll}
              />
            ))}
            </div>
          </div>
        
        {/* Delete Exam Dialog */}
        <AlertDialog open={deleteExamDialog} onOpenChange={setDeleteExamDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to delete this exam?
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600"
                onClick={handleDeleteExam}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Attempt Dialog */}
        <AlertDialog
          open={!!deleteAttemptId}
          onOpenChange={(open) => !open && setDeleteAttemptId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to delete this attempt?
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600"
                onClick={() => {
                  if (deleteAttemptId) handleDeleteAttempt(deleteAttemptId)
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
      <CardContent className="p-4 space-y-2">
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
}: {
  question: Question
  index: number
  revealAll: boolean
}) {
  const [reveal, setReveal] = useState(false)
  const [giveCredit, setGiveCredit] = useState(false)
  const [unscored, setUnscored] = useState(false)

  const showAnswer = revealAll || reveal

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
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
