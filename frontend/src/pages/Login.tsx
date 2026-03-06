import { Button, Card, Form, Input, message, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const { Title } = Typography;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success("登入成功");
      navigate("/backlog");
    } catch {
      message.error("帳號或密碼錯誤");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <Card style={{ width: 360 }}>
        <Title level={3} style={{ textAlign: "center" }}>
          RD 登入
        </Title>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="帳號" rules={[{ required: true, message: "請輸入帳號" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密碼" rules={[{ required: true, message: "請輸入密碼" }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登入
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
