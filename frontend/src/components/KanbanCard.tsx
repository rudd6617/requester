import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { useRef } from "react";
import type { KanbanCard as KanbanCardType } from "../types";
import PriorityBadge from "./PriorityBadge";
import RiskBadge from "./RiskBadge";

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
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-2"
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
      <Card>
        <CardContent className="p-3">
          <div className="mb-1">
            <span className="font-semibold">#{card.request.id} {card.request.title}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={card.request.priority} />
            {card.request.risk && <RiskBadge risk={card.request.risk} />}
            {card.assignee && <span className="text-sm text-muted-foreground">{card.assignee}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
