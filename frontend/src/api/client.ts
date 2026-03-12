import axios from "axios";
import type {
  Comment,
  KanbanBoard,
  KanbanCard,
  Request,
  RequestListResponse,
  Team,
  User,
} from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Teams ---

export const fetchTeams = () => api.get<Team[]>("/teams").then((r) => r.data);

export const createTeam = (data: { name: string; description?: string }) =>
  api.post<Team>("/teams", data).then((r) => r.data);

export const updateTeam = (id: number, data: Partial<Team>) =>
  api.patch<Team>(`/teams/${id}`, data).then((r) => r.data);

export const deleteTeam = (id: number) => api.delete(`/teams/${id}`);

// --- Requests ---

export const fetchRequests = (params: Record<string, string | number>) =>
  api.get<RequestListResponse>("/requests", { params }).then((r) => r.data);

export const fetchRequest = (id: number) =>
  api.get<Request>(`/requests/${id}`).then((r) => r.data);

export const createRequest = (data: Partial<Request>) =>
  api.post<Request>("/requests", data).then((r) => r.data);

export const updateRequest = (id: number, data: Partial<Request>) =>
  api.patch<Request>(`/requests/${id}`, data).then((r) => r.data);

// --- Kanban ---

export const fetchKanbanCards = (teamId: number | null) =>
  api
    .get<KanbanBoard>("/kanban/cards", { params: teamId != null ? { team_id: teamId } : {} })
    .then((r) => r.data);

export const createKanbanCard = (data: {
  request_id: number;
  team_id: number;
  assignee?: string;
}) => api.post<KanbanCard>("/kanban/cards", data).then((r) => r.data);

export const updateKanbanCard = (
  id: number,
  data: { assignee?: string; stage?: string }
) => api.patch<KanbanCard>(`/kanban/cards/${id}`, data).then((r) => r.data);

export const moveKanbanCard = (
  id: number,
  data: { stage: string; position: number }
) => api.patch<KanbanCard>(`/kanban/cards/${id}/move`, data).then((r) => r.data);

// --- Auth ---

export const login = (data: { username: string; password: string }) =>
  api
    .post<{ access_token: string; token_type: string }>("/auth/login", data)
    .then((r) => r.data);

export const fetchMe = () => api.get<User>("/auth/me").then((r) => r.data);

// --- Comments ---

export const fetchComments = (requestId: number) =>
  api
    .get<Comment[]>("/comments", { params: { request_id: requestId } })
    .then((r) => r.data);

export const createComment = (data: {
  request_id: number;
  content: string;
  author?: string;
}) => api.post<Comment>("/comments", data).then((r) => r.data);

// --- Users (admin) ---

export const fetchUsers = () => api.get<User[]>("/auth/users").then((r) => r.data);

export const updateTeamMembers = (teamId: number, userIds: number[]) =>
  api.patch(`/teams/${teamId}/members`, { user_ids: userIds });
