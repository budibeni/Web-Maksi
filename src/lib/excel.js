import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useUIStore } from "@/store/ui.store";

export async function exportToExcel(data, filename) {
  if (!data || !data.length) {
    useUIStore.getState().showToast("Tidak ada data untuk diexport", "error");
    return;
  }
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data");

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Configure columns
  worksheet.columns = headers.map(header => ({
    header: header,
    key: header,
    width: 25 // Set default column width
  }));

  // Add rows data
  worksheet.addRows(data);

  // Style the header row (Background Color & Bold text)
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0F0F0' } // Light gray background
  };
  
  // Optionally, add borders to header
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Append timestamp to filename
  const now = new Date();
  const dateStr = now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') + "_" +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
    
  const baseName = (filename || "export").replace('.xlsx', '');
  const finalFilename = `${baseName}_${dateStr}.xlsx`;

  // Export to file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, finalFilename);
}

export function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        // Parse the workbook using SheetJS (faster and sync for parsing)
        const wb = XLSX.read(data, { type: "array" });
        
        // Get the first worksheet
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(ws);
        resolve(jsonData);
      } catch (err) {
        reject(new Error("Gagal membaca file Excel"));
      }
    };
    
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsArrayBuffer(file);
  });
}
