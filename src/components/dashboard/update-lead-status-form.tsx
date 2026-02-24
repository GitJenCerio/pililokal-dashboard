"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateLeadShopifyStatusAction } from "@/app/dashboard/leads/actions";
import type { ShopifyStatus } from "@/lib/types";

const statusLabel: Record<ShopifyStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  UPLOADED: "Uploaded",
  LIVE: "Live",
};

export function UpdateLeadStatusForm({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const status = currentStatus || "NOT_STARTED";
  const [optimisticStatus, setOptimisticStatus] = useState(status);

  useEffect(() => {
    setOptimisticStatus(status);
  }, [status]);

  async function handleChange(value: string) {
    setOptimisticStatus(value);
    const result = await updateLeadShopifyStatusAction(leadId, value);
    if (result.success) router.refresh();
    else setOptimisticStatus(status);
  }

  return (
    <Select value={optimisticStatus} onValueChange={handleChange}>
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
