import axios from "axios";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRegisterUser, useTeams, useUsers } from "../hooks/useRequests";

export default function UserManage() {
  const { data: users, isLoading } = useUsers();
  const { data: teams } = useTeams();
  const registerUser = useRegisterUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const teamNameMap = useMemo(() => new Map(teams?.map((t) => [t.id, t.name]) || []), [teams]);

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values = {
      username: fd.get("username") as string,
      display_name: fd.get("display_name") as string,
      password: fd.get("password") as string,
    };
    registerUser.mutate(values, {
      onSuccess: () => {
        toast.success("帳號已建立");
        setIsModalOpen(false);
      },
      onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.detail : "建立失敗"),
    });
  };

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-semibold">帳號管理</h2>
        <Button onClick={() => setIsModalOpen(true)}>新增帳號</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">ID</TableHead>
            <TableHead>帳號</TableHead>
            <TableHead>顯示名稱</TableHead>
            <TableHead className="w-[80px]">角色</TableHead>
            <TableHead>歸屬團隊</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">載入中...</TableCell></TableRow>
          ) : users?.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.id}</TableCell>
              <TableCell>{u.username}</TableCell>
              <TableCell>{u.display_name}</TableCell>
              <TableCell>
                {u.is_admin
                  ? <Badge className="bg-red-100 text-red-700">Admin</Badge>
                  : <Badge className="bg-gray-100 text-gray-600">RD</Badge>}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {u.team_ids.map((id) => (
                    <Badge key={id} variant="outline">{teamNameMap.get(id) ?? id}</Badge>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增帳號</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">帳號</Label>
              <Input id="username" name="username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">顯示名稱</Label>
              <Input id="display_name" name="display_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={registerUser.isPending}>
                {registerUser.isPending ? "建立中..." : "確定"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
