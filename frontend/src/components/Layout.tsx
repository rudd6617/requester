import {
  AppstoreOutlined,
  FormOutlined,
  ProjectOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Layout as AntLayout, Menu } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const { Sider, Content } = AntLayout;

const menuItems = [
  { key: "/requests/new", icon: <FormOutlined />, label: "提交需求" },
  { key: "/backlog", icon: <AppstoreOutlined />, label: "需求池" },
  { key: "/kanban", icon: <ProjectOutlined />, label: "開發看板" },
  { key: "/teams", icon: <TeamOutlined />, label: "團隊管理" },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = location.pathname.startsWith("/kanban")
    ? "/kanban"
    : location.pathname;

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
          SigKnow
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
