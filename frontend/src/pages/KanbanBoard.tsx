import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { BarChart3, Columns3 } from "lucide-react";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import GanttView from "../components/GanttView";
import KanbanColumn from "../components/KanbanColumn";
import PriorityBadge from "../components/PriorityBadge";
import SegmentedControl from "../components/SegmentedControl";
import {
  useKanbanCards,
  useMoveKanbanCard,
  useTeams,
  useUpdateKanbanCard,
  useUpdateRequest,
} from "../hooks/useRequests";
import { useAuth } from "../contexts/AuthContext";
import { priorityOptions, riskOptions } from "../constants";
import type { ColumnStage, KanbanCard, Priority, Risk } from "../types";

const COLUMN_STAGES: ColumnStage[] = ["todo", "in_progress", "done", "release"];

type ViewMode = "kanban" | "gantt";

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
};

export default function KanbanBoard() {
  const { isAdmin } = useAuth();
  const [teamId, setTeamId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  const { data: teams } = useTeams();
  const { data: board, isLoading } = useKanbanCards(teamId);
  const moveCard = useMoveKanbanCard();
  const updateCard = useUpdateKanbanCard();
  const updateRequest = useUpdateRequest();
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);

  // Card form state
  const [cardAssignee, setCardAssignee] = useState("");
  const [cardTicketUrl, setCardTicketUrl] = useState("");

  // Request form state
  const [reqTitle, setReqTitle] = useState("");
  const [reqDescription, setReqDescription] = useState("");
  const [reqBusinessImpact, setReqBusinessImpact] = useState("");
  const [reqRequester, setReqRequester] = useState("");
  const [reqPriority, setReqPriority] = useState<Priority>("medium");
  const [reqRisk, setReqRisk] = useState<Risk | "">("");
  const [reqStartDate, setReqStartDate] = useState("");
  const [reqDueDate, setReqDueDate] = useState("");
  const [reqReleaseDate, setReqReleaseDate] = useState("");

  const allCards = useMemo(() => {
    if (!board) return [];
    return [...board.todo, ...board.in_progress, ...board.done, ...board.release];
  }, [board]);

  const ganttRequests = useMemo(() => allCards.map((c) => c.request), [allCards]);

  const handleGanttClick = (requestId: number) => {
    const card = allCards.find((c) => c.request.id === requestId);
    if (card) handleOpenCard(card);
  };

  const handleOpenCard = (card: KanbanCard) => {
    setEditingCard(card);
    setCardAssignee(card.assignee || "");
    setCardTicketUrl(card.ticket_url || "");
    setReqTitle(card.request.title);
    setReqDescription(card.request.description || "");
    setReqBusinessImpact(card.request.business_impact || "");
    setReqRequester(card.request.requester);
    setReqPriority(card.request.priority);
    setReqRisk(card.request.risk || "");
    setReqStartDate(card.request.start_date ? dayjs(card.request.start_date).format("YYYY-MM-DD") : "");
    setReqDueDate(card.request.due_date ? dayjs(card.request.due_date).format("YYYY-MM-DD") : "");
    setReqReleaseDate(card.request.release_date ? dayjs(card.request.release_date).format("YYYY-MM-DD") : "");
  };

  const getFormPayloads = () => {
    const cardValues = { assignee: cardAssignee, ticket_url: cardTicketUrl };
    const requestPayload = {
      title: reqTitle,
      description: reqDescription,
      business_impact: reqBusinessImpact,
      requester: reqRequester,
      priority: reqPriority,
      risk: reqRisk || null,
      start_date: reqStartDate || null,
      due_date: reqDueDate || null,
      release_date: reqReleaseDate || null,
    };
    return { cardValues, requestPayload };
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const findCardStage = (cardId: number): ColumnStage | null => {
    if (!board) return null;
    for (const stage of COLUMN_STAGES) {
      if (board[stage].some((c) => c.id === cardId)) return stage;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = event.active.data.current?.card as KanbanCard | undefined;
    setActiveCard(card || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over || !board) return;

    const cardId = active.id as number;
    let targetStage: ColumnStage;

    if (COLUMN_STAGES.includes(over.id as ColumnStage)) {
      targetStage = over.id as ColumnStage;
    } else {
      const overCard = over.data.current?.card as KanbanCard | undefined;
      targetStage = (overCard ? overCard.stage : findCardStage(over.id as number) ?? "todo") as ColumnStage;
    }

    const sourceStage = findCardStage(cardId);
    if (!sourceStage) return;

    const targetCards = board[targetStage].filter((c) => c.id !== cardId);
    let position: number;

    if (COLUMN_STAGES.includes(over.id as ColumnStage)) {
      position = getAppendPosition(targetStage);
    } else {
      const overIndex = targetCards.findIndex((c) => c.id === over.id);
      if (overIndex === 0) {
        position = Math.floor(targetCards[0].position / 2);
      } else if (overIndex === -1) {
        const lastPos = targetCards.length > 0 ? targetCards[targetCards.length - 1].position : 0;
        position = lastPos + 1000;
      } else {
        position = Math.floor(
          (targetCards[overIndex - 1].position + targetCards[overIndex].position) / 2
        );
      }
    }

    if (sourceStage === targetStage && board[sourceStage].find((c) => c.id === cardId)?.position === position) {
      return;
    }

    moveCard.mutate({ id: cardId, stage: targetStage, position });
  };

  const getAppendPosition = (stage: ColumnStage) => {
    const cards = board?.[stage] ?? [];
    return cards.length > 0 ? cards[cards.length - 1].position + 1000 : 1000;
  };

  const [saving, setSaving] = useState(false);

  const handleEditSubmit = async () => {
    if (!editingCard) return;
    const { cardValues, requestPayload } = getFormPayloads();
    setSaving(true);
    try {
      await Promise.all([
        updateCard.mutateAsync({ id: editingCard.id, ...cardValues }),
        updateRequest.mutateAsync({ id: editingCard.request.id, ...requestPayload }),
      ]);
      toast.success("已更新");
      setEditingCard(null);
    } catch {
      toast.error("更新失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = () => {
    if (!editingCard) return;
    moveCard.mutate(
      { id: editingCard.id, stage: "archived", position: 0 },
      {
        onSuccess: () => { toast.success("需求已結案"); setEditingCard(null); },
        onError: () => toast.error("結案失敗"),
      }
    );
  };

  const handleTeamChange = (val: string) => {
    setTeamId(val === "all" ? null : Number(val));
  };

  useEffect(() => {
    if (!isAdmin && teamId === null && teams?.length) {
      setTeamId(teams[0].id);
    }
  }, [teams, isAdmin, teamId]);

  const teamOptions = useMemo(() => {
    const opts = teams?.map((t) => ({ value: String(t.id), label: t.name })) || [];
    if (isAdmin) {
      return [{ value: "all", label: "全部" }, ...opts];
    }
    return opts;
  }, [teams, isAdmin]);

  return (
    <>
      <div className="mb-2 flex items-center gap-4">
        <h2 className="text-xl font-semibold">開發看板</h2>
        <SegmentedControl
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: "kanban" as ViewMode, label: <span className="flex items-center gap-1"><Columns3 className="size-4" />看板</span> },
            { value: "gantt" as ViewMode, label: <span className="flex items-center gap-1"><BarChart3 className="size-4" />甘特圖</span> },
          ]}
        />
      </div>
      <div className="mb-4">
        <SegmentedControl
          value={teamId ? String(teamId) : "all"}
          onChange={handleTeamChange}
          options={teamOptions}
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">載入中...</p>}

      {board && viewMode === "kanban" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto" style={{ height: "calc(100vh - 160px)" }}>
            {COLUMN_STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                cards={board[stage]}
                onEditCard={handleOpenCard}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={dropAnimation}>
            {activeCard && (
              <Card className="w-[260px] opacity-90 shadow-lg">
                <CardContent className="p-3">
                  <span className="font-semibold">
                    #{activeCard.request.id} {activeCard.request.title}
                  </span>
                  <div className="mt-1">
                    <PriorityBadge priority={activeCard.request.priority} />
                  </div>
                </CardContent>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {board && viewMode === "gantt" && (
        <GanttView requests={ganttRequests} onClickRequest={handleGanttClick} />
      )}

      <Sheet open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <SheetContent className="w-[560px] overflow-y-auto sm:max-w-[560px]">
          <SheetHeader>
            <SheetTitle>
              {editingCard ? `#${editingCard.request.id} ${editingCard.request.title}` : ""}
            </SheetTitle>
          </SheetHeader>

          {editingCard && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {([
                    { stage: "todo" as ColumnStage, label: "待辦" },
                    { stage: "in_progress" as ColumnStage, label: "進行" },
                    { stage: "done" as ColumnStage, label: "完成" },
                    { stage: "release" as ColumnStage, label: "上線" },
                  ]).map(({ stage, label }) => (
                    <Button
                      key={stage}
                      variant={editingCard.stage === stage ? "default" : "outline"}
                      size="sm"
                      disabled={editingCard.stage === stage}
                      onClick={async () => {
                        if (stage === "release" && !reqReleaseDate) {
                          toast.warning("請先填寫上線日期");
                          return;
                        }
                        const { cardValues, requestPayload } = getFormPayloads();
                        await Promise.all([
                          updateCard.mutateAsync({ id: editingCard.id, assignee: cardValues.assignee }),
                          updateRequest.mutateAsync({ id: editingCard.request.id, ...requestPayload }),
                        ]);
                        moveCard.mutate(
                          { id: editingCard.id, stage, position: getAppendPosition(stage) },
                          { onSuccess: () => { toast.success(`已移至${label}`); setEditingCard(null); } }
                        );
                      }}
                    >
                      {label}
                    </Button>
                  ))}
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={editingCard.stage !== "release"}
                    onClick={handleArchive}
                  >
                    結案
                  </Button>
                </div>
                <Button onClick={handleEditSubmit} disabled={saving}>
                  {saving ? "更新中..." : "更新"}
                </Button>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>負責人</Label>
                  <Input value={cardAssignee} onChange={(e) => setCardAssignee(e.target.value)} />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>關聯工單</Label>
                  <Input value={cardTicketUrl} onChange={(e) => setCardTicketUrl(e.target.value)} placeholder="輸入工單網址" />
                </div>
              </div>

              <Separator />

              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>標題</Label>
                  <Input value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} required />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>提出人</Label>
                  <Input value={reqRequester} onChange={(e) => setReqRequester(e.target.value)} required />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>優先級</Label>
                  <Select value={reqPriority} onValueChange={(v) => v && setReqPriority(v as Priority)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-2">
                  <Label>風險</Label>
                  <Select value={reqRisk} onValueChange={(v) => setReqRisk((v || "") as Risk | "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="選擇風險等級" />
                    </SelectTrigger>
                    <SelectContent>
                      {riskOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>開始日</Label>
                  <Input type="date" value={reqStartDate} onChange={(e) => setReqStartDate(e.target.value)} />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>截止日</Label>
                  <Input type="date" value={reqDueDate} onChange={(e) => setReqDueDate(e.target.value)} />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>上線日</Label>
                  <Input type="date" value={reqReleaseDate} onChange={(e) => setReqReleaseDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>描述</Label>
                <Textarea rows={2} value={reqDescription} onChange={(e) => setReqDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>業務影響</Label>
                <Textarea rows={2} value={reqBusinessImpact} onChange={(e) => setReqBusinessImpact(e.target.value)} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
