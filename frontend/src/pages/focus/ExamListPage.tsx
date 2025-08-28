import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useOutletContext, useNavigate } from "react-router-dom";

type ExamInfo = {
  examId: string;
  name: string;
  topics: string[];
  date: string;
  score: number | null;
}

export default function ExamListPage() {
  const [exams, setExams] = useState<ExamInfo[]>([]);
  const stackId = useOutletContext<string>();

  useEffect(() => {
    const getExams = async () => {
      const response = await api.get("/exams"); // TODO: implement in backend
      setExams(response.data);
    }
    // getExams();
    // TODO: remove mock data
    setExams([
      {
        examId: "1",
        name: "Math Exam",
        topics: ["Algebra", "Geometry"],
        date: "2023-01-01",
        score: 85,
      },
      {
        examId: "2",
        name: "Science Exam",
        topics: ["Biology", "Chemistry"],
        date: "2023-01-02",
        score: 90,
      },
    ]);
  }, []);
    
    return (
      <div>
        {exams.map((exam) => (
          <ExamLine key={exam.examId} {...exam} />
        ))}
      </div>
    );
}



function ExamLine({ examId, name, topics, date, score }: ExamInfo) {
  const navigate = useNavigate();
  // TODO: implement topics view
  return (
    <Card onClick={() => navigate(`/exams/${examId}`)}>
      <CardHeader>
        <div className="font-medium">{name}</div>
        <div className="text-sm text-muted-foreground">{date}</div>
      </CardHeader>
      <CardContent>
        <div className="font-medium">{score !== null ? score : "N/A"}</div>
      </CardContent>
    </Card>
  );
}
