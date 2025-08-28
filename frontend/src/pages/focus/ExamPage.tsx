import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import api from "@/lib/api"
import { useNavigate, useOutletContext, useParams } from "react-router-dom";

type Question = {
  id: string;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  answer: "A" | "B" | "C" | "D";
}


export default function ExamPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const stackId = useOutletContext<string>();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await api.get(`/exams/${examId}/questions`);
        setQuestions(response.data);
      } catch (error) {
        console.error("Failed to fetch questions:", error);
      }
    };
    fetchQuestions();
  }, [examId]);

  return (
    <div>
      <Button onClick={() => navigate(`/stacks/${stackId}/exams`)}>Back</Button>
      <ExamForm questions={questions} />
    </div>
  );

}

type ExamFormProps = {
  questions: Question[]
}

function ExamForm({ questions }: ExamFormProps) {
  const schema = z.object(
    Object.fromEntries(questions.map((q) => [q.id, z.string().nonempty("Pick an option")]))
  );

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(questions.map((q) => [q.id, ""])),
  });

  const [score, setScore] = useState<number | null>(null)

  function onSubmit(values: z.infer<typeof schema>) {
    let correct = 0
    questions.forEach((q) => {
      if (values[q.id] === q.answer) correct++
    });
    setScore(correct)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {questions.map((q, idx) => (
            <Card key={q.id} className="shadow-md rounded-xl">
              <CardContent className="p-6 space-y-4">
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
                          className="space-y-2 mt-2"
                        >
                          {[
                            ["A", q.option_a],
                            ["B", q.option_b],
                            ["C", q.option_c],
                            ["D", q.option_d],
                          ].map(([val, label]) => (
                            <div
                              key={val}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem value={val} id={`${q.id}-${val}`} />
                              <label htmlFor={`${q.id}-${val}`} className="text-sm">
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
            Submit Exam
          </Button>
        </form>
      </Form>

      {score !== null && (
        <div className="p-4 bg-muted rounded-lg text-center font-medium">
          You scored {score} / {questions.length}
        </div>
      )}
    </div>
  )
}