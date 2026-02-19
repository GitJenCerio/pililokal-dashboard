"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateStatusAction } from "@/app/dashboard/actions";
import type { ShopifyStatus } from "@/lib/types";

const statusLabel: Record<ShopifyStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  UPLOADED: "Uploaded",
  LIVE: "Live",
};

export function UpdateStatusForm({
  merchantId,
  currentStatus,
}: {
  merchantId: string;
  currentStatus: ShopifyStatus;
}) {
  const router = useRouter();

  async function handleChange(value: string) {
    await updateStatusAction(merchantId, value as ShopifyStatus);
    router.refresh();
  }

  return (
    <Select value={currentStatus} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-[130px] border-0 bg-transparent shadow-none hover:bg-muted/50">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(["NOT_STARTED", "IN_PROGRESS", "UPLOADED", "LIVE"] as const).map((s) => (
          <SelectItem key={s} value={s}>
            {statusLabel[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
