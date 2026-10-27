import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '..', 'ABC HOJA PRUEBA IR 26.xlsx');
console.log('Loading workbook:', filePath);

const wb = XLSX.readFile(filePath, { cellFormula: true, cellStyles: true, sheetStubs: true });
console.log('Sheet count:', wb.SheetNames.length);
console.log('Sheet names:', wb.SheetNames);

for (const name of wb.SheetNames) {
  const sheet = wb.Sheets[name];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  console.log(`\n=================== SHEET: [${name}] (range: ${sheet['!ref']}, rows: ${range.e.r + 1}, cols: ${range.e.c + 1}) ===================`);
  
  // Show first 35 rows as array of arrays
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  for (let r = 0; r < Math.min(35, data.length); r++) {
    const row = data[r];
    // only log non-empty rows
    if (row && row.some(cell => cell !== '')) {
      const formatted = row.slice(0, 15).map(c => typeof c === 'string' ? c.trim() : c);
      console.log(`R${r + 1}:`, JSON.stringify(formatted));
    }
  }
}
