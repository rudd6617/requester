import { Button, Drawer, Form, Input, List, message, Typography } from "antd";
import dayjs from "dayjs";
import { useAuth } from "../contexts/AuthContext";
import { useComments, useCreateComment } from "../hooks/useRequests";

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
  requestId: number | null;
  requestTitle: string;
  onClose: () => void;
}

export default function CommentDrawer({ requestId, requestTitle, onClose }: Props) {
  const { isRD, user } = useAuth();
  const { data: comments, isLoading } = useComments(requestId);
  const createComment = useCreateComment();
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (!requestId) return;
      createComment.mutate(
        {
          request_id: requestId,
          content: values.content,
          author: isRD ? undefined : values.author,
        },
        {
          onSuccess: () => {
            form.resetFields();
            message.success("評論已送出");
          },
          onError: () => message.error("送出失敗"),
        }
      );
    });
  };

  return (
    <Drawer
      title={`評論 — ${requestTitle}`}
      open={!!requestId}
      onClose={onClose}
      width={480}
    >
      <List
        loading={isLoading}
        dataSource={comments || []}
        locale={{ emptyText: "尚無評論" }}
        renderItem={(item) => (
          <List.Item>
            <div style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text strong>{item.author}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {dayjs(item.created_at).format("YYYY-MM-DD HH:mm")}
                </Text>
              </div>
              <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{item.content}</div>
            </div>
          </List.Item>
        )}
      />
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        {!isRD && (
          <Form.Item name="author" label="姓名" rules={[{ required: true, message: "請輸入姓名" }]}>
            <Input placeholder="你的名字" />
          </Form.Item>
        )}
        {isRD && (
          <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
            以 {user?.display_name} 身分發言
          </Text>
        )}
        <Form.Item name="content" rules={[{ required: true, message: "請輸入內容" }]}>
          <TextArea rows={3} placeholder="輸入評論..." />
        </Form.Item>
        <Button type="primary" onClick={handleSubmit} loading={createComment.isPending}>
          送出評論
        </Button>
      </Form>
    </Drawer>
  );
}
