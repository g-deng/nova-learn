import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import StacksPage from "@/pages/StacksPage";
import FocusPage from "@/pages/FocusPage";
import CreateStackPage from "@/pages/CreateStackPage";
import Layout from "@/Layout";
import AddTopicsPage from "./pages/EditTopicsPage";
import AddDependenciesPage from "./pages/EditDependenciesPage";
import StackLayout from "./StackLayout";

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
            <Route path=":stackId" element={<FocusPage />} />
            <Route path=":stackId/edit-topics" element={<AddTopicsPage />}/>
            <Route path=":stackId/edit-dependencies" element={<AddDependenciesPage />}/>
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;