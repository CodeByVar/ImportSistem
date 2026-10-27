import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '..', 'INVENTARIO VARIOS 26.xlsx');
const wb = XLSX.readFile(filePath, { cellFormula: true, cellStyles: true, sheetStubs: true });

console.log('Testing column mapping across all 27 sheets in VARIOS:');

for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');

  let headerRowIndex = 2;
  for (let r = 1; r <= Math.min(5, range.e.r + 1); r++) {
    let hasDetalle = false;
    let hasCodigo = false;
    for (let c = 0; c <= range.e.c; c++) {
      const colLetter = XLSX.utils.encode_col(c);
      const val = ws[colLetter + r] ? String(ws[colLetter + r].v || '').trim().toUpperCase() : '';
      if (val.includes('DETALLE') || val.includes('PRODUCTO') || val.includes('DESCRIPCION')) hasDetalle = true;
      if (val.includes('CODIGO') || val.includes('CÓDIGO') || val.includes('COD')) hasCodigo = true;
    }
    if (hasDetalle || hasCodigo) {
      headerRowIndex = r;
      break;
    }
  }

  const colMap = {};
  for (let c = 0; c <= range.e.c; c++) {
    const colLetter = XLSX.utils.encode_col(c);
    const r1 = ws[colLetter + '1'] ? String(ws[colLetter + '1'].v || '').trim().toUpperCase() : '';
    const rHeader = ws[colLetter + headerRowIndex] ? String(ws[colLetter + headerRowIndex].v || '').trim().toUpperCase() : '';

    if (!colMap.sku && (rHeader.includes('CODIGO') || rHeader.includes('CÓDIGO') || rHeader === 'COD')) colMap.sku = colLetter;
    if (!colMap.name && (rHeader.includes('DETALLE') || rHeader.includes('PRODUCTO') || rHeader.includes('DESCRIPCION'))) colMap.name = colLetter;
    if (!colMap.policy && (rHeader.includes('POLIZA') || rHeader.includes('PÓLIZA'))) colMap.policy = colLetter;
    if (!colMap.warehouse && rHeader.includes('BODEGA')) colMap.warehouse = colLetter;
    if (!colMap.boxes && (rHeader.includes('Q. DE CAJAS') || rHeader.includes('CAJAS'))) colMap.boxes = colLetter;
    if (!colMap.unitsPerBox && rHeader.includes('POR CAJA')) colMap.unitsPerBox = colLetter;
    if (!colMap.costFob && (rHeader === 'COSTO' || rHeader.includes('COSTO FOB') || rHeader.includes('FOB'))) colMap.costFob = colLetter;
    if (!colMap.priceMayor && (rHeader.includes('MAYOR') || (r1.includes('PRECIOS') && !colMap.priceMayor))) colMap.priceMayor = colLetter;
    if (!colMap.stockActual && (rHeader.includes('STOCK ACTUAL') || rHeader.includes('EXISTENCIA'))) colMap.stockActual = colLetter;
  }

  // Sample row
  const sampleRow = headerRowIndex + 1;
  const sampleSku = ws[colMap.sku + sampleRow]?.v;
  const sampleName = ws[colMap.name + sampleRow]?.v;
  const sampleStock = ws[colMap.stockActual + sampleRow]?.v;
  const sampleCost = ws[colMap.costFob + sampleRow]?.v;

  console.log(`Sheet "${sheetName}" (Header row ${headerRowIndex}): SKU=[${colMap.sku}], Name=[${colMap.name}], Stock=[${colMap.stockActual}], Cost=[${colMap.costFob}]`);
  console.log(`   Ejemplo fila ${sampleRow}: SKU=${sampleSku} | ${sampleName} | Stock=${sampleStock} | Cost=${sampleCost}`);
}
