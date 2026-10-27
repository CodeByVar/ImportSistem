import XLSX from 'xlsx';

const wb = XLSX.readFile('INVENTARIO UYUS 26.xlsx', { cellFormula: true, cellStyles: true, sheetStubs: true });
const ws = wb.Sheets['UYUS MANUAL'];
const range = XLSX.utils.decode_range(ws['!ref']);

console.log('=== DETALLE COMPLETO DE TODAS LAS COLUMNAS EN "UYUS MANUAL" ===');
for (let c = 0; c <= range.e.c; c++) {
  const colLetter = XLSX.utils.encode_col(c);
  const cellR1 = ws[colLetter + '1'] ? ws[colLetter + '1'].v : '';
  const cellR2 = ws[colLetter + '2'] ? ws[colLetter + '2'].v : '';
  const cellR3 = ws[colLetter + '3'];
  const val3 = cellR3 ? cellR3.v : '';
  const formula3 = cellR3 && cellR3.f ? ` [FORMULA: =${cellR3.f}]` : '';
  console.log(`Col ${colLetter.padEnd(2)}: Header1="${cellR1}" | Header2="${cellR2}" | Fila 3=${JSON.stringify(val3)}${formula3}`);
}
