import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Question = {
  id: string;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  answer: "A" | "B" | "C" | "D";
};

export default function ExamPage() {
  const [examName, setExamName] = useState("");
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const { stackId } = useOutletContext<{ stackId: string }>();

  useEffect(() => {
    const fetchExamInfo = async () => {
      try {
        setLoadingQuestions(true);
        const response = await api.get(`/exams/${examId}/questions`);
        setQuestions(response.data);
        const examResponse = await api.get(`/exams/${examId}`);
        setExamName(examResponse.data.name);
      } catch (error) {
        console.error("Failed to fetch questions:", error);
      } finally {
        setLoadingQuestions(false);
      }
    };
    fetchExamInfo();
  }, [examId]);

  return (
    <div className="w-full h-full flex flex-col min-h-0 p-4 overflow-hidden">
      <div className="flex-none flex items-center gap-2 pb-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/stack/${stackId}/exams/${examId}`)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-medium"> {examName}</h2>
      </div>
      <div className="h-full w-full min-h-0">
        {loadingQuestions ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="shadow-md rounded-xl">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-2/3 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          questions.length > 0 && (
            <ExamForm questions={questions} examId={examId} stackId={stackId} />
          )
        )}
        {!loadingQuestions && questions.length === 0 && (
          <div className="p-4 text-center font-medium">
            Exam does not exist or has no questions.
          </div>
        )}
      </div>
    </div>
  );
}

type ExamFormProps = {
  questions: Question[];
  examId: string | undefined;
  stackId: string;
};

function ExamForm({ questions, examId, stackId }: ExamFormProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const schema = z.object(
    Object.fromEntries(
      questions.map((q) => [q.id, z.string().nonempty("Pick an option")])
    )
  );

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(questions.map((q) => [q.id, ""]))
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      setLoading(true);
      const response = await api.post(`/exams/${examId}/upload_attempt`, {
        question_attempts: questions.map((q) => ({
          question_id: q.id,
          selected_option: values[q.id]
        }))
      });
      console.log("Attempt submitted successfully:", response.data);
      navigate(`/stack/${stackId}/exams/${examId}#${response.data.id}`);
    } catch (error) {
      console.error("Failed to submit attempt:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col min-h-0">
      <ScrollArea className="min-h-0 mx-auto">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 min-h-0"
          >
            {questions.map((q, idx) => (
              <Card key={q.id} className="shadow-md rounded-xl py-2">
                <CardContent className="p-6">
                  <FormField
                    control={form.control}
                    name={q.id}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-lg">
                          {idx + 1}. {q.text}
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="space-y-2 relative"
                          >
                            {[
                              ["A", q.option_a],
                              ["B", q.option_b],
                              ["C", q.option_c],
                              ["D", q.option_d]
                            ].map(([val, label]) => (
                              <div
                                key={val}
                                className="flex items-center space-x-2"
                              >
                                <RadioGroupItem
                                  value={val}
                                  id={`${q.id}-${val}`}
                                />
                                <label
                                  htmlFor={`${q.id}-${val}`}
                                  className="text-sm"
                                >
                                  {label}
                                </label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            ))}

            <Button type="submit" className="w-full">
              {loading && <Loader2 className="mr-2 animate-spin" />} Submit Exam
            </Button>
          </form>
        </Form>
      </ScrollArea>
    </div>
  );
}
