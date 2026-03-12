import { Button, Form, Input, message, Modal, Table, Tag, Typography } from "antd";
import { useState } from "react";
import { useRegisterUser, useTeams, useUsers } from "../hooks/useRequests";
import type { User } from "../types";

const { Title } = Typography;

export default function UserManage() {
  const { data: users, isLoading } = useUsers();
  const { data: teams } = useTeams();
  const registerUser = useRegisterUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const teamNameMap = new Map(teams?.map((t) => [t.id, t.name]) || []);

  const handleCreate = () => {
    form.validateFields().then((values) => {
      registerUser.mutate(values, {
        onSuccess: () => {
          message.success("帳號已建立");
          setIsModalOpen(false);
          form.resetFields();
        },
        onError: (err: any) => message.error(err?.response?.data?.detail || "建立失敗"),
      });
    });
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "帳號", dataIndex: "username" },
    { title: "顯示名稱", dataIndex: "display_name" },
    {
      title: "角色",
      key: "role",
      width: 80,
      render: (_: unknown, record: User) => record.is_admin ? <Tag color="red">Admin</Tag> : <Tag>RD</Tag>,
    },
    {
      title: "歸屬團隊",
      key: "teams",
      render: (_: unknown, record: User) => (
        <>
          {record.team_ids.map((id) => (
            <Tag key={id}>{teamNameMap.get(id) ?? id}</Tag>
          ))}
        </>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Title level={3} style={{ margin: 0 }}>
          帳號管理
        </Title>
        <Button type="primary" onClick={() => { form.resetFields(); setIsModalOpen(true); }}>
          新增帳號
        </Button>
      </div>
      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
      />
      <Modal
        title="新增帳號"
        open={isModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={registerUser.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="帳號" rules={[{ required: true, message: "請輸入帳號" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="display_name" label="顯示名稱" rules={[{ required: true, message: "請輸入顯示名稱" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密碼" rules={[{ required: true, message: "請輸入密碼" }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
