import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, Typography } from "antd";
import { useRef } from "react";
import type { KanbanCard as KanbanCardType } from "../types";
import PriorityBadge from "./PriorityBadge";
import RiskBadge from "./RiskBadge";

const { Text } = Typography;

interface Props {
  card: KanbanCardType;
  onEdit: () => void;
}

export default function KanbanCard({ card, onEdit }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id, data: { card } });
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || "transform 200ms ease",
    opacity: isDragging ? 0.4 : 1,
    marginBottom: 8,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
        listeners?.onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        if (!pointerStart.current) return;
        const dx = Math.abs(e.clientX - pointerStart.current.x);
        const dy = Math.abs(e.clientY - pointerStart.current.y);
        if (dx < 5 && dy < 5) onEdit();
        pointerStart.current = null;
      }}
    >
      <Card size="small">
        <div style={{ marginBottom: 4 }}>
          <Text strong>#{card.request.id} {card.request.title}</Text>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <PriorityBadge priority={card.request.priority} />
          {card.request.risk && <RiskBadge risk={card.request.risk} />}
          {card.assignee && <Text type="secondary">{card.assignee}</Text>}
        </div>
      </Card>
    </div>
  );
}
