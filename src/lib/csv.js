export function exportToCSV(data, filename) {
  if (!data || !data.length) {
    alert("Tidak ada data untuk diexport");
    return;
  }
  
  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Convert data to CSV format
  const csvRows = [];
  csvRows.push(headers.join(',')); // Add headers
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] === null || row[header] === undefined ? "" : row[header];
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename || "export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target.result;
      if (!text) {
        return resolve([]);
      }
      
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length === 0) return resolve([]);
      
      // Basic CSV parser (does not handle commas inside quotes perfectly, but good enough for simple data)
      // For a robust app, papa parse is recommended.
      const parseLine = (line) => {
        const result = [];
        let inQuotes = false;
        let val = '';
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(val);
            val = '';
          } else {
            val += char;
          }
        }
        result.push(val);
        return result;
      };
      
      const headers = parseLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''));
      const data = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i]).map(v => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        for (let j = 0; j < headers.length; j++) {
          row[headers[j]] = values[j] || '';
        }
        data.push(row);
      }
      
      resolve(data);
    };
    
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsText(file);
  });
}
