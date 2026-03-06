import { Card, Typography } from "antd";
import dayjs from "dayjs";
import type { Request } from "../types";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";

const { Text } = Typography;

export default function RequestCard({ request }: { request: Request }) {
  return (
    <Card size="small" style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <Text strong>#{request.id} {request.title}</Text>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <StatusBadge status={request.status} />
        <PriorityBadge priority={request.priority} />
        <Text type="secondary">{request.requester}</Text>
        <Text type="secondary">{dayjs(request.created_at).format("YYYY-MM-DD")}</Text>
      </div>
    </Card>
  );
}
