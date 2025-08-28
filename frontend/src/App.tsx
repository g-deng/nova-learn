import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import StacksPage from "@/pages/StacksPage";
import FocusLayout from "@/FocusLayout";
import CreateStackPage from "@/pages/CreateStackPage";
import Layout from "@/Layout";
import AddTopicsPage from "./pages/EditTopicsPage";
import AddDependenciesPage from "./pages/EditDependenciesPage";
import StackLayout from "@/StackLayout";

import FlashcardPage from "@/pages/focus/FlashcardPage";
import ExamPage from "@/pages/focus/ExamPage";
import ExamInfoPage from "@/pages/focus/ExamInfoPage";
import ExamListPage from "@/pages/focus/ExamListPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<Layout />}>
          <Route path="/stacks" element={<StacksPage />} />
          <Route path="/create-stack" element={<CreateStackPage />} />
          <Route path="/stack" element={<StackLayout />}>
            <Route path=":stackId" element={<FocusLayout />}>
              <Route path="flashcards" element={<FlashcardPage />} />
              {/* <Route path="chat" element={<ChatPage />} /> */}
              <Route path="exams" element={<ExamListPage />} />
              <Route path="exams/:examId" element={<ExamInfoPage />} />
              <Route path="exams/:examId/take" element={<ExamPage />} />
              {/* <Route path="stats" element={<StatisticsPage />} /> */}
            </Route>
            <Route path=":stackId/edit-topics" element={<AddTopicsPage />}/>
            <Route path=":stackId/edit-dependencies" element={<AddDependenciesPage />}/>
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;