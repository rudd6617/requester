import { type FormEvent, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import dayjs from "dayjs";
import { useAuth } from "../contexts/AuthContext";
import { useComments, useCreateComment } from "../hooks/useRequests";

export default function CommentSection({ requestId }: { requestId: number }) {
  const { isRD, user } = useAuth();
  const { data: comments, isLoading } = useComments(requestId);
  const createComment = useCreateComment();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createComment.mutate(
      {
        request_id: requestId,
        content: fd.get("content") as string,
        author: isRD ? undefined : (fd.get("author") as string),
      },
      {
        onSuccess: () => {
          formRef.current?.reset();
          toast.success("評論已送出");
        },
        onError: () => toast.error("送出失敗"),
      },
    );
  };

  return (
    <>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">載入中...</p>
      ) : !comments?.length ? (
        <p className="text-sm text-muted-foreground">尚無評論</p>
      ) : (
        <div className="divide-y">
          {comments.map((item) => (
            <div key={item.id} className="py-3">
              <div className="flex justify-between">
                <span className="font-semibold">{item.author}</span>
                <span className="text-xs text-muted-foreground">
                  {dayjs(item.created_at).format("YYYY-MM-DD HH:mm")}
                </span>
              </div>
              <div className="mt-1 whitespace-pre-wrap">{item.content}</div>
            </div>
          ))}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="mt-4 space-y-3">
        {!isRD && (
          <div className="space-y-2">
            <Label htmlFor="author">姓名</Label>
            <Input id="author" name="author" placeholder="你的名字" required />
          </div>
        )}
        {isRD && (
          <p className="text-sm text-muted-foreground">
            以 {user?.display_name} 身分發言
          </p>
        )}
        <Textarea name="content" rows={3} placeholder="輸入評論..." required />
        <Button type="submit" disabled={createComment.isPending}>
          {createComment.isPending ? "送出中..." : "送出評論"}
        </Button>
      </form>
    </>
  );
}
