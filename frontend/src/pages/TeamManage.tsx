import axios from "axios";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "../contexts/AuthContext";
import { useCreateTeam, useDeleteTeam, useTeams, useUpdateTeam, useUsers, useUpdateTeamMembers } from "../hooks/useRequests";
import type { Team } from "../types";

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
  const [membersModalTeam, setMembersModalTeam] = useState<Team | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const openCreate = () => {
    setEditingTeam(null);
    setFormName("");
    setFormDesc("");
    setIsModalOpen(true);
  };

  const openEdit = (team: Team) => {
    setEditingTeam(team);
    setFormName(team.name);
    setFormDesc(team.description || "");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    const values = { name: formName, description: formDesc };
    if (editingTeam) {
      updateTeam.mutate(
        { id: editingTeam.id, ...values },
        { onSuccess: () => { toast.success("團隊已更新"); setIsModalOpen(false); } },
      );
    } else {
      createTeam.mutate(values, {
        onSuccess: () => { toast.success("團隊已建立"); setIsModalOpen(false); },
      });
    }
  };

  const handleDelete = () => {
    if (!editingTeam) return;
    deleteTeam.mutate(editingTeam.id, {
      onSuccess: () => { toast.success("團隊已刪除"); setIsModalOpen(false); },
      onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.detail : "刪除失敗"),
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
    toast.success("成員已更新");
    setMembersModalTeam(null);
  };

  const toggleUserId = (id: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-semibold">團隊管理</h2>
        {isAdmin && <Button onClick={openCreate}>新增團隊</Button>}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">ID</TableHead>
            <TableHead>名稱</TableHead>
            <TableHead>說明</TableHead>
            {isAdmin && <TableHead>成員</TableHead>}
            {isAdmin && <TableHead className="w-[100px]">操作</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={isAdmin ? 5 : 3} className="text-center text-muted-foreground">載入中...</TableCell></TableRow>
          ) : teams?.map((team) => (
            <TableRow
              key={team.id}
              className={isAdmin ? "cursor-pointer" : ""}
              onClick={() => isAdmin && openEdit(team)}
            >
              <TableCell>{team.id}</TableCell>
              <TableCell>{team.name}</TableCell>
              <TableCell>{team.description}</TableCell>
              {isAdmin && (
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {users?.filter((u) => u.team_ids.includes(team.id)).map((u) => (
                      <Badge key={u.id} variant="outline">{u.display_name}</Badge>
                    ))}
                  </div>
                </TableCell>
              )}
              {isAdmin && (
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); openMembersModal(team); }}
                  >
                    成員管理
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit/Create Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTeam ? "編輯團隊" : "新增團隊"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">名稱</Label>
              <Input id="team-name" value={formName} onChange={(e) => setFormName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-desc">說明</Label>
              <Input id="team-desc" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
            </div>
            <DialogFooter className={editingTeam ? "justify-between" : ""}>
              {editingTeam && (
                <AlertDialog>
                  <AlertDialogTrigger>
                    <Button type="button" variant="destructive">刪除團隊</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>確定要刪除此團隊？</AlertDialogTitle>
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
                <Button type="submit" disabled={createTeam.isPending || updateTeam.isPending}>
                  確定
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={!!membersModalTeam} onOpenChange={(open) => !open && setMembersModalTeam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{membersModalTeam?.name} - 成員管理</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {users?.map((u) => (
              <label key={u.id} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedUserIds.includes(u.id)}
                  onCheckedChange={() => toggleUserId(u.id)}
                />
                {u.display_name} ({u.username})
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMembersModalTeam(null)}>取消</Button>
            <Button onClick={handleSaveMembers} disabled={updateTeamMembers.isPending}>
              {updateTeamMembers.isPending ? "儲存中..." : "確定"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
