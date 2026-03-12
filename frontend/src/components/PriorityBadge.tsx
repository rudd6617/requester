import { Badge } from "@/components/ui/badge";
import type { Priority } from "../types";

const styleMap: Record<Priority, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

const labelMap: Record<Priority, string> = {
  critical: "緊急優先",
  high: "高優先",
  medium: "中優先",
  low: "低優先",
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge className={styleMap[priority]}>{labelMap[priority]}</Badge>;
}
