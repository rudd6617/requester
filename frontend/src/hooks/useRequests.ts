import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/client";
import type { KanbanBoard, Request, Stage } from "../types";

// --- Teams ---

export function useTeams() {
  return useQuery({ queryKey: ["teams"], queryFn: api.fetchTeams });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createTeam,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; name?: string; description?: string }) =>
      api.updateTeam(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteTeam,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

// --- Requests ---

export function useRequests(params: Record<string, string | number>) {
  return useQuery({
    queryKey: ["requests", params],
    queryFn: () => api.fetchRequests(params),
  });
}

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }),
  });
}

export function useUpdateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Request>) =>
      api.updateRequest(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["kanban"] });
    },
  });
}

// --- Kanban ---

export function useKanbanCards(teamId: number | null) {
  return useQuery({
    queryKey: ["kanban", teamId],
    queryFn: () => api.fetchKanbanCards(teamId!),
    enabled: !!teamId,
  });
}

export function useCreateKanbanCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createKanbanCard,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kanban"] });
      qc.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

export function useUpdateKanbanCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; assignee?: string; stage?: string }) =>
      api.updateKanbanCard(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kanban"] }),
  });
}

export function useMoveKanbanCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      stage,
      position,
    }: {
      id: number;
      stage: Stage;
      position: number;
    }) => api.moveKanbanCard(id, { stage, position }),
    onMutate: async ({ id, stage, position }) => {
      await qc.cancelQueries({ queryKey: ["kanban"] });
      const queries = qc.getQueriesData<KanbanBoard>({ queryKey: ["kanban"] });
      for (const [key, data] of queries) {
        if (!data) continue;
        const newBoard = { ...data };
        let movedCard = null;
        for (const s of ["todo", "in_progress", "review", "done"] as Stage[]) {
          const idx = newBoard[s].findIndex((c) => c.id === id);
          if (idx !== -1) {
            movedCard = { ...newBoard[s][idx] };
            newBoard[s] = newBoard[s].filter((c) => c.id !== id);
            break;
          }
        }
        if (movedCard) {
          movedCard.stage = stage;
          movedCard.position = position;
          newBoard[stage] = [...newBoard[stage], movedCard].sort(
            (a, b) => a.position - b.position
          );
          qc.setQueryData(key, newBoard);
        }
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["kanban"] }),
  });
}
