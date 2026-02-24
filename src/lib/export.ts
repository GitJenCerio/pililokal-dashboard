import * as XLSX from "xlsx";

export type MerchantExportRow = {
  name: string;
  category: string;
  status: string;
  contact: string;
  email: string;
  phone: string;
  completionPercent: number;
  lastUpdated: string;
};

export function exportMerchantsToExcel(merchants: MerchantExportRow[]): Buffer {
  const ws = XLSX.utils.json_to_sheet(
    merchants.map((m) => ({
      Name: m.name,
      Category: m.category,
      Status: m.status,
      Contact: m.contact,
      Email: m.email,
      Phone: m.phone,
      "Completion %": m.completionPercent,
      "Last Updated": m.lastUpdated,
    }))
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Merchants");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
}
