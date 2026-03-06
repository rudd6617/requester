import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Backlog from "./pages/Backlog";
import KanbanBoard from "./pages/KanbanBoard";
import RequestForm from "./pages/RequestForm";
import TeamManage from "./pages/TeamManage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/requests/new" element={<RequestForm />} />
          <Route path="/backlog" element={<Backlog />} />
          <Route path="/kanban" element={<KanbanBoard />} />
          <Route path="/teams" element={<TeamManage />} />
          <Route path="*" element={<Navigate to="/backlog" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
