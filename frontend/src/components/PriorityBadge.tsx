import { Tag } from "antd";
import type { Priority } from "../types";

const colorMap: Record<Priority, string> = {
  critical: "red",
  high: "volcano",
  medium: "gold",
  low: "default",
};

const labelMap: Record<Priority, string> = {
  critical: "緊急優先",
  high: "高優先",
  medium: "中優先",
  low: "低優先",
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return <Tag color={colorMap[priority]}>{labelMap[priority]}</Tag>;
}
