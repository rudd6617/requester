import axios from "axios";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeleteUser, useRegisterUser, useTeams, useUpdateUser, useUsers } from "../hooks/useRequests";
import type { User } from "../types";

export default function UserManage() {
  const { data: users, isLoading } = useUsers();
  const { data: teams } = useTeams();
  const registerUser = useRegisterUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formIsAdmin, setFormIsAdmin] = useState(false);

  const teamNameMap = useMemo(() => new Map(teams?.map((t) => [t.id, t.name]) || []), [teams]);

  const openCreate = () => {
    setEditingUser(null);
    setFormUsername("");
    setFormDisplayName("");
    setFormPassword("");
    setFormIsAdmin(false);
    setIsModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormDisplayName(user.display_name);
    setFormPassword("");
    setFormIsAdmin(user.is_admin);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const data: { id: number; display_name?: string; password?: string; is_admin?: boolean } = {
        id: editingUser.id,
        display_name: formDisplayName,
        is_admin: formIsAdmin,
      };
      if (formPassword) data.password = formPassword;
      updateUser.mutate(data, {
        onSuccess: () => { toast.success("帳號已更新"); setIsModalOpen(false); },
        onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.detail : "更新失敗"),
      });
    } else {
      registerUser.mutate(
        { username: formUsername, display_name: formDisplayName, password: formPassword },
        {
          onSuccess: () => { toast.success("帳號已建立"); setIsModalOpen(false); },
          onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.detail : "建立失敗"),
        },
      );
    }
  };

  const handleDelete = () => {
    if (!editingUser) return;
    deleteUser.mutate(editingUser.id, {
      onSuccess: () => { toast.success("帳號已刪除"); setIsModalOpen(false); },
      onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.detail : "刪除失敗"),
    });
  };

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-semibold">帳號管理</h2>
        <Button onClick={openCreate}>新增帳號</Button>
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
            <TableRow key={u.id} className="cursor-pointer" onClick={() => openEdit(u)}>
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
            <DialogTitle>{editingUser ? "編輯帳號" : "新增帳號"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">帳號</Label>
              {editingUser ? (
                <Input id="username" value={formUsername} disabled />
              ) : (
                <Input id="username" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} required />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">顯示名稱</Label>
              <Input id="display_name" value={formDisplayName} onChange={(e) => setFormDisplayName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{editingUser ? "密碼（留空不修改）" : "密碼"}</Label>
              <Input
                id="password"
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                required={!editingUser}
              />
            </div>
            {editingUser && (
              <div className="flex items-center gap-2">
                <Switch id="is_admin" checked={formIsAdmin} onCheckedChange={setFormIsAdmin} />
                <Label htmlFor="is_admin">管理員</Label>
              </div>
            )}
            <DialogFooter className={editingUser ? "sm:justify-between" : ""}>
              {editingUser && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive">刪除帳號</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>確定要刪除此帳號？</AlertDialogTitle>
                      <AlertDialogDescription>此操作無法復原。</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>確定刪除</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>取消</Button>
                <Button type="submit" disabled={registerUser.isPending || updateUser.isPending}>
                  確定
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
