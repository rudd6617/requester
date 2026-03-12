import { Button, Checkbox, Form, Input, message, Modal, Popconfirm, Space, Table, Tag, Typography } from "antd";
import { useState } from "react";
import { useCreateTeam, useDeleteTeam, useTeams, useUpdateTeam, useUsers, useUpdateTeamMembers } from "../hooks/useRequests";
import { useAuth } from "../contexts/AuthContext";
import type { Team } from "../types";

const { Title } = Typography;

export default function TeamManage() {
  const { isAdmin } = useAuth();
  const { data: teams, isLoading } = useTeams();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const { data: users } = useUsers(isAdmin);
  const updateTeamMembers = useUpdateTeamMembers();
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [membersModalTeam, setMembersModalTeam] = useState<Team | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

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
      onSuccess: () => {
        message.success("團隊已刪除");
        setIsModalOpen(false);
      },
      onError: (err: any) => message.error(err?.response?.data?.detail || "刪除失敗"),
    });
  };

  const openMembersModal = (team: Team) => {
    setMembersModalTeam(team);
    const memberIds = users?.filter((u) => u.team_ids.includes(team.id)).map((u) => u.id) || [];
    setSelectedUserIds(memberIds);
  };

  const handleSaveMembers = async () => {
    if (!membersModalTeam) return;
    await updateTeamMembers.mutateAsync({ teamId: membersModalTeam.id, userIds: selectedUserIds });
    message.success("成員已更新");
    setMembersModalTeam(null);
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "名稱", dataIndex: "name" },
    { title: "說明", dataIndex: "description" },
    ...(isAdmin
      ? [
          {
            title: "成員",
            key: "members",
            render: (_: unknown, record: Team) => {
              const memberNames = users?.filter((u) => u.team_ids.includes(record.id)).map((u) => u.display_name) || [];
              return (
                <Space size={[0, 4]} wrap>
                  {memberNames.map((name) => (
                    <Tag key={name}>{name}</Tag>
                  ))}
                </Space>
              );
            },
          },
          {
            title: "操作",
            key: "actions",
            width: 100,
            render: (_: unknown, record: Team) => (
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  openMembersModal(record);
                }}
              >
                成員管理
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Title level={3} style={{ margin: 0 }}>
          團隊管理
        </Title>
        {isAdmin && (
          <Button type="primary" onClick={openCreate}>
            新增團隊
          </Button>
        )}
      </div>
      <Table
        dataSource={teams}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        onRow={(record) =>
          isAdmin
            ? { onClick: () => openEdit(record), style: { cursor: "pointer" } }
            : {}
        }
      />

      {/* Edit/Create Modal */}
      <Modal
        title={editingTeam ? "編輯團隊" : "新增團隊"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={createTeam.isPending || updateTeam.isPending}
        footer={
          <div style={{ display: "flex", justifyContent: editingTeam ? "space-between" : "flex-end" }}>
            {editingTeam && (
              <Popconfirm title="確定要刪除此團隊？" onConfirm={() => handleDelete(editingTeam.id)}>
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

      {/* Members Modal */}
      <Modal
        title={`${membersModalTeam?.name} - 成員管理`}
        open={!!membersModalTeam}
        onOk={handleSaveMembers}
        onCancel={() => setMembersModalTeam(null)}
        confirmLoading={updateTeamMembers.isPending}
      >
        <Checkbox.Group
          value={selectedUserIds}
          onChange={(vals) => setSelectedUserIds(vals as number[])}
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          {users?.map((u) => (
            <Checkbox key={u.id} value={u.id}>
              {u.display_name} ({u.username})
            </Checkbox>
          ))}
        </Checkbox.Group>
      </Modal>
    </>
  );
}
