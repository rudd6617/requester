import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Typography } from "antd";
import type { KanbanCard as KanbanCardType, Stage } from "../types";
import KanbanCard from "./KanbanCard";

const { Title } = Typography;

const stageLabels: Record<Stage, string> = {
  todo: "待辦",
  in_progress: "進行中",
  review: "審查中",
  done: "已完成",
};

const stageColors: Record<Stage, string> = {
  todo: "#e6f7ff",
  in_progress: "#fff7e6",
  review: "#f6ffed",
  done: "#f9f0ff",
};

interface Props {
  stage: Stage;
  cards: KanbanCardType[];
  onEditCard: (card: KanbanCardType) => void;
}

export default function KanbanColumn({ stage, cards, onEditCard }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minWidth: 260,
        background: isOver ? "#f0f0f0" : stageColors[stage],
        borderRadius: 8,
        padding: 12,
        minHeight: 400,
      }}
    >
      <Title level={5} style={{ marginBottom: 12 }}>
        {stageLabels[stage]} ({cards.length})
      </Title>
      <SortableContext
        items={cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        {cards.map((card) => (
          <KanbanCard key={card.id} card={card} onEdit={() => onEditCard(card)} />
        ))}
      </SortableContext>
    </div>
  );
}
