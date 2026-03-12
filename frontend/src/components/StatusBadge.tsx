import { Badge } from "@/components/ui/badge";
import type { Status } from "../types";

const styleMap: Record<Status, string> = {
  new: "bg-blue-100 text-blue-700",
  assigned: "bg-cyan-100 text-cyan-700",
  done: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  archived: "bg-gray-100 text-gray-600",
};

const labelMap: Record<Status, string> = {
  new: "新需求",
  assigned: "已指派",
  done: "已完成",
  cancelled: "已取消",
  archived: "已結案",
};

export default function StatusBadge({ status }: { status: Status }) {
  return <Badge className={styleMap[status]}>{labelMap[status]}</Badge>;
}
