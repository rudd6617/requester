import {
  Button,
  DatePicker,
  Divider,
  Drawer,
  Form,
  Input,
  message,

  Select,
  Space,
  Table,
  Typography,
} from "antd";
import type { TablePaginationConfig, SorterResult } from "antd/es/table/interface";
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

const { Title } = Typography;
const { TextArea } = Input;

const statusOptions = [
  { value: "new", label: "新需求" },
  { value: "assigned", label: "已指派" },
  { value: "done", label: "已完成" },
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

  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  useEffect(() => {
    if (detailRequest) {
      drawerForm.setFieldsValue({
        title: detailRequest.title,
        description: detailRequest.description,
        business_impact: detailRequest.business_impact,
        requester: detailRequest.requester,
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

  const handleCancel = () => {
    if (!detailRequest) return;
    updateRequest.mutate(
      { id: detailRequest.id, status: "cancelled" },
      {
        onSuccess: () => {
          message.success("需求已取消");
          setDetailRequest((prev) => (prev ? { ...prev, status: "cancelled" } : null));
        },
        onError: () => message.error("取消失敗"),
      }
    );
  };

  const handleAssign = () => {
    if (!detailRequest || !selectedTeam) return;
    createCard.mutate(
      { request_id: detailRequest.id, team_id: selectedTeam },
      {
        onSuccess: () => {
          message.success("已建立看板卡片");
          setSelectedTeam(null);
        },
        onError: (err: any) =>
          message.error(err?.response?.data?.detail || "建立卡片失敗"),
      }
    );
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<Request> | SorterResult<Request>[],
  ) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    setFilters((prev) => {
      const next: Record<string, string | number> = {
        ...prev,
        page: pagination.current || 1,
        page_size: pagination.pageSize || 20,
      };
      if (s?.field && s.order) {
        next.sort = String(s.field);
        next.order = s.order === "ascend" ? "asc" : "desc";
      } else {
        next.sort = "created_at";
        next.order = "desc";
      }
      return next;
    });
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
    { title: "ID", dataIndex: "id", width: 80, sorter: true },
    { title: "標題", dataIndex: "title", ellipsis: true, sorter: true },
    { title: "提出人", dataIndex: "requester", width: 100, sorter: true },
    {
      title: "優先級",
      dataIndex: "priority",
      width: 90,
      sorter: true,
      render: (p: Priority) => <PriorityBadge priority={p} />,
    },
    {
      title: "狀態",
      dataIndex: "status",
      width: 100,
      sorter: true,
      render: (s: Status) => <StatusBadge status={s} />,
    },
    {
      title: "指派團隊",
      dataIndex: "assigned_team",
      width: 120,
      render: (team: string | null) => team || "-",
    },
    {
      title: "建立日期",
      dataIndex: "created_at",
      width: 120,
      sorter: true,
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
        onClose={() => { setDetailRequest(null); setSelectedTeam(null); }}
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
                  <StatusBadge status={detailRequest.status} />
                </Form.Item>
                {isRD && (detailRequest.status === "new" || detailRequest.status === "assigned") && (
                  <Form.Item label="指派團隊" style={{ flex: 1 }}>
                    <Space.Compact style={{ width: "100%" }}>
                      <Select
                        placeholder="選擇團隊"
                        style={{ flex: 1 }}
                        value={selectedTeam}
                        onChange={setSelectedTeam}
                        options={teams?.map((t) => ({ value: t.id, label: t.name }))}
                      />
                      <Button type="primary" onClick={handleAssign} loading={createCard.isPending} disabled={!selectedTeam}>
                        {detailRequest.status === "assigned" ? "重新指派" : "指派"}
                      </Button>
                    </Space.Compact>
                  </Form.Item>
                )}
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
              {isRD && detailRequest.status === "new" && (
                <Button danger onClick={handleCancel}>取消需求</Button>
              )}
            </Space>

            <Divider />
            <Title level={5} style={{ marginBottom: 12 }}>評論</Title>
            <CommentSection requestId={detailRequest.id} />
          </>
        )}
      </Drawer>



    </>
  );
}
