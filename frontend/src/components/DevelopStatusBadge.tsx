import { Tag } from "antd";
import type { DevelopStatus } from "../types";

const colorMap: Record<DevelopStatus, string> = {
  todo: "default",
  in_progress: "processing",
  review: "warning",
  done: "green",
};

const labelMap: Record<DevelopStatus, string> = {
  todo: "待處理",
  in_progress: "進行中",
  review: "審查中",
  done: "已完成",
};

export default function DevelopStatusBadge({ status }: { status: DevelopStatus }) {
  return <Tag color={colorMap[status]}>{labelMap[status]}</Tag>;
}
