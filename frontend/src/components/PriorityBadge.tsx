import { Tag } from "antd";
import type { Priority } from "../types";

const colorMap: Record<Priority, string> = {
  critical: "red",
  high: "volcano",
  medium: "gold",
  low: "default",
};

const labelMap: Record<Priority, string> = {
  critical: "緊急",
  high: "高",
  medium: "中",
  low: "低",
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return <Tag color={colorMap[priority]}>{labelMap[priority]}</Tag>;
}
