import { Tag } from "antd";
import type { Status } from "../types";

const colorMap: Record<Status, string> = {
  new: "blue",
  triage: "orange",
  approved: "green",
  rejected: "red",
  postponed: "default",
};

const labelMap: Record<Status, string> = {
  new: "新需求",
  triage: "評估中",
  approved: "已核准",
  rejected: "已拒絕",
  postponed: "已延後",
};

export default function StatusBadge({ status }: { status: Status }) {
  return <Tag color={colorMap[status]}>{labelMap[status]}</Tag>;
}
