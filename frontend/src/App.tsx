import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import StacksPage from "@/pages/StacksPage";
import FocusPage from "@/pages/FocusPage";
import CreateStackPage from "@/pages/CreateStackPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/stacks" element={<StacksPage />} />
        <Route path="/focus/:stackId" element={<FocusPage />} />
        <Route path="/create-stack" element={<CreateStackPage />} />
      </Routes>
    </Router>
  );
}

export default App;