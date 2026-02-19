"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { importLeadsFromExcelAction } from "@/app/dashboard/leads/actions";
import { Upload } from "lucide-react";

export function ImportLeadsButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  async function handleImport() {
    setLoading(true);
    setMessage(null);
    try {
      const result = await importLeadsFromExcelAction();
      if (result.success) {
        const breakdown = result.bySheet && Object.keys(result.bySheet).length > 0
          ? " (US New Leads: " + (result.bySheet["US New Leads"] ?? 0) + ")"
          : "";
        setMessage({ type: "success", text: `Imported ${result.count} leads${breakdown}.` });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Import failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={handleImport} disabled={loading}>
        <Upload className="mr-2 h-4 w-4" />
        {loading ? "Importing..." : "Import from Excel"}
      </Button>
      {message && (
        <p
          className={`text-sm ${
            message.type === "success" ? "text-emerald-600" : "text-destructive"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
