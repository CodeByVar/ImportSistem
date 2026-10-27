import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '..', 'INVENTARIO UYUS 26.xlsx');
console.log('📂 Analizando archivo:', filePath);

const workbook = XLSX.readFile(filePath, { cellFormula: true, cellStyles: true, sheetStubs: true });

console.log('\n📑 Hojas encontradas en el libro:', workbook.SheetNames);

for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  console.log(`\n========================================`);
  console.log(`📋 HOJA: "${sheetName}"`);
  console.log(`   Rango de celdas: ${sheet['!ref']}`);
  console.log(`   Total filas: ${range.e.r + 1}, Total columnas: ${range.e.c + 1}`);

  // Check hidden rows
  if (sheet['!rows']) {
    const hiddenRows = [];
    sheet['!rows'].forEach((r, idx) => {
      if (r && r.hidden) hiddenRows.push(idx + 1);
    });
    console.log(`   👁️ Filas ocultas (${hiddenRows.length}):`, hiddenRows.slice(0, 20), hiddenRows.length > 20 ? '...' : '');
  } else {
    console.log('   👁️ Filas ocultas: Ninguna propiedad !rows explícita');
  }

  // Check hidden cols
  if (sheet['!cols']) {
    const hiddenCols = [];
    sheet['!cols'].forEach((c, idx) => {
      if (c && c.hidden) hiddenCols.push(XLSX.utils.encode_col(idx));
    });
    console.log(`   👁️ Columnas ocultas (${hiddenCols.length}):`, hiddenCols);
  } else {
    console.log('   👁️ Columnas ocultas: Ninguna propiedad !cols explícita');
  }

  // Inspect first 15 rows
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
  console.log(`\n   --- Primeras 10 filas de contenido ---`);
  for (let r = 0; r < Math.min(rawData.length, 10); r++) {
    const row = rawData[r] || [];
    const nonEmpties = row.map((val, colIdx) => val ? `[Col ${XLSX.utils.encode_col(colIdx)}]: "${val}"` : null).filter(Boolean);
    console.log(`   Fila ${r + 1}: ${nonEmpties.slice(0, 10).join(' | ')}`);
  }

  // Find formulas in sheet
  const formulasFound = [];
  for (const cellAddress in sheet) {
    if (cellAddress.startsWith('!')) continue;
    const cell = sheet[cellAddress];
    if (cell && cell.f) {
      formulasFound.push({ cell: cellAddress, formula: cell.f, val: cell.v });
      if (formulasFound.length >= 30) break;
    }
  }

  console.log(`\n   --- Fórmulas detectadas (Muestra de ${formulasFound.length}) ---`);
  formulasFound.slice(0, 15).forEach(f => {
    console.log(`   ${f.cell}: =${f.formula}  --> Resultado: ${f.val}`);
  });
}
