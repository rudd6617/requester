import {
  ClipboardList,
  Columns3,
  LogIn,
  LogOut,
  SquarePen,
  UserCog,
  Users,
} from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "../contexts/AuthContext";

type NavItem = { key: string; icon: ReactNode; label: string };

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isRD, isAdmin, user, login, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const menuItems = useMemo(() => {
    const items: NavItem[] = [
      { key: "/requests/new", icon: <SquarePen className="size-4" />, label: "新需求" },
      { key: "/request-pool", icon: <ClipboardList className="size-4" />, label: "需求池" },
    ];
    if (isRD) {
      items.push(
        { key: "/kanban", icon: <Columns3 className="size-4" />, label: "開發看板" },
        { key: "/teams", icon: <Users className="size-4" />, label: "團隊管理" },
      );
    }
    if (isAdmin) {
      items.push(
        { key: "/users", icon: <UserCog className="size-4" />, label: "帳號管理" },
      );
    }
    return items;
  }, [isRD, isAdmin]);

  const selectedKey = location.pathname.startsWith("/kanban")
    ? "/kanban"
    : location.pathname;

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const username = fd.get("username") as string;
    const password = fd.get("password") as string;
    if (!username || !password) return;
    setLoginLoading(true);
    try {
      await login(username, password);
      toast.success("登入成功");
      setLoginOpen(false);
    } catch {
      toast.error("帳號或密碼錯誤");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-52 shrink-0 flex-col bg-slate-900 text-white">
        <div className="flex h-12 items-center justify-center text-base font-bold">
          Requester
        </div>
        <nav className="flex-1 space-y-1 px-2">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                selectedKey === item.key
                  ? "bg-white/15 text-white"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="flex flex-col items-center gap-1 p-4">
          {isRD ? (
            <>
              <span className="text-xs text-white/65">{user?.display_name}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1 text-xs text-white/65 hover:text-white"
              >
                <LogOut className="size-3" />
                登出
              </button>
            </>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="flex items-center gap-1 text-xs text-white/65 hover:text-white"
            >
              <LogIn className="size-3" />
              登入
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>

      {/* Login dialog */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="max-w-[360px]">
          <DialogHeader>
            <DialogTitle>登入</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">帳號</Label>
              <Input id="username" name="username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loginLoading}>
              {loginLoading ? "登入中..." : "登入"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
