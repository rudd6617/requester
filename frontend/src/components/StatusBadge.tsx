import { Tag } from "antd";
import type { Status } from "../types";

const colorMap: Record<Status, string> = {
  new: "blue",
  triage: "orange",
  in_progress: "cyan",
  done: "green",
  closed: "default",
  cancelled: "red",
};

const labelMap: Record<Status, string> = {
  new: "新需求",
  triage: "評估中",
  in_progress: "進行中",
  done: "已完成",
  closed: "已關閉",
  cancelled: "已取消",
};

export default function StatusBadge({ status }: { status: Status }) {
  return <Tag color={colorMap[status]}>{labelMap[status]}</Tag>;
}
