import { Badge } from "@/components/ui/badge";
import type { Risk } from "../types";

const styleMap: Record<Risk, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-orange-100 text-orange-700",
  low: "bg-green-100 text-green-700",
};

const labelMap: Record<Risk, string> = {
  high: "高風險",
  medium: "中風險",
  low: "低風險",
};

export default function RiskBadge({ risk }: { risk: Risk }) {
  return <Badge className={styleMap[risk]}>{labelMap[risk]}</Badge>;
}
