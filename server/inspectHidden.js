import XLSX from 'xlsx';

const wb = XLSX.readFile('INVENTARIO UYUS 26.xlsx', { cellStyles: true, sheetStubs: true });

for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const hiddenRows = [];
  if (ws['!rows']) {
    ws['!rows'].forEach((r, idx) => {
      if (r && r.hidden) hiddenRows.push(idx + 1);
    });
  }
  const hiddenCols = [];
  if (ws['!cols']) {
    ws['!cols'].forEach((c, idx) => {
      if (c && c.hidden) hiddenCols.push({ colIndex: idx, colLetter: XLSX.utils.encode_col(idx) });
    });
  }
  console.log(`\n========================================`);
  console.log(`HOJA: "${name}"`);
  console.log(`  Filas Ocultas (${hiddenRows.length}):`, hiddenRows.length > 0 ? hiddenRows.slice(0, 20) : 'Ninguna');
  if (hiddenRows.length > 20) console.log(`  ...y ${hiddenRows.length - 20} filas más.`);
  
  console.log(`  Columnas Ocultas (${hiddenCols.length}):`, hiddenCols.map(c => c.colLetter).join(', ') || 'Ninguna');
  
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const row1 = rows[0] || [];
  const row2 = rows[1] || [];
  
  if (hiddenCols.length > 0) {
    console.log('  Contenido de Columnas Ocultas:');
    hiddenCols.forEach(c => {
      console.log(`    Columna [${c.colLetter}] -> Fila 1: "${row1[c.colIndex] || ''}" | Fila 2: "${row2[c.colIndex] || ''}"`);
    });
  }

  // Also check sample content of row 3 for those hidden cols
  if (rows.length > 2 && hiddenCols.length > 0) {
    const row3 = rows[2] || [];
    console.log('  Ejemplo de datos Fila 3 en columnas ocultas:');
    hiddenCols.forEach(c => {
      console.log(`    Columna [${c.colLetter}] -> Fila 3: "${row3[c.colIndex] || ''}"`);
    });
  }
}
