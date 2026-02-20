/**
 * Run: node scripts/check-excel-headers.js
 * Dumps column headers from each sheet in Pililokal_Merchants_Cleaned.xlsx
 * Use this to verify Result column name for US New Leads
 */
const fs = require("fs");
const path = require("path");

const excelPath = path.join(__dirname, "..", "Pililokal_Merchants_Cleaned.xlsx");
if (!fs.existsSync(excelPath)) {
  console.log("Excel file not found at:", excelPath);
  process.exit(1);
}

const XLSX = require("xlsx");
const wb = XLSX.read(fs.readFileSync(excelPath), { type: "buffer" });

for (const sheetName of wb.SheetNames) {
  const sheet = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const headers = data[0] || [];
  const resultCol = headers.findIndex((h) =>
    String(h || "").toLowerCase().includes("result")
  );
  console.log(`\n${sheetName}:`);
  console.log("  Headers:", JSON.stringify(headers));
  if (resultCol >= 0) {
    console.log("  Result-like column index:", resultCol, "→", JSON.stringify(headers[resultCol]));
  }
}
