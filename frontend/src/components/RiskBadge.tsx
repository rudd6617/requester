import { Tag } from "antd";
import type { Risk } from "../types";

const colorMap: Record<Risk, string> = {
  high: "red",
  medium: "orange",
  low: "green",
};

const labelMap: Record<Risk, string> = {
  high: "高風險",
  medium: "中風險",
  low: "低風險",
};

export default function RiskBadge({ risk }: { risk: Risk }) {
  return <Tag color={colorMap[risk]}>{labelMap[risk]}</Tag>;
}
