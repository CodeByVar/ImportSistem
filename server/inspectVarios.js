import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '..', 'INVENTARIO VARIOS 26.xlsx');
console.log('📂 Analizando archivo:', filePath);

const wb = XLSX.readFile(filePath, { cellFormula: true, cellStyles: true, sheetStubs: true });

console.log(`\n📑 Total Hojas encontradas en VARIOS (${wb.SheetNames.length}):\n`, wb.SheetNames.join(', '));

const sheetSummaries = [];

for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');

  // Hidden rows
  const hiddenRows = [];
  if (ws['!rows']) {
    ws['!rows'].forEach((r, idx) => {
      if (r && r.hidden) hiddenRows.push(idx + 1);
    });
  }

  // Hidden cols
  const hiddenCols = [];
  if (ws['!cols']) {
    ws['!cols'].forEach((c, idx) => {
      if (c && c.hidden) hiddenCols.push({ colIndex: idx, colLetter: XLSX.utils.encode_col(idx) });
    });
  }

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const row1 = rows[0] || [];
  const row2 = rows[1] || [];
  const row3 = rows[2] || [];

  // Check valid product rows (having either col 1 or col 2 non-empty starting after header)
  let headerIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const r = rows[i] ? rows[i].map(c => String(c || '').trim().toUpperCase()) : [];
    if (r.includes('CODIGO') || r.includes('CÓDIGO') || r.includes('DETALLE')) {
      headerIndex = i;
      break;
    }
  }

  let validCount = 0;
  if (headerIndex !== -1) {
    for (let i = headerIndex + 1; i < rows.length; i++) {
      const r = rows[i] || [];
      if (r[1] || r[2] || r[3]) validCount++;
    }
  }

  sheetSummaries.push({
    name,
    totalRows: range.e.r + 1,
    validProducts: validCount,
    headerRow: headerIndex + 1,
    hiddenRowsCount: hiddenRows.length,
    hiddenRows: hiddenRows.slice(0, 10),
    hiddenColsCount: hiddenCols.length,
    hiddenCols: hiddenCols.map(c => c.colLetter)
  });
}

console.log('\n=== RESUMEN POR HOJA (FILAS Y COLUMNAS OCULTAS) ===');
sheetSummaries.forEach(s => {
  console.log(`\nHoja: "${s.name}" | Productos válidos: ${s.validProducts} | Fila Encabezados: ${s.headerRow}`);
  console.log(`  - Filas Ocultas (${s.hiddenRowsCount}):`, s.hiddenRowsCount > 0 ? s.hiddenRows : 'Ninguna');
  console.log(`  - Columnas Ocultas (${s.hiddenColsCount}):`, s.hiddenColsCount > 0 ? s.hiddenCols.join(', ') : 'Ninguna');
});

const totalAllProducts = sheetSummaries.reduce((acc, s) => acc + s.validProducts, 0);
console.log(`\n========================================`);
console.log(`🎯 TOTAL PRODUCTOS ESTIMADOS EN INVENTARIO VARIOS: ${totalAllProducts}`);
console.log(`========================================\n`);
