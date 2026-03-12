import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { ColumnStage, KanbanCard as KanbanCardType } from "../types";
import KanbanCard from "./KanbanCard";

const stageLabels: Record<ColumnStage, string> = {
  todo: "待辦",
  in_progress: "進行中",
  done: "已完成",
  release: "待上線",
};

interface Props {
  stage: ColumnStage;
  cards: KanbanCardType[];
  onEditCard: (card: KanbanCardType) => void;
}

export default function KanbanColumn({ stage, cards, onEditCard }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[260px] flex-1 flex-col rounded-lg border border-border p-3 ${
        isOver ? "bg-muted/80" : "bg-muted/40"
      }`}
      style={{ height: "100%" }}
    >
      <h3 className="mb-3 shrink-0 text-base font-semibold">
        {stageLabels[stage]} ({cards.length})
      </h3>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} onEdit={() => onEditCard(card)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
