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
import { BarChartOutlined, ProjectOutlined } from "@ant-design/icons";
import { Button, Card, DatePicker, Divider, Drawer, Form, Input, message, Segmented, Select, Spin, Typography } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import GanttView from "../components/GanttView";
import KanbanColumn from "../components/KanbanColumn";
import PriorityBadge from "../components/PriorityBadge";
import {
  useKanbanCards,
  useMoveKanbanCard,
  useTeams,
  useUpdateKanbanCard,
  useUpdateRequest,
} from "../hooks/useRequests";
import { developStatusOptions, priorityOptions, riskOptions } from "../constants";
import type { KanbanCard, Stage } from "../types";

const { Title, Text } = Typography;
const { TextArea } = Input;

const STAGES: Stage[] = ["todo", "in_progress", "review", "done"];

type ViewMode = "kanban" | "gantt";

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
};

export default function KanbanBoard() {
  const [teamId, setTeamId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  const { data: teams } = useTeams();
  const { data: board, isLoading } = useKanbanCards(teamId);
  const moveCard = useMoveKanbanCard();
  const updateCard = useUpdateKanbanCard();
  const updateRequest = useUpdateRequest();
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [cardForm] = Form.useForm();
  const [requestForm] = Form.useForm();

  const allCards = useMemo(() => {
    if (!board) return [];
    return [...board.todo, ...board.in_progress, ...board.review, ...board.done];
  }, [board]);

  const ganttRequests = useMemo(() => allCards.map((c) => c.request), [allCards]);

  const handleGanttClick = (requestId: number) => {
    const card = allCards.find((c) => c.request.id === requestId);
    if (card) handleOpenCard(card);
  };

  const handleOpenCard = (card: KanbanCard) => {
    setEditingCard(card);
    cardForm.setFieldsValue({
      assignee: card.assignee,
      ticket_url: card.ticket_url,
    });
    requestForm.setFieldsValue({
      title: card.request.title,
      description: card.request.description,
      business_impact: card.request.business_impact,
      requester: card.request.requester,
      priority: card.request.priority,
      risk: card.request.risk,
      start_date: card.request.start_date ? dayjs(card.request.start_date) : null,
      due_date: card.request.due_date ? dayjs(card.request.due_date) : null,
      release_date: card.request.release_date ? dayjs(card.request.release_date) : null,
      develop_status: card.request.develop_status,
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const findCardStage = (cardId: number): Stage | null => {
    if (!board) return null;
    for (const stage of STAGES) {
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
    let targetStage: Stage;

    if (STAGES.includes(over.id as Stage)) {
      targetStage = over.id as Stage;
    } else {
      const overCard = over.data.current?.card as KanbanCard | undefined;
      targetStage = overCard ? overCard.stage : (findCardStage(over.id as number) ?? "todo");
    }

    const sourceStage = findCardStage(cardId);
    if (!sourceStage) return;

    const targetCards = board[targetStage].filter((c) => c.id !== cardId);
    let position: number;

    if (STAGES.includes(over.id as Stage)) {
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

  const getAppendPosition = (stage: Stage) => {
    const cards = board?.[stage] ?? [];
    return cards.length > 0 ? cards[cards.length - 1].position + 1000 : 1000;
  };

  const [saving, setSaving] = useState(false);

  const handleEditSubmit = async () => {
    if (!editingCard) return;
    const cardValues = await cardForm.validateFields();
    const requestValues = await requestForm.validateFields();
    const requestPayload = {
      ...requestValues,
      start_date: requestValues.start_date?.format("YYYY-MM-DD") || null,
      due_date: requestValues.due_date?.format("YYYY-MM-DD") || null,
      release_date: requestValues.release_date?.format("YYYY-MM-DD") || null,
    };
    setSaving(true);
    try {
      await Promise.all([
        updateCard.mutateAsync({ id: editingCard.id, ...cardValues }),
        updateRequest.mutateAsync({ id: editingCard.request.id, ...requestPayload }),
      ]);
      message.success("已更新");
      setEditingCard(null);
    } catch {
      message.error("更新失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = () => {
    if (!editingCard) return;
    updateRequest.mutate(
      { id: editingCard.request.id, status: "archived" },
      {
        onSuccess: () => {
          message.success("需求已結案");
          setEditingCard(null);
        },
        onError: () => message.error("結案失敗"),
      }
    );
  };

  const handleTeamChange = (val: string | number) => {
    const v = String(val);
    setTeamId(v === "all" ? null : Number(v));
  };

  const teamOptions = useMemo(
    () => [
      { value: "all", label: "全部" },
      ...(teams?.map((t) => ({ value: String(t.id), label: t.name })) || []),
    ],
    [teams]
  );

  return (
    <>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}>
        <Title level={3} style={{ margin: 0 }}>
          開發看板
        </Title>
        <Segmented
          className="seg-white"
          value={viewMode}
          onChange={(val) => setViewMode(val as ViewMode)}
          options={[
            { value: "kanban", icon: <ProjectOutlined />, label: "看板" },
            { value: "gantt", icon: <BarChartOutlined />, label: "甘特圖" },
          ]}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Segmented
          className="seg-white"
          value={teamId ? String(teamId) : "all"}
          onChange={handleTeamChange}
          options={teamOptions}
        />
      </div>

      {isLoading && <Spin />}

      {board && viewMode === "kanban" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: "flex", gap: 16, overflowX: "auto", height: "calc(100vh - 160px)" }}>
            {STAGES.map((stage) => (
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
              <Card size="small" style={{ width: 260, opacity: 0.9, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                <Text strong>
                  #{activeCard.request.id} {activeCard.request.title}
                </Text>
                <div style={{ marginTop: 4 }}>
                  <PriorityBadge priority={activeCard.request.priority} />
                </div>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {board && viewMode === "gantt" && (
        <GanttView requests={ganttRequests} onClickRequest={handleGanttClick} />
      )}

      <Drawer
        title={editingCard ? `#${editingCard.request.id} ${editingCard.request.title}` : ""}
        open={!!editingCard}
        onClose={() => setEditingCard(null)}
        width={560}
        extra={editingCard && (
          <Button type="primary" onClick={handleEditSubmit} loading={saving}>
            更新
          </Button>
        )}
      >
        {editingCard && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {([
                { stage: "todo" as Stage, label: "待處理" },
                { stage: "in_progress" as Stage, label: "進行" },
                { stage: "review" as Stage, label: "審查" },
                { stage: "done" as Stage, label: "完成" },
              ] as const).map(({ stage, label }) => (
                <Button
                  key={stage}
                  type={editingCard.stage === stage ? "primary" : "default"}
                  disabled={editingCard.stage === stage}
                  onClick={async () => {
                    const cardValues = await cardForm.validateFields();
                    await updateCard.mutateAsync({ id: editingCard.id, assignee: cardValues.assignee });
                    moveCard.mutate(
                      { id: editingCard.id, stage, position: getAppendPosition(stage) },
                      {
                        onSuccess: () => {
                          message.success(`已移至${label}`);
                          setEditingCard(null);
                        },
                      }
                    );
                  }}
                >
                  {label}
                </Button>
              ))}
              <Button
                danger
                disabled={editingCard.stage !== "done"}
                onClick={handleArchive}
              >
                結案
              </Button>
            </div>
            <Form form={cardForm} layout="vertical">
              <div style={{ display: "flex", gap: 16 }}>
                <Form.Item name="assignee" label="負責人" style={{ flex: 1 }}>
                  <Input />
                </Form.Item>
                <Form.Item name="ticket_url" label="關聯工單" style={{ flex: 1 }}>
                  <Input placeholder="輸入工單網址" />
                </Form.Item>
              </div>
            </Form>
            <Divider style={{ margin: "8px 0" }} />
            <Form form={requestForm} layout="vertical">
              <div style={{ display: "flex", gap: 16 }}>
                <Form.Item name="title" label="標題" rules={[{ required: true, message: "請輸入標題" }]} style={{ flex: 1 }}>
                  <Input />
                </Form.Item>
                <Form.Item name="requester" label="提出人" rules={[{ required: true, message: "請輸入提出人" }]} style={{ flex: 1 }}>
                  <Input />
                </Form.Item>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <Form.Item name="priority" label="優先級" style={{ flex: 1 }}>
                  <Select options={priorityOptions} />
                </Form.Item>
                <Form.Item name="risk" label="風險" style={{ flex: 1 }}>
                  <Select options={riskOptions} allowClear placeholder="選擇風險等級" />
                </Form.Item>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <Form.Item name="start_date" label="開始日" style={{ flex: 1 }}>
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="due_date" label="截止日" style={{ flex: 1 }}>
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <Form.Item name="develop_status" label="開發狀態" style={{ flex: 1 }}>
                  <Select options={developStatusOptions} allowClear placeholder="選擇狀態" />
                </Form.Item>
                <Form.Item name="release_date" label="上線日" style={{ flex: 1 }}>
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </div>
              <Form.Item name="description" label="描述">
                <TextArea rows={2} />
              </Form.Item>
              <Form.Item name="business_impact" label="業務影響">
                <TextArea rows={2} />
              </Form.Item>
            </Form>

          </>
        )}
      </Drawer>
    </>
  );
}
