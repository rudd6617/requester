import type { ReactNode } from "react";
import PriorityBadge from "./components/PriorityBadge";
import RiskBadge from "./components/RiskBadge";
import StatusBadge from "./components/StatusBadge";
import StageBadge from "./components/StageBadge";
import type { Priority, Risk, Stage, Status } from "./types";

type Option<T> = { value: T; label: ReactNode };

export const priorityOptions: Option<Priority>[] = [
  { value: "critical", label: <PriorityBadge priority="critical" /> },
  { value: "high", label: <PriorityBadge priority="high" /> },
  { value: "medium", label: <PriorityBadge priority="medium" /> },
  { value: "low", label: <PriorityBadge priority="low" /> },
];

export const riskOptions: Option<Risk>[] = [
  { value: "high", label: <RiskBadge risk="high" /> },
  { value: "medium", label: <RiskBadge risk="medium" /> },
  { value: "low", label: <RiskBadge risk="low" /> },
];

export const stageOptions: Option<Stage>[] = [
  { value: "todo", label: <StageBadge stage="todo" /> },
  { value: "in_progress", label: <StageBadge stage="in_progress" /> },
  { value: "done", label: <StageBadge stage="done" /> },
  { value: "release", label: <StageBadge stage="release" /> },
  { value: "archived", label: <StageBadge stage="archived" /> },
];

export const statusOptions: Option<Status>[] = [
  { value: "new", label: <StatusBadge status="new" /> },
  { value: "assigned", label: <StatusBadge status="assigned" /> },
  { value: "done", label: <StatusBadge status="done" /> },
  { value: "cancelled", label: <StatusBadge status="cancelled" /> },
  { value: "archived", label: <StatusBadge status="archived" /> },
];
