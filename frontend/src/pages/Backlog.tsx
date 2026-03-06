import {
  Button,
  DatePicker,
  Divider,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Typography,
} from "antd";
import type { TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import CommentSection from "../components/CommentSection";
import PriorityBadge from "../components/PriorityBadge";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../contexts/AuthContext";
import {
  useCreateKanbanCard,
  useRequests,
  useTeams,
  useUpdateRequest,
} from "../hooks/useRequests";
import type { Priority, Request, Status } from "../types";

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusOptions = [
  { value: "new", label: "新需求" },
  { value: "triage", label: "評估中" },
  { value: "in_progress", label: "進行中" },
  { value: "done", label: "已完成" },
  { value: "closed", label: "已關閉" },
  { value: "cancelled", label: "已取消" },
];

const priorityOptions = [
  { value: "critical", label: "緊急" },
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
];

export default function Backlog() {
  const { isRD } = useAuth();

  const [filters, setFilters] = useState<Record<string, string | number>>({
    page: 1,
    page_size: 20,
    sort: "created_at",
    order: "desc",
  });
  const { data, isLoading } = useRequests(filters);
  const updateRequest = useUpdateRequest();
  const { data: teams } = useTeams();
  const createCard = useCreateKanbanCard();

  // Detail drawer
  const [detailRequest, setDetailRequest] = useState<Request | null>(null);
  const [drawerForm] = Form.useForm();

  // Assign modal
  const [assignModal, setAssignModal] = useState<Request | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  useEffect(() => {
    if (detailRequest) {
      drawerForm.setFieldsValue({
        title: detailRequest.title,
        description: detailRequest.description,
        business_impact: detailRequest.business_impact,
        requester: detailRequest.requester,
        module: detailRequest.module,
        priority: detailRequest.priority,
        start_date: detailRequest.start_date ? dayjs(detailRequest.start_date) : null,
        due_date: detailRequest.due_date ? dayjs(detailRequest.due_date) : null,
      });
    }
  }, [detailRequest, drawerForm]);

  const handleUpdate = () => {
    if (!detailRequest) return;
    drawerForm.validateFields().then((values) => {
      const payload = {
        ...values,
        start_date: values.start_date?.format("YYYY-MM-DD") || null,
        due_date: values.due_date?.format("YYYY-MM-DD") || null,
      };
      updateRequest.mutate(
        { id: detailRequest.id, ...payload },
        {
          onSuccess: () => {
            message.success("需求已更新");
            setDetailRequest((prev) => (prev ? { ...prev, ...payload } : null));
          },
          onError: () => message.error("更新失敗"),
        }
      );
    });
  };

  const handleStatusChange = (id: number, status: Status) => {
    updateRequest.mutate(
      { id, status },
      {
        onSuccess: () => {
          if (detailRequest?.id === id) {
            setDetailRequest((prev) => (prev ? { ...prev, status } : null));
          }
        },
        onError: () => message.error("狀態更新失敗"),
      }
    );
  };

  const handleAssign = () => {
    if (!assignModal || !selectedTeam) return;
    createCard.mutate(
      { request_id: assignModal.id, team_id: selectedTeam },
      {
        onSuccess: () => {
          message.success("已建立看板卡片");
          setAssignModal(null);
          setSelectedTeam(null);
        },
        onError: (err: any) =>
          message.error(err?.response?.data?.detail || "建立卡片失敗"),
      }
    );
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current || 1,
      page_size: pagination.pageSize || 20,
    }));
  };

  const updateFilter = (key: string, value: string | undefined) => {
    setFilters((prev) => {
      const next: Record<string, string | number> = { ...prev, page: 1 };
      if (value) {
        next[key] = value;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "標題", dataIndex: "title", ellipsis: true },
    { title: "提出人", dataIndex: "requester", width: 100 },
    {
      title: "優先級",
      dataIndex: "priority",
      width: 90,
      render: (p: Priority) => <PriorityBadge priority={p} />,
    },
    {
      title: "狀態",
      dataIndex: "status",
      width: 100,
      render: (s: Status) => <StatusBadge status={s} />,
    },
    {
      title: "建立日期",
      dataIndex: "created_at",
      width: 120,
      render: (d: string) => dayjs(d).format("YYYY-MM-DD"),
    },
  ];

  return (
    <>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}>
        <Title level={3} style={{ margin: 0 }}>需求池</Title>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="搜尋標題..."
          allowClear
          onSearch={(val) => updateFilter("search", val || undefined)}
          style={{ width: 240 }}
        />
        <Select
          placeholder="狀態"
          allowClear
          style={{ width: 120 }}
          options={statusOptions}
          onChange={(val) => updateFilter("status", val)}
        />
        <Select
          placeholder="優先級"
          allowClear
          style={{ width: 120 }}
          options={priorityOptions}
          onChange={(val) => updateFilter("priority", val)}
        />
      </Space>

      <Table
        dataSource={data?.items}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        onChange={handleTableChange}
        onRow={(record) => ({
          onClick: () => setDetailRequest(record),
          style: { cursor: "pointer" },
        })}
        pagination={{
          current: data?.page,
          pageSize: data?.page_size,
          total: data?.total,
          showSizeChanger: true,
        }}
      />

      {/* Detail Drawer */}
      <Drawer
        title={detailRequest ? `#${detailRequest.id} ${detailRequest.title}` : ""}
        open={!!detailRequest}
        onClose={() => setDetailRequest(null)}
        width={560}
      >
        {detailRequest && (
          <>
            <Form form={drawerForm} layout="vertical">
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
                <Form.Item label="狀態" style={{ flex: 1 }}>
                  {isRD ? (
                    <Select
                      value={detailRequest.status}
                      onChange={(val: Status) => handleStatusChange(detailRequest.id, val)}
                      options={statusOptions}
                    />
                  ) : (
                    <StatusBadge status={detailRequest.status} />
                  )}
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

            <Space>
              <Button type="primary" onClick={handleUpdate} loading={updateRequest.isPending}>
                更新
              </Button>
              {isRD && detailRequest.status === "in_progress" && (
                <Button onClick={() => setAssignModal(detailRequest)}>
                  指派
                </Button>
              )}
            </Space>

            <Divider />
            <Title level={5} style={{ marginBottom: 12 }}>評論</Title>
            <CommentSection requestId={detailRequest.id} />
          </>
        )}
      </Drawer>

      {/* Assign Modal */}
      <Modal
        title={`指派「${assignModal?.title}」到團隊`}
        open={!!assignModal}
        onOk={handleAssign}
        onCancel={() => {
          setAssignModal(null);
          setSelectedTeam(null);
        }}
        okText="確認"
        cancelText="取消"
        okButtonProps={{ disabled: !selectedTeam }}
        confirmLoading={createCard.isPending}
      >
        <Select
          placeholder="選擇團隊"
          style={{ width: "100%" }}
          value={selectedTeam}
          onChange={setSelectedTeam}
          options={teams?.map((t) => ({ value: t.id, label: t.name }))}
        />
      </Modal>
    </>
  );
}
