import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditOutlined } from "@ant-design/icons";
import { Card, Typography } from "antd";
import type { KanbanCard as KanbanCardType } from "../types";
import PriorityBadge from "./PriorityBadge";

const { Text } = Typography;

interface Props {
  card: KanbanCardType;
  onEdit: () => void;
}

export default function KanbanCard({ card, onEdit }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id, data: { card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginBottom: 8,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        size="small"
        extra={
          <EditOutlined
            style={{ cursor: "pointer" }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          />
        }
      >
        <div style={{ marginBottom: 4 }}>
          <Text strong>#{card.request.id} {card.request.title}</Text>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <PriorityBadge priority={card.request.priority} />
          {card.assignee && <Text type="secondary">{card.assignee}</Text>}
        </div>
      </Card>
    </div>
  );
}
