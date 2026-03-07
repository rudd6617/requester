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
import { Button, Card, DatePicker, Divider, Drawer, Form, Input, message, Modal, Segmented, Select, Spin, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import GanttView from "../components/GanttView";
import KanbanColumn from "../components/KanbanColumn";
import PriorityBadge from "../components/PriorityBadge";
import CommentSection from "../components/CommentSection";
import {
  useKanbanCards,
  useMoveKanbanCard,
  useTeams,
  useUpdateKanbanCard,
  useUpdateRequest,
} from "../hooks/useRequests";
import type { KanbanCard, Stage } from "../types";

const { Title, Text } = Typography;
const { TextArea } = Input;

const STAGES: Stage[] = ["todo", "in_progress", "review", "done"];

const stageOptions = [
  { value: "todo", label: "待辦" },
  { value: "in_progress", label: "進行中" },
  { value: "review", label: "審查中" },
  { value: "done", label: "已完成" },
];

const priorityOptions = [
  { value: "critical", label: "緊急" },
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
];

type ViewMode = "kanban" | "gantt";

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
};

export default function KanbanBoard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const teamId = searchParams.get("team_id")
    ? Number(searchParams.get("team_id"))
    : null;
  const viewParam = searchParams.get("view") as ViewMode | null;
  const viewMode: ViewMode = viewParam === "gantt" ? "gantt" : "kanban";

  const { data: teams } = useTeams();
  const { data: board, isLoading } = useKanbanCards(teamId);
  const moveCard = useMoveKanbanCard();
  const updateCard = useUpdateKanbanCard();
  const updateRequest = useUpdateRequest();
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [editMode, setEditMode] = useState<"drawer" | "modal">("drawer");
  const [cardForm] = Form.useForm();
  const [requestForm] = Form.useForm();

  const allCards = useMemo(() => {
    if (!board) return [];
    return [...board.todo, ...board.in_progress, ...board.review, ...board.done];
  }, [board]);

  const ganttRequests = useMemo(() => allCards.map((c) => c.request), [allCards]);

  const handleGanttClick = (requestId: number) => {
    const card = allCards.find((c) => c.request.id === requestId);
    if (card) setEditingCard(card);
  };

  useEffect(() => {
    if (editingCard) {
      cardForm.setFieldsValue({
        assignee: editingCard.assignee,
        stage: editingCard.stage,
      });
      requestForm.setFieldsValue({
        title: editingCard.request.title,
        description: editingCard.request.description,
        business_impact: editingCard.request.business_impact,
        requester: editingCard.request.requester,
        priority: editingCard.request.priority,
        start_date: editingCard.request.start_date ? dayjs(editingCard.request.start_date) : null,
        due_date: editingCard.request.due_date ? dayjs(editingCard.request.due_date) : null,
      });
    }
  }, [editingCard, cardForm, requestForm]);

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
      const lastPos = targetCards.length > 0 ? targetCards[targetCards.length - 1].position : 0;
      position = lastPos + 1000;
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

  const [saving, setSaving] = useState(false);

  const handleEditSubmit = async () => {
    if (!editingCard) return;
    const cardValues = await cardForm.validateFields();
    const requestValues = await requestForm.validateFields();
    const requestPayload = {
      ...requestValues,
      start_date: requestValues.start_date?.format("YYYY-MM-DD") || null,
      due_date: requestValues.due_date?.format("YYYY-MM-DD") || null,
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

  const handleViewChange = (val: ViewMode) => {
    const params: Record<string, string> = {};
    if (teamId) params.team_id = String(teamId);
    if (val !== "kanban") params.view = val;
    setSearchParams(params);
  };

  const handleTeamChange = (val: string | number) => {
    const v = String(val);
    const params: Record<string, string> = {};
    if (v !== "all") params.team_id = v;
    if (viewMode !== "kanban") params.view = viewMode;
    setSearchParams(params);
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
          value={viewMode}
          onChange={(val) => handleViewChange(val as ViewMode)}
          options={[
            { value: "kanban", icon: <ProjectOutlined />, label: "看板" },
            { value: "gantt", icon: <BarChartOutlined />, label: "甘特圖" },
          ]}
        />
        <Segmented
          value={editMode}
          onChange={(val) => setEditMode(val as "drawer" | "modal")}
          options={[
            { value: "drawer", label: "Drawer" },
            { value: "modal", label: "Modal" },
          ]}
          size="small"
        />
      </div>
      <div style={{ marginBottom: 16, padding: "8px 12px", background: "#f5f5f5", borderRadius: 8 }}>
        <Segmented
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
                onEditCard={setEditingCard}
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

      {(() => {
        const editContent = editingCard && (
          <>
            <Text type="secondary" strong>卡片資訊</Text>
            <Form form={cardForm} layout="vertical" style={{ marginTop: 8 }}>
              <div style={{ display: "flex", gap: 16 }}>
                <Form.Item name="assignee" label="負責人" style={{ flex: 1 }}>
                  <Input />
                </Form.Item>
                <Form.Item name="stage" label="階段" style={{ flex: 1 }}>
                  <Select options={stageOptions} />
                </Form.Item>
              </div>
            </Form>
            <Divider />
            <Text type="secondary" strong>需求內容</Text>
            <Form form={requestForm} layout="vertical" style={{ marginTop: 8 }}>
              <Form.Item name="title" label="標題" rules={[{ required: true, message: "請輸入標題" }]}>
                <Input />
              </Form.Item>
              <div style={{ display: "flex", gap: 16 }}>
                <Form.Item name="requester" label="提出人" rules={[{ required: true, message: "請輸入提出人" }]} style={{ flex: 1 }}>
                  <Input />
                </Form.Item>
                <Form.Item name="priority" label="優先級" style={{ flex: 1 }}>
                  <Select options={priorityOptions} />
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
              <Form.Item name="description" label="描述">
                <TextArea rows={3} />
              </Form.Item>
              <Form.Item name="business_impact" label="業務影響">
                <TextArea rows={3} />
              </Form.Item>
            </Form>

            <Button type="primary" onClick={handleEditSubmit} loading={saving}>
              儲存
            </Button>

            <Divider />
            <Title level={5} style={{ marginBottom: 12 }}>評論</Title>
            <CommentSection requestId={editingCard.request.id} />
          </>
        );

        const editTitle = editingCard ? `#${editingCard.request.id} ${editingCard.request.title}` : "";

        return editMode === "drawer" ? (
          <Drawer title={editTitle} open={!!editingCard} onClose={() => setEditingCard(null)} width={560}>
            {editContent}
          </Drawer>
        ) : (
          <Modal title={editTitle} open={!!editingCard} onCancel={() => setEditingCard(null)} footer={null} width={560}>
            {editContent}
          </Modal>
        );
      })()}
    </>
  );
}
