import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Typography } from "antd";
import type { ColumnStage, KanbanCard as KanbanCardType } from "../types";
import KanbanCard from "./KanbanCard";

const { Title } = Typography;

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
      style={{
        flex: 1,
        minWidth: 260,
        background: isOver ? "#ebecf0" : "#f4f5f7",
        border: "1px solid #dfe1e6",
        borderRadius: 8,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Title level={5} style={{ margin: "0 0 12px 0", flexShrink: 0 }}>
        {stageLabels[stage]} ({cards.length})
      </Title>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
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
