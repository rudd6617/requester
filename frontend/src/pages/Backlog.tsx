import { Button, DatePicker, Form, Input, message, Modal, Select, Space, Table, Typography } from "antd";
import type { TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import {
  useCreateKanbanCard,
  useRequests,
  useTeams,
  useUpdateRequest,
} from "../hooks/useRequests";
import type { Priority, Request, Status } from "../types";
import PriorityBadge from "../components/PriorityBadge";
import StatusBadge from "../components/StatusBadge";

const { Title } = Typography;
const { TextArea } = Input;

export default function Backlog() {
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

  const [assignModal, setAssignModal] = useState<Request | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  const [editForm] = Form.useForm();

  useEffect(() => {
    if (editingRequest) {
      editForm.setFieldsValue({
        title: editingRequest.title,
        description: editingRequest.description,
        business_impact: editingRequest.business_impact,
        requester: editingRequest.requester,
        module: editingRequest.module,
        priority: editingRequest.priority,
        start_date: editingRequest.start_date ? dayjs(editingRequest.start_date) : null,
        due_date: editingRequest.due_date ? dayjs(editingRequest.due_date) : null,
      });
    }
  }, [editingRequest, editForm]);

  const handleStatusChange = (id: number, status: Status) => {
    updateRequest.mutate(
      { id, status },
      { onError: () => message.error("狀態更新失敗") }
    );
  };

  const handleEditSubmit = () => {
    if (!editingRequest) return;
    editForm.validateFields().then((values) => {
      const payload = {
        ...values,
        start_date: values.start_date?.format("YYYY-MM-DD") || null,
        due_date: values.due_date?.format("YYYY-MM-DD") || null,
      };
      updateRequest.mutate(
        { id: editingRequest.id, ...payload },
        {
          onSuccess: () => {
            message.success("需求已更新");
            setEditingRequest(null);
          },
          onError: () => message.error("更新失敗"),
        }
      );
    });
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

  const handleTableChange = (
    pagination: TablePaginationConfig,
    tableFilters: Record<string, (string | number | boolean)[] | null>
  ) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current || 1,
      page_size: pagination.pageSize || 20,
      ...(tableFilters.status?.[0] != null
        ? { status: tableFilters.status[0] as string }
        : { status: undefined as unknown as string }),
      ...(tableFilters.priority?.[0] != null
        ? { priority: tableFilters.priority[0] as string }
        : { priority: undefined as unknown as string }),
    }));
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "標題", dataIndex: "title", ellipsis: true },
    { title: "提出人", dataIndex: "requester", width: 120 },
    { title: "模組", dataIndex: "module", width: 120 },
    {
      title: "優先級",
      dataIndex: "priority",
      width: 100,
      filters: [
        { text: "緊急", value: "critical" },
        { text: "高", value: "high" },
        { text: "中", value: "medium" },
        { text: "低", value: "low" },
      ],
      filterMultiple: false,
      render: (p: Priority) => <PriorityBadge priority={p} />,
    },
    {
      title: "狀態",
      dataIndex: "status",
      width: 130,
      filters: [
        { text: "新需求", value: "new" },
        { text: "評估中", value: "triage" },
        { text: "已核准", value: "approved" },
        { text: "已拒絕", value: "rejected" },
        { text: "已延後", value: "postponed" },
      ],
      filterMultiple: false,
      render: (s: Status) => <StatusBadge status={s} />,
    },
    {
      title: "建立日期",
      dataIndex: "created_at",
      width: 120,
      render: (d: string) => dayjs(d).format("YYYY-MM-DD"),
    },
    {
      title: "操作",
      width: 280,
      render: (_: unknown, record: Request) => (
        <Space size="small">
          <Button size="small" onClick={() => setEditingRequest(record)}>
            編輯
          </Button>
          <Select
            size="small"
            value={record.status}
            style={{ width: 110 }}
            onChange={(val: Status) => handleStatusChange(record.id, val)}
            options={[
              { value: "new", label: "新需求" },
              { value: "triage", label: "評估中" },
              { value: "approved", label: "已核准" },
              { value: "rejected", label: "已拒絕" },
              { value: "postponed", label: "已延後" },
            ]}
          />
          {record.status === "approved" && (
            <Button size="small" type="primary" onClick={() => setAssignModal(record)}>
              指派
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Title level={3}>需求池</Title>
      <Table
        dataSource={data?.items}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        onChange={handleTableChange}
        pagination={{
          current: data?.page,
          pageSize: data?.page_size,
          total: data?.total,
          showSizeChanger: true,
        }}
      />

      <Modal
        title="編輯需求"
        open={!!editingRequest}
        onOk={handleEditSubmit}
        onCancel={() => setEditingRequest(null)}
        okText="儲存"
        cancelText="取消"
        confirmLoading={updateRequest.isPending}
        width={640}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="title" label="標題" rules={[{ required: true, message: "請輸入標題" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="requester" label="提出人" rules={[{ required: true, message: "請輸入提出人" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="module" label="模組">
            <Input />
          </Form.Item>
          <Form.Item name="priority" label="優先級">
            <Select
              options={[
                { value: "critical", label: "緊急" },
                { value: "high", label: "高" },
                { value: "medium", label: "中" },
                { value: "low", label: "低" },
              ]}
            />
          </Form.Item>
          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item name="start_date" label="開始日" style={{ flex: 1 }}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="due_date" label="截止日" style={{ flex: 1 }}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Form.Item name="description" label="描述">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="business_impact" label="業務影響">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

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
