// ExamInfoPage.tsx
import api from "@/lib/api";
import { DiscussionButton } from "@/components/chat-manager";
import DeletionDialog from "@/components/deletion-dialog";
import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export type ExamInfo = {
  id: string;
  stackId: string;
  name: string;
  createdAt: string;
  topics: string[];
  bestAttempt: {
    id: string;
    score: number;
    scoredQuestions: number;
  } | null;
};

export type ExamAttempt = {
  id: string;
  examId: string;
  completedAt: string;
  scoredQuestions?: number;
  score?: number;
};

type Question = {
  id: string;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  answer: "A" | "B" | "C" | "D";
};

type QuestionAttempt = {
  id: string;
  examAttemptId: string;
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
  scored: boolean;
  manualCredit: boolean;
};

export default function ExamInfoPage() {
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(
    null
  );
  const [questionAttempts, setQuestionAttempts] = useState<{
    [questionId: string]: QuestionAttempt;
  }>({});
  const [revealAll, setRevealAll] = useState(false);
  const [updatedQuestionAttempt, setUpdatedQuestionAttempt] = useState<
    QuestionAttempt[]
  >([]);
  const [loadingScoring, setLoadingScoring] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [updatedCtr, setUpdatedCtr] = useState(0);
  const navigate = useNavigate();

  const { stackId } = useOutletContext<{ stackId: string }>();
  const { examId } = useParams<{ examId: string }>();
  const attemptId = useLocation().hash.slice(1);

  useEffect(() => {
    const getExamInfo = async () => {
      try {
        const response = await api.get(`/exams/${examId}/info`);
        setExamInfo({
          id: response.data.id,
          stackId: response.data.stack_id,
          name: response.data.name,
          createdAt: response.data.created_at,
          topics: response.data.topics,
          bestAttempt: response.data.best_attempt
            ? {
              id: response.data.best_attempt.id,
              score: response.data.best_attempt.score,
              scoredQuestions: response.data.best_attempt.scored_questions
            }
            : null
        });
        const responseAttempts = await api.get(`/exams/${examId}/attempts`);
        setExamAttempts(
          responseAttempts.data.map((attempt: any) => ({
            id: attempt.id,
            examId: attempt.exam_id,
            completedAt: attempt.completed_at,
            scoredQuestions: attempt.scored_questions,
            score: attempt.score
          }))
        );
        const responseQuestions = await api.get(`/exams/${examId}/questions`);
        setQuestions(responseQuestions.data);
      } catch (error) {
        console.error("Error fetching exam information:", error);
      }
    };
    getExamInfo();
  }, [stackId, examId, attemptId]);

  useEffect(() => {
    if (attemptId) {
      const selected = examAttempts.find((a) => a.id === attemptId);
      setSelectedAttempt(selected || null);
    }
  }, [questionAttempts, attemptId, examAttempts]);

  useEffect(() => {
    const getSelectedAnswers = async () => {
      try {
        setLoadingQuestions(true);
        setQuestionAttempts({});
        if (attemptId) {
          const response = await api.get(
            `/exams/attempt/${attemptId}/questions`
          );
          const answersMap: { [questionId: string]: QuestionAttempt } = {};
          response.data.forEach((attempt: any) => {
            answersMap[attempt.question_id] = {
              id: attempt.id,
              examAttemptId: attempt.exam_attempt_id,
              questionId: attempt.question_id,
              selectedOption: attempt.selected_option,
              isCorrect: attempt.is_correct,
              scored: attempt.scored,
              manualCredit: attempt.manual_credit
            };
          });
          setQuestionAttempts(answersMap);
        }
      } catch (error) {
        console.error("Error fetching question attempts:", error);
      } finally {
        setLoadingQuestions(false);
      }
    };
    getSelectedAnswers();
  }, [selectedAttempt, examAttempts, attemptId]);

  const handleTakeExam = () => {
    navigate("take");
  };
  const handleDeleteExam = async () => {
    try {
      await api.post(`/exams/${examId}/delete`);
      navigate(`/stack/${stackId}/exams`);
    } catch (error) {
      console.error("Error deleting exam:", error);
    }
  };
  const handleDeleteExamAttempt = async () => {
    try {
      await api.post(`/exams/attempt/${selectedAttempt?.id}/delete`);
      const updatedAttempts = examAttempts.filter(
        (a) => a.id !== selectedAttempt?.id
      );
      setExamAttempts(updatedAttempts);
      setSelectedAttempt(null);
      navigate("#");
    } catch (error) {
      console.error("Error deleting exam attempt:", error);
    }
  };
  const onSelectionValueChange = (val: string) => {
    if (val == "x") {
      setSelectedAttempt(null);
      navigate("#");
    } else {
      const selected = examAttempts.find((a) => a.id === val);
      setSelectedAttempt(selected || null);
      navigate(`#${val}`);
    }
  };
  const handleUpdateScoring = async () => {
    try {
      setLoadingScoring(true);
      const response = await api.post(
        `/exams/attempt/${selectedAttempt?.id}/update_scoring`,
        {
          question_attempts: Object.values(updatedQuestionAttempt).map((qs) => {
            return {
              question_attempt_id: qs.id,
              scored: qs.scored,
              manual_credit: qs.manualCredit
            };
          })
        }
      );
      setSelectedAttempt(response.data);
      setUpdatedCtr((prev) => prev + 1);
    } catch (error) {
      console.error("Error updating question scoring:", error);
    } finally {
      setLoadingScoring(false);
    }
  };

  return (
    <div className="w-full h-full min-h-0 p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/stack/${stackId}/exams`)}
          >
            <ChevronLeft />
          </Button>
          <h2 className="text-xl font-semibold">{examInfo?.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleTakeExam}>Take Exam</Button>
          <DeletionDialog
            triggerLabel=""
            title="Delete Exam"
            description="Are you sure you want to delete this exam? This action cannot be undone. All exam information and exam attempts will be erased."
            onConfirm={handleDeleteExam}
            confirmLabel="Delete"
            showIcon={true}
          />
        </div>
      </div>

      {/* Attempts Section */}
      <div>
        <Select
          value={selectedAttempt?.id || ""}
          onValueChange={onSelectionValueChange}
        >
          <SelectTrigger className="min-w-48">
            <SelectValue placeholder="Select attempt..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="clear" value={"x"}>
              No Selection
            </SelectItem>
            {examAttempts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {new Date(a.completedAt).toLocaleString()} - {a.score}/
                {a.scoredQuestions}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Questions */}
        <div className="w-full">
          <div className="w-full flex flex-col items-center justify-between mb-2">
            {selectedAttempt && (
              <div className="w-full flex items-center justify-between">
                <h2 className="text-lg font-medium underline">{`Reviewing Attempt at ${new Date(selectedAttempt.completedAt).toLocaleString()}`}</h2>
                <DeletionDialog
                  triggerLabel=""
                  title="Delete Attempt"
                  description="Are you sure you want to delete this exam attempt? This action cannot be undone. The exam and other attempts will be preserved."
                  onConfirm={handleDeleteExamAttempt}
                  confirmLabel="Delete"
                  showIcon={true}
                />
              </div>
            )}
            <div className="w-full flex items-center justify-between">
              <h3 className="text-lg font-medium">Questions</h3>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Reveal All</span>
                  <Switch checked={revealAll} onCheckedChange={setRevealAll} />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {loadingQuestions && (
              <div className="flex justify-center">
                <Loader2 className="animate-spin" />
              </div>
            )}
            {!selectedAttempt &&
              questions.map((q, idx) => (
                <QuestionCard
                  key={q.id}
                  index={idx}
                  question={q}
                  revealAll={revealAll}
                />
              ))}
            {selectedAttempt &&
              questions.map((q, idx) => {
                if (questionAttempts[q.id]) {
                  return (
                    <ReviewQuestionCard
                      key={`${selectedAttempt.id}-${q.id}-${updatedCtr}`}
                      index={idx}
                      questionAttempt={questionAttempts[q.id]}
                      question={q}
                      revealAll={revealAll}
                      setUpdatedQuestionAttempt={setUpdatedQuestionAttempt}
                    />
                  );
                }
              })}
            {selectedAttempt && (
              <Button
                onClick={handleUpdateScoring}
                disabled={loadingScoring || updatedQuestionAttempt.length === 0}
              >
                {loadingScoring ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Update Scoring"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  index,
  revealAll
}: {
  question: Question;
  index: number;
  revealAll: boolean;
}) {
  const { stackId, setLayout } = useOutletContext<{
    stackId: string;
    setLayout: (func: (layout: string) => void) => void;
  }>();

  const [reveal, setReveal] = useState(revealAll);
  useEffect(() => {
    setReveal(revealAll);
  }, [revealAll]);

  return (
    <Card>
      <CardContent className="flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="font-medium">
            {index + 1}. {question.text}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Reveal</span>
              <Switch checked={reveal} onCheckedChange={setReveal} />
            </div>
            <DiscussionButton
              stackId={stackId}
              type="exam_question"
              refId={question.id}
              setLayout={setLayout}
            />
          </div>
        </div>
        <div className="space-y-1">
          {[
            ["A", question.option_a],
            ["B", question.option_b],
            ["C", question.option_c],
            ["D", question.option_d]
          ].map(([val, label]) => (
            <div
              key={val}
              className={`p-2 rounded ${reveal && val === question.answer
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
  );
}

function ReviewQuestionCard({
  question,
  index,
  revealAll,
  questionAttempt,
  setUpdatedQuestionAttempt: setUpdatedQuestionAttempts
}: {
  question: Question;
  index: number;
  revealAll: boolean;
  questionAttempt: QuestionAttempt;
  setUpdatedQuestionAttempt: (
    func: (prev: QuestionAttempt[]) => QuestionAttempt[]
  ) => void;
}) {
  const [reveal, setReveal] = useState(revealAll);
  const [giveCredit, setGiveCredit] = useState(questionAttempt.manualCredit);
  const [unscored, setUnscored] = useState(!questionAttempt.scored);
  const { stackId, setLayout } = useOutletContext<{
    stackId: string;
    setLayout: (func: (layout: string) => void) => void;
  }>();
  useEffect(() => {
    if (unscored) {
      setGiveCredit(false);
    }
    if (
      questionAttempt &&
      (giveCredit !== questionAttempt.manualCredit ||
        unscored === questionAttempt.scored)
    ) {
      console.log("diff");
      console.log(questionAttempt);
      setUpdatedQuestionAttempts((prev) =>
        prev
          .filter((qa) => qa.id !== questionAttempt.id)
          .concat([
            {
              ...questionAttempt,
              manualCredit: giveCredit,
              scored: !unscored
            }
          ])
      );
    } else {
      setUpdatedQuestionAttempts((prev) =>
        prev.filter((qa) => qa.id !== questionAttempt.id)
      );
    }
  }, [giveCredit, unscored, questionAttempt, setUpdatedQuestionAttempts]);

  useEffect(() => {
    setReveal(revealAll);
  }, [revealAll]);

  const shading = (val: string) => {
    if (reveal) {
      if (val === question.answer) {
        // correct
        if (val === questionAttempt?.selectedOption) {
          // correct, selected
          return "bg-green-200 dark:bg-green-800 border-2 border-green-500";
        } else {
          // correct, not selected
          return "bg-green-200 dark:bg-green-800";
        }
      } else {
        // incorrect
        if (val === questionAttempt?.selectedOption) {
          // incorrect, selected
          if (giveCredit) {
            return "bg-yellow-100 dark:bg-yellow-800 border-2 border-red-500";
          }
          return "bg-muted border-2 border-red-500";
        } else {
          // incorrect, not selected
          return "bg-muted";
        }
      }
    } else {
      if (val === questionAttempt?.selectedOption) {
        return "bg-muted border-2 border-blue-500";
      } else {
        return "bg-muted";
      }
    }
  };

  return (
    <Card className={unscored ? "bg-gray-200" : ""}>
      <CardContent className="flex flex-col justify-between">
        <div className="flex flex-col items-start justify-between p-1">
          <div className="flex w-full justify-between">
            <h3>
              {index + 1}. {question.text}
            </h3>
            {reveal && (
              <p className="text-sm">
                {(questionAttempt.isCorrect || giveCredit) && !unscored
                  ? "1"
                  : "0"}
                /{unscored ? "0" : "1"}
              </p>
            )}
          </div>
          <div className="flex w-full items-center justify-between">
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
            <DiscussionButton
              stackId={stackId}
              type="exam_question"
              refId={question.id}
              setLayout={setLayout}
            />
          </div>
        </div>

        <div className="space-y-1">
          {[
            ["A", question.option_a],
            ["B", question.option_b],
            ["C", question.option_c],
            ["D", question.option_d]
          ].map(([val, label]) => (
            <div key={val} className={`p-2 rounded ${shading(val)}`}>
              {val}. {label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
