import { Badge } from "@/components/ui/badge";
import type { Stage } from "../types";

const styleMap: Record<Stage, string> = {
  todo: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
  release: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-100 text-gray-600",
};

const labelMap: Record<Stage, string> = {
  todo: "待辦",
  in_progress: "進行中",
  done: "已完成",
  release: "待上線",
  archived: "結案",
};

export default function StageBadge({ stage }: { stage: Stage }) {
  return <Badge className={styleMap[stage]}>{labelMap[stage]}</Badge>;
}
