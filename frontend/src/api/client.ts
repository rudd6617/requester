import axios from "axios";
import type {
  KanbanBoard,
  KanbanCard,
  Request,
  RequestListResponse,
  Team,
} from "../types";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
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

export const fetchKanbanCards = (teamId: number) =>
  api
    .get<KanbanBoard>("/kanban/cards", { params: { team_id: teamId } })
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
