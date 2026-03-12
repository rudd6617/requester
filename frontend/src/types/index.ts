export type Priority = "critical" | "high" | "medium" | "low";
export type Status = "new" | "assigned" | "done" | "cancelled" | "archived";
export type Risk = "high" | "medium" | "low";
export type ColumnStage = "todo" | "in_progress" | "done" | "release";
export type Stage = ColumnStage | "archived";

export interface Team {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface Request {
  id: number;
  title: string;
  description: string;
  business_impact: string;
  requester: string;
  priority: Priority;
  status: Status;
  risk: Risk | null;
  start_date: string | null;
  due_date: string | null;
  release_date: string | null;
  stage: Stage | null;
  created_at: string;
  updated_at: string;
  assigned_team: string | null;
}

export interface RequestListResponse {
  items: Request[];
  total: number;
  page: number;
  page_size: number;
}

export interface KanbanCard {
  id: number;
  request_id: number;
  team_id: number;
  assignee: string;
  ticket_url: string;
  stage: Stage;
  position: number;
  created_at: string;
  updated_at: string;
  request: Request;
}

export type KanbanBoard = Record<ColumnStage, KanbanCard[]>;

export interface User {
  id: number;
  username: string;
  display_name: string;
  is_admin: boolean;
  team_ids: number[];
  created_at: string;
}

export interface Comment {
  id: number;
  request_id: number;
  author: string;
  user_id: number | null;
  content: string;
  created_at: string;
}
