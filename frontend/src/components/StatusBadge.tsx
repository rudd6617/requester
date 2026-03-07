import { Tag } from "antd";
import type { Status } from "../types";

const colorMap: Record<Status, string> = {
  new: "blue",
  assigned: "cyan",
  done: "green",
  cancelled: "red",
  archived: "default",
};

const labelMap: Record<Status, string> = {
  new: "新需求",
  assigned: "已指派",
  done: "已完成",
  cancelled: "已取消",
  archived: "已結案",
};

export default function StatusBadge({ status }: { status: Status }) {
  return <Tag color={colorMap[status]}>{labelMap[status]}</Tag>;
}
