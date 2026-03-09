import {
  AppstoreOutlined,
  FormOutlined,
  LoginOutlined,
  LogoutOutlined,
  ProjectOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Form, Input, Layout as AntLayout, Menu, message, Modal, Typography } from "antd";
import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const { Sider, Content } = AntLayout;
const { Text } = Typography;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isRD, user, login, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginForm] = Form.useForm();
  const [loginLoading, setLoginLoading] = useState(false);

  const menuItems = useMemo(() => {
    const items = [
      { key: "/requests/new", icon: <FormOutlined />, label: "新需求" },
      { key: "/backlog", icon: <AppstoreOutlined />, label: "需求池" },
    ];
    if (isRD) {
      items.push(
        { key: "/kanban", icon: <ProjectOutlined />, label: "開發看板" },
        { key: "/teams", icon: <TeamOutlined />, label: "團隊管理" },
      );
    }
    return items;
  }, [isRD]);

  const selectedKey = location.pathname.startsWith("/kanban")
    ? "/kanban"
    : location.pathname;

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoginLoading(true);
    try {
      await login(values.username, values.password);
      message.success("登入成功");
      setLoginOpen(false);
      loginForm.resetFields();
    } catch {
      message.error("帳號或密碼錯誤");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sider breakpoint="lg" collapsedWidth={60}>
        <div
          style={{
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          Requester
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
        <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {isRD ? (
            <>
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginBottom: 4 }}>
                {user?.display_name}
              </Text>
              <Button
                type="text"
                size="small"
                icon={<LogoutOutlined />}
                style={{ color: "rgba(255,255,255,0.65)" }}
                onClick={logout}
              >
                登出
              </Button>
            </>
          ) : (
            <Button
              type="text"
              size="small"
              icon={<LoginOutlined />}
              style={{ color: "rgba(255,255,255,0.65)" }}
              onClick={() => setLoginOpen(true)}
            >
              登入
            </Button>
          )}
        </div>
      </Sider>
      <AntLayout>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </AntLayout>

      <Modal
        title="登入"
        open={loginOpen}
        onCancel={() => setLoginOpen(false)}
        footer={null}
        width={360}
      >
        <Form form={loginForm} layout="vertical" onFinish={handleLogin}>
          <Form.Item name="username" label="帳號" rules={[{ required: true, message: "請輸入帳號" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密碼" rules={[{ required: true, message: "請輸入密碼" }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loginLoading} block>
              登入
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </AntLayout>
  );
}
