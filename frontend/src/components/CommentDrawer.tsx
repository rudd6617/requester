import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import CommentSection from "./CommentSection";

interface Props {
  requestId: number | null;
  requestTitle: string;
  onClose: () => void;
}

export default function CommentDrawer({ requestId, requestTitle, onClose }: Props) {
  return (
    <Sheet open={!!requestId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[480px] overflow-y-auto sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>評論 — {requestTitle}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          {requestId && <CommentSection requestId={requestId} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
