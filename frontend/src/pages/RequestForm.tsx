import { Button, Card, Form, Input, message, Select, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { useCreateRequest } from "../hooks/useRequests";

const { Title } = Typography;
const { TextArea } = Input;

export default function RequestForm() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const createRequest = useCreateRequest();

  const onFinish = (values: Record<string, any>) => {
    createRequest.mutate(values, {
      onSuccess: () => {
        message.success("需求已提交");
        navigate("/backlog");
      },
      onError: () => message.error("提交失敗"),
    });
  };

  return (
    <Card style={{ maxWidth: 720, margin: "0 auto" }}>
      <Title level={3} style={{ marginTop: 0 }}>需求單</Title>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div style={{ display: "flex", gap: 16 }}>
          <Form.Item name="title" label="標題" rules={[{ required: true, message: "請輸入標題" }]} style={{ flex: 1 }}>
            <Input />
          </Form.Item>
          <Form.Item name="priority" label="優先級" initialValue="medium" style={{ width: 120 }}>
            <Select
              options={[
                { value: "critical", label: "緊急" },
                { value: "high", label: "高" },
                { value: "medium", label: "中" },
                { value: "low", label: "低" },
              ]}
            />
          </Form.Item>
        </div>
        <Form.Item name="requester" label="提出人" rules={[{ required: true, message: "請輸入提出人" }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <TextArea rows={3} />
        </Form.Item>
        <Form.Item name="business_impact" label="業務影響">
          <TextArea rows={3} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={createRequest.isPending}>
            提交
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
