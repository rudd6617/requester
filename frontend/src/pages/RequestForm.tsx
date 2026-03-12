import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { priorityOptions } from "../constants";
import { useCreateRequest } from "../hooks/useRequests";
import type { Priority } from "../types";

export default function RequestForm() {
  const navigate = useNavigate();
  const createRequest = useCreateRequest();
  const [priority, setPriority] = useState<Priority>("medium");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values = {
      title: fd.get("title") as string,
      requester: fd.get("requester") as string,
      description: fd.get("description") as string,
      business_impact: fd.get("business_impact") as string,
      priority,
    };
    createRequest.mutate(values, {
      onSuccess: () => {
        toast.success("需求已提交");
        navigate("/request-pool");
      },
      onError: () => toast.error("提交失敗"),
    });
  };

  return (
    <Card className="mx-auto max-w-[720px]">
      <CardContent className="p-6">
        <h2 className="mt-0 mb-4 text-xl font-semibold">需求單</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="title">標題</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="w-[120px] space-y-2">
              <Label>優先級</Label>
              <Select value={priority} onValueChange={(v) => v && setPriority(v as Priority)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="requester">提出人</Label>
            <Input id="requester" name="requester" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business_impact">業務影響</Label>
            <Textarea id="business_impact" name="business_impact" rows={3} />
          </div>
          <Button type="submit" disabled={createRequest.isPending}>
            {createRequest.isPending ? "提交中..." : "提交"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
