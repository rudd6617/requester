import { Card, CardContent } from "@/components/ui/card";
import dayjs from "dayjs";
import type { Request } from "../types";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";

export default function RequestCard({ request }: { request: Request }) {
  return (
    <Card className="mb-2">
      <CardContent className="p-3">
        <p className="mb-1 font-semibold">#{request.id} {request.title}</p>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={request.status} />
          <PriorityBadge priority={request.priority} />
          <span className="text-sm text-muted-foreground">{request.requester}</span>
          <span className="text-sm text-muted-foreground">{dayjs(request.created_at).format("YYYY-MM-DD")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
