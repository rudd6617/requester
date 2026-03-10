import { stageOptions } from "../constants";
import type { Stage } from "../types";

export default function StageBadge({ stage }: { stage: Stage }) {
  const opt = stageOptions.find((o) => o.value === stage);
  return opt ? <>{opt.label}</> : null;
}
