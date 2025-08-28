import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
  const navigate = useNavigate();

  useEffect(() => {
    const getExams = async () => {
      try {
        const response = await api.get(`/exams/${stackId}/list`);
        setExams(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching exams:", error);
      }
    }
    getExams();
  }, []);

  const handleCreate = async () => {
    try {
      const response = await api.post(`/exams/${stackId}/generate`, {
        
      });
      // Handle successful exam creation (e.g., navigate to the new exam's page)
    } catch (error) {
      console.error("Error creating exam:", error);
    }
  }

  return (
    <div>
      {exams.length === 0 &&
        <div>
          <p>No exams found</p>
          <Button onClick={handleCreate}>Create Exam</Button>
        </div>
      }
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
    <Card onClick={() => navigate(`${examId}`)}>
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
