import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Backlog from "./pages/Backlog";
import KanbanBoard from "./pages/KanbanBoard";
import RequestForm from "./pages/RequestForm";
import TeamManage from "./pages/TeamManage";

function RequireAuth() {
  const { isRD, loading } = useAuth();
  if (loading) return null;
  return isRD ? <Outlet /> : <Navigate to="/backlog" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/requests/new" element={<RequestForm />} />
            <Route path="/backlog" element={<Backlog />} />
            <Route element={<RequireAuth />}>
              <Route path="/kanban" element={<KanbanBoard />} />
              <Route path="/teams" element={<TeamManage />} />
            </Route>
            <Route path="*" element={<Navigate to="/backlog" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
