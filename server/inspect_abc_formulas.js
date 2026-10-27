import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '..', 'ABC HOJA PRUEBA IR 26.xlsx');
const wb = XLSX.readFile(filePath, { cellFormula: true, cellStyles: true, sheetStubs: true });

for (const name of wb.SheetNames) {
  const sheet = wb.Sheets[name];
  console.log(`\n=================== FORMULAS IN [${name}] ===================`);
  for (const cellAddress in sheet) {
    if (cellAddress.startsWith('!')) continue;
    const cell = sheet[cellAddress];
    if (cell.f) {
      console.log(`  ${cellAddress}: =${cell.f} (value: ${cell.v})`);
    }
  }
}
