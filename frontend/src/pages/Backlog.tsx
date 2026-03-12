import axios from "axios";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import dayjs from "dayjs";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import StageBadge from "../components/StageBadge";
import PriorityBadge from "../components/PriorityBadge";
import RiskBadge from "../components/RiskBadge";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../contexts/AuthContext";
import {
  useCreateKanbanCard,
  useRequests,
  useTeams,
  useUpdateRequest,
} from "../hooks/useRequests";
import { priorityOptions, riskOptions, statusOptions } from "../constants";
import type { Priority, Request, Risk, Status } from "../types";

type SortField = "id" | "title" | "requester" | "created_at" | "priority" | "status" | "risk" | "release_date";

function SortableHeader({
  field,
  label,
  currentSort,
  currentOrder,
  onSort,
}: {
  field: SortField;
  label: string;
  currentSort: string;
  currentOrder: string;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentSort === field;
  return (
    <button
      className="flex items-center gap-1 text-left font-medium"
      onClick={() => onSort(field)}
    >
      {label}
      {isActive ? (
        currentOrder === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
      ) : (
        <ArrowUpDown className="size-3 opacity-30" />
      )}
    </button>
  );
}

export default function Backlog() {
  const { isRD } = useAuth();

  const [filters, setFilters] = useState<Record<string, string | number>>({
    page: 1,
    page_size: 20,
    sort: "created_at",
    order: "desc",
    exclude_status: "archived",
  });
  const { data, isLoading } = useRequests(filters);
  const updateRequest = useUpdateRequest();
  const { data: teams } = useTeams();
  const createCard = useCreateKanbanCard();

  // Detail drawer state
  const [detailRequest, setDetailRequest] = useState<Request | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState("");

  // Drawer form state
  const [fTitle, setFTitle] = useState("");
  const [fDescription, setFDescription] = useState("");
  const [fBusinessImpact, setFBusinessImpact] = useState("");
  const [fRequester, setFRequester] = useState("");
  const [fPriority, setFPriority] = useState<Priority>("medium");
  const [fStatus, setFStatus] = useState<Status>("new");
  const [fRisk, setFRisk] = useState<Risk | "">("");
  const [fStartDate, setFStartDate] = useState("");
  const [fDueDate, setFDueDate] = useState("");
  const [fReleaseDate, setFReleaseDate] = useState("");

  const openDetail = (req: Request) => {
    setDetailRequest(req);
    setFTitle(req.title);
    setFDescription(req.description || "");
    setFBusinessImpact(req.business_impact || "");
    setFRequester(req.requester);
    setFPriority(req.priority);
    setFStatus(req.status);
    setFRisk(req.risk || "");
    setFStartDate(req.start_date ? dayjs(req.start_date).format("YYYY-MM-DD") : "");
    setFDueDate(req.due_date ? dayjs(req.due_date).format("YYYY-MM-DD") : "");
    setFReleaseDate(req.release_date ? dayjs(req.release_date).format("YYYY-MM-DD") : "");
    const matchedTeam = teams?.find((t) => t.name === req.assigned_team);
    setSelectedTeam(matchedTeam?.id ?? null);
  };

  const handleUpdate = () => {
    if (!detailRequest) return;
    const payload = {
      title: fTitle,
      description: fDescription,
      business_impact: fBusinessImpact,
      requester: fRequester,
      priority: fPriority,
      status: fStatus,
      risk: fRisk || null,
      start_date: fStartDate || null,
      due_date: fDueDate || null,
      release_date: fReleaseDate || null,
    };
    updateRequest.mutate(
      { id: detailRequest.id, ...payload },
      {
        onSuccess: () => {
          toast.success("需求已更新");
          setDetailRequest((prev) => (prev ? { ...prev, ...payload } : null));
        },
        onError: () => toast.error("更新失敗"),
      }
    );
  };

  const handleAssign = () => {
    if (!detailRequest || !selectedTeam) return;
    createCard.mutate(
      { request_id: detailRequest.id, team_id: selectedTeam },
      {
        onSuccess: () => {
          toast.success("已建立看板卡片");
          setSelectedTeam(null);
        },
        onError: (err) =>
          toast.error(axios.isAxiosError(err) ? err.response?.data?.detail : "建立卡片失敗"),
      }
    );
  };

  const handleSort = (field: SortField) => {
    setFilters((prev) => {
      const isSame = prev.sort === field;
      if (isSame && prev.order === "desc") {
        return { ...prev, page: 1, sort: "created_at", order: "desc" };
      }
      return { ...prev, page: 1, sort: field, order: isSame ? "desc" : "asc" };
    });
  };

  const updateFilter = (key: string, value: string | undefined) => {
    setFilters((prev) => {
      const next: Record<string, string | number> = { ...prev, page: 1 };
      if (value) {
        next[key] = value;
      } else {
        delete next[key];
      }
      if (key === "status") {
        if (value) {
          delete next.exclude_status;
        } else {
          next.exclude_status = "archived";
        }
      }
      return next;
    });
  };

  const handleSearch = () => {
    updateFilter("search", searchInput || undefined);
  };

  const sort = String(filters.sort || "created_at");
  const order = String(filters.order || "desc");
  const page = Number(filters.page || 1);
  const pageSize = Number(filters.page_size || 20);
  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  return (
    <>
      <h2 className="mb-2 text-xl font-semibold">需求池</h2>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-[240px]">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="搜尋標題..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Select
          value={filters.status ? String(filters.status) : undefined}
          onValueChange={(v) => updateFilter("status", v || undefined)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="狀態" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.priority ? String(filters.priority) : undefined}
          onValueChange={(v) => updateFilter("priority", v || undefined)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="優先級" />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]"><SortableHeader field="id" label="ID" currentSort={sort} currentOrder={order} onSort={handleSort} /></TableHead>
              <TableHead><SortableHeader field="title" label="標題" currentSort={sort} currentOrder={order} onSort={handleSort} /></TableHead>
              <TableHead className="w-[100px]"><SortableHeader field="requester" label="提出人" currentSort={sort} currentOrder={order} onSort={handleSort} /></TableHead>
              <TableHead className="w-[120px]"><SortableHeader field="created_at" label="建立日期" currentSort={sort} currentOrder={order} onSort={handleSort} /></TableHead>
              <TableHead className="w-[90px]"><SortableHeader field="priority" label="優先級" currentSort={sort} currentOrder={order} onSort={handleSort} /></TableHead>
              <TableHead className="w-[100px]"><SortableHeader field="status" label="狀態" currentSort={sort} currentOrder={order} onSort={handleSort} /></TableHead>
              <TableHead className="w-[80px]"><SortableHeader field="risk" label="風險" currentSort={sort} currentOrder={order} onSort={handleSort} /></TableHead>
              <TableHead className="w-[120px]">指派團隊</TableHead>
              <TableHead className="w-[100px]">開發狀態</TableHead>
              <TableHead className="w-[120px]"><SortableHeader field="release_date" label="上線日期" currentSort={sort} currentOrder={order} onSort={handleSort} /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">載入中...</TableCell></TableRow>
            ) : !data?.items.length ? (
              <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">無資料</TableCell></TableRow>
            ) : data.items.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => openDetail(r)}>
                <TableCell>{r.id}</TableCell>
                <TableCell className="max-w-[200px] truncate">{r.title}</TableCell>
                <TableCell>{r.requester}</TableCell>
                <TableCell>{dayjs(r.created_at).format("YYYY-MM-DD")}</TableCell>
                <TableCell><PriorityBadge priority={r.priority} /></TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell>{r.risk ? <RiskBadge risk={r.risk} /> : "-"}</TableCell>
                <TableCell>{r.assigned_team || "-"}</TableCell>
                <TableCell>{r.stage ? <StageBadge stage={r.stage} /> : "-"}</TableCell>
                <TableCell>{r.release_date ? dayjs(r.release_date).format("YYYY-MM-DD") : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            共 {data.total} 筆
          </span>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, page: 1, page_size: Number(v) }))}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} 筆</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: page - 1 }))}>
              上一頁
            </Button>
            <span className="text-sm">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setFilters((prev) => ({ ...prev, page: page + 1 }))}>
              下一頁
            </Button>
          </div>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!detailRequest} onOpenChange={(open) => { if (!open) { setDetailRequest(null); setSelectedTeam(null); } }}>
        <SheetContent className="w-[560px] overflow-y-auto sm:max-w-[560px]">
          <SheetHeader>
            <SheetTitle>
              {detailRequest ? `#${detailRequest.id} ${detailRequest.title}` : ""}
            </SheetTitle>
          </SheetHeader>

          {detailRequest && (
            <div className="mt-4 space-y-4">
              {isRD && (
                <div className="flex justify-end">
                  <Button onClick={handleUpdate} disabled={updateRequest.isPending}>
                    {updateRequest.isPending ? "更新中..." : "更新"}
                  </Button>
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>標題</Label>
                  <Input value={fTitle} onChange={(e) => setFTitle(e.target.value)} required />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>提出人</Label>
                  <Input value={fRequester} onChange={(e) => setFRequester(e.target.value)} required />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>優先級</Label>
                  <Select value={fPriority} onValueChange={(v) => v && setFPriority(v as Priority)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-2">
                  <Label>狀態</Label>
                  <Select value={fStatus} onValueChange={(v) => v && setFStatus(v as Status)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>風險</Label>
                  <Select value={fRisk} onValueChange={(v) => setFRisk((v || "") as Risk | "")}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="選擇風險等級" /></SelectTrigger>
                    <SelectContent>
                      {riskOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-2">
                  <Label>指派團隊</Label>
                  {isRD && (detailRequest.status === "new" || detailRequest.status === "assigned") ? (
                    <div className="flex gap-2">
                      <Select
                        value={selectedTeam ? String(selectedTeam) : undefined}
                        onValueChange={(v) => v && setSelectedTeam(Number(v))}
                      >
                        <SelectTrigger className="flex-1"><SelectValue placeholder="選擇團隊" /></SelectTrigger>
                        <SelectContent>
                          {teams?.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleAssign} disabled={!selectedTeam || createCard.isPending}>
                        指派
                      </Button>
                    </div>
                  ) : (
                    <p className="py-2 text-sm">{detailRequest.assigned_team || "-"}</p>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Label>開發狀態</Label>
                  <p className="py-2">{detailRequest.stage ? <StageBadge stage={detailRequest.stage} /> : "-"}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>開始日</Label>
                  <Input type="date" value={fStartDate} onChange={(e) => setFStartDate(e.target.value)} />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>截止日</Label>
                  <Input type="date" value={fDueDate} onChange={(e) => setFDueDate(e.target.value)} />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>上線日</Label>
                  <Input type="date" value={fReleaseDate} onChange={(e) => setFReleaseDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>描述</Label>
                <Textarea rows={2} value={fDescription} onChange={(e) => setFDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>業務影響</Label>
                <Textarea rows={2} value={fBusinessImpact} onChange={(e) => setFBusinessImpact(e.target.value)} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
