import { Button, Form, Input, message, Modal, Popconfirm, Space, Table, Typography } from "antd";
import { useState } from "react";
import { useCreateTeam, useDeleteTeam, useTeams, useUpdateTeam } from "../hooks/useRequests";
import type { Team } from "../types";

const { Title } = Typography;

export default function TeamManage() {
  const { data: teams, isLoading } = useTeams();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditingTeam(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEdit = (team: Team) => {
    setEditingTeam(team);
    form.setFieldsValue(team);
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (editingTeam) {
        updateTeam.mutate(
          { id: editingTeam.id, ...values },
          {
            onSuccess: () => {
              message.success("團隊已更新");
              setIsModalOpen(false);
            },
          }
        );
      } else {
        createTeam.mutate(values, {
          onSuccess: () => {
            message.success("團隊已建立");
            setIsModalOpen(false);
          },
        });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteTeam.mutate(id, {
      onSuccess: () => message.success("團隊已刪除"),
      onError: (err: any) => message.error(err?.response?.data?.detail || "刪除失敗"),
    });
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "名稱", dataIndex: "name" },
    { title: "說明", dataIndex: "description" },
  ];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Title level={3} style={{ margin: 0 }}>
          團隊管理
        </Title>
        <Button type="primary" onClick={openCreate}>
          新增團隊
        </Button>
      </div>
      <Table
        dataSource={teams}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        onRow={(record) => ({
          onClick: () => openEdit(record),
          style: { cursor: "pointer" },
        })}
      />
      <Modal
        title={editingTeam ? "編輯團隊" : "新增團隊"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={createTeam.isPending || updateTeam.isPending}
        footer={
          <div style={{ display: "flex", justifyContent: editingTeam ? "space-between" : "flex-end" }}>
            {editingTeam && (
              <Popconfirm title="確定要刪除此團隊？" onConfirm={() => { handleDelete(editingTeam.id); setIsModalOpen(false); }}>
                <Button danger>刪除團隊</Button>
              </Popconfirm>
            )}
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleSubmit} loading={createTeam.isPending || updateTeam.isPending}>
                確定
              </Button>
            </Space>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名稱" rules={[{ required: true, message: "請輸入名稱" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="說明">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
