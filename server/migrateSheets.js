import XLSX from 'xlsx';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initDatabase();

export function parseSpanishNumber(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let s = String(val).trim().replace(/[$€Bs\s]/g, '');
  if (s.includes('.') && s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export function inferCategory(name, sheetName = '') {
  const n = (name || '').toUpperCase();
  const s = (sheetName || '').toUpperCase();

  if (s.includes('ELECT') || n.includes('AMOLADORA') || n.includes('TALADRO') || n.includes('ROTOMARTILLO') || n.includes('SIERRA CIRCULAR') || n.includes('LIJADORA') || n.includes('DEMOLEDOR') || n.includes('TRONZADORA')) {
    return 'Herramientas Eléctricas';
  }
  if (s.includes('REP') || s.includes('ACC') || n.includes('CARBON') || n.includes('INDUCIDO') || n.includes('INTERRUPTOR') || n.includes('ENGRANAJE') || n.includes('RODAMIENTO')) {
    return 'Repuestos & Accesorios';
  }
  if (s.includes('AQUA') || n.includes('BOMBA') || n.includes('PRESURIZADOR') || n.includes('SUMERGIBLE') || n.includes('MOTOR')) {
    return 'Bombas & Maquinaria';
  }
  if (n.includes('ALICATE') || n.includes('DESTORNILLADOR') || n.includes('LLAVE') || n.includes('DADO') || n.includes('MARTILLO') || n.includes('BARRA') || n.includes('TORNILLO BANCO') || n.includes('TENAZA') || n.includes('PINZA') || n.includes('ARCO')) {
    return 'Herramientas Manuales';
  }
  if (n.includes('BOTA') || n.includes('ARNES') || n.includes('GUANTE') || n.includes('CASCO') || n.includes('LENTE') || n.includes('SEGURIDAD') || n.includes('FAJA')) {
    return 'Seguridad Industrial';
  }
  if (n.includes('COMPRESOR') || n.includes('BOMBIN') || n.includes('ACOPLE') || n.includes('MANGUERA') || n.includes('PISTOLA') || n.includes('VALVULA') || n.includes('ACEITERA')) {
    return 'Neumática & Aire';
  }
  if (n.includes('DISCO') || n.includes('BROCA') || n.includes('SIERRA') || n.includes('BITS') || n.includes('HOJA') || n.includes('COPA')) {
    return 'Corte & Abrasivos';
  }
  if (n.includes('BISAGRA') || n.includes('ALDABA') || n.includes('CANDADO') || n.includes('CERRADURA') || n.includes('AMARRA') || n.includes('TOPE')) {
    return 'Cerrajería & Fijaciones';
  }
  if (n.includes('NIVEL') || n.includes('FLEXOMETRO') || n.includes('HUINCHA') || n.includes('TORQUIMETRO') || n.includes('CALIBRADOR')) {
    return 'Medición & Precisión';
  }
  if (n.includes('ALARGADOR') || n.includes('TOMACORRIENTE') || n.includes('CABLE') || n.includes('VOLTI')) {
    return 'Electricidad & Conexión';
  }
  return 'Ferretería & Construcción';
}

export function inferBrand(sheetName) {
  const s = (sheetName || '').toUpperCase();
  if (s.includes('UYUS')) return 'UYUSTOOLS';
  if (s.includes('DC') || s.includes('DONGCHENG')) return 'DONGCHENG';
  if (s.includes('AQUA') || s.includes('WALTEK')) return 'AQUASTRONG & WALTEK';
  if (s.includes('WYYMET')) return 'WYYMET';
  if (s.includes('FERTON') || s.includes('FORTUN')) return 'FERTON';
  if (s.includes('KAMASA')) return 'KAMASA';
  if (s.includes('TOTAL')) return 'TOTAL TOOLS';
  if (s.includes('MAKAWA') || s.includes('NEVA')) return 'MAKAWA & NEVA';
  if (s.includes('TOYAKI') || s.includes('LUTIAN')) return 'TOYAKI & LUTIAN';
  if (s.includes('CROWN')) return 'CROWN';
  if (s.includes('SAIKER')) return 'SAIKERTOOLS';
  if (s.includes('WADFOW')) return 'WADFOW';
  if (s.includes('JHELUX')) return 'JHELUX';
  if (s.includes('STANFORD')) return 'STANFORD';
  if (s.includes('INTERSHANG')) return 'INTERSHANG';
  if (s.includes('LAER')) return 'LAER';
  if (s.includes('CARIOCA')) return 'CARIOCA';
  if (s.includes('HAPPY')) return 'HAPPY';
  if (s.includes('PEGASUS')) return 'PEGASUS';
  if (s.includes('MATIX')) return 'MATIX';
  if (s.includes('VELOX')) return 'VELOX';
  if (s.includes('CHALIMEX')) return 'CHALIMEX';
  if (s.includes('OFERTA')) return 'OFERTAS VARIAS';
  if (s.includes('BUENOMAX') || s.includes('BUENO MAX')) return 'BUENOMAX';
  if (s.includes('DAYUAN')) return 'DAYUAN';
  if (s.includes('HOME MASTER')) return 'HOME MASTER';
  if (s.includes('ZINGER')) return 'ZINGER';
  if (s.includes('INGCO')) return 'INGCO';
  if (s.includes('RIVMASTER')) return 'RIVMASTER';
  if (s.includes('MACACO')) return 'MACACO';
  return sheetName.trim();
}

/**
 * Migrate directly from an Excel Workbook (.xlsx) with multiple sheets
 */
export function migrateFromExcelFile(filePath) {
  console.log(`\n📦 Cargando archivo Excel multi-hoja: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }

  const wb = XLSX.readFile(filePath, { cellFormula: true, cellStyles: true, sheetStubs: true });
  console.log(`📑 Hojas detectadas en el libro (${wb.SheetNames.length}):`, wb.SheetNames.join(', '));

  const findProductBySku = db.prepare('SELECT id, current_stock FROM products WHERE sku = ?');
  const insertProductStmt = db.prepare(`
    INSERT INTO products (
      sku, name, category, brand, unit, fob_price, shipping_cost, tariff_cost, landed_cost,
      sale_price, wholesale_price, box_price, special_price, current_stock, min_stock,
      boxes_count, units_per_box, loose_units, total_units_received, weekly_sales,
      reserved_stock, exchange_rate, capital_usd, warehouse, customs_policy, supplier,
      entry_year, entry_date, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateProductStmt = db.prepare(`
    UPDATE products SET
      name = ?,
      category = ?,
      brand = ?,
      unit = ?,
      fob_price = ?,
      tariff_cost = ?,
      landed_cost = ?,
      sale_price = ?,
      wholesale_price = ?,
      box_price = ?,
      special_price = ?,
      current_stock = ?,
      boxes_count = ?,
      units_per_box = ?,
      loose_units = ?,
      total_units_received = ?,
      weekly_sales = ?,
      reserved_stock = ?,
      exchange_rate = ?,
      capital_usd = ?,
      warehouse = ?,
      customs_policy = ?,
      supplier = ?,
      entry_year = ?,
      entry_date = ?,
      notes = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE sku = ?
  `);

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalStockGlobal = 0;
  let totalCapitalGlobal = 0;

  const transaction = db.transaction(() => {
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
      const brand = inferBrand(sheetName);

      // Dynamically locate header row (row containing DETALLE or CODIGO)
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

      // Locate column indices dynamically
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
        if (!colMap.looseUnits && rHeader.includes('SOBRANTE')) colMap.looseUnits = colLetter;
        if (!colMap.totalUnits && (rHeader.includes('SUELTA POR UNIDAD') || rHeader.includes('TOTAL UNID'))) colMap.totalUnits = colLetter;
        if (!colMap.unit && (rHeader.includes('UN/ MED') || rHeader.includes('UNIDAD') || rHeader === 'UNID')) colMap.unit = colLetter;
        if (!colMap.costFob && (rHeader === 'COSTO' || rHeader.includes('COSTO FOB') || rHeader.includes('FOB'))) colMap.costFob = colLetter;
        if (!colMap.percent && (rHeader === '%' || rHeader.includes('ARANCEL') || rHeader.includes('DESCUENTO'))) colMap.percent = colLetter;
        if (!colMap.priceMayor && (rHeader.includes('MAYOR') || (r1.includes('PRECIOS') && !colMap.priceMayor))) colMap.priceMayor = colLetter;
        if (!colMap.priceCaja && (rHeader.includes('CAJA') && !rHeader.includes('Q.'))) colMap.priceCaja = colLetter;
        if (!colMap.priceEspecial && rHeader.includes('ESPECIAL')) colMap.priceEspecial = colLetter;
        if (!colMap.stockActual && (rHeader.includes('STOCK ACTUAL') || rHeader.includes('EXISTENCIA'))) colMap.stockActual = colLetter;
        if (!colMap.weeklySales && (rHeader.includes('SALIDAS SEMANA') || rHeader.includes('SALIDAS'))) colMap.weeklySales = colLetter;
        if (!colMap.reserved && (r1.includes('RESERVA') || rHeader.includes('RESERVA'))) colMap.reserved = colLetter;
        if (!colMap.exchangeRate && (r1.includes('TIPO DE CAMBIO') || rHeader.includes('TIPO DE CAMBIO'))) colMap.exchangeRate = colLetter;
        if (!colMap.capital && (r1.includes('CAPITAL') || rHeader.includes('CAPITAL'))) colMap.capital = colLetter;
        if (!colMap.obs && (rHeader.includes('OBS') || r1.includes('OBS'))) colMap.obs = colLetter;
        if (!colMap.year && (r1.includes('AÑO') || rHeader.includes('AÑO'))) colMap.year = colLetter;
        if (!colMap.date && (r1.includes('FECHA') || rHeader.includes('FECHA'))) colMap.date = colLetter;
      }

      let sheetCreated = 0;
      let sheetUpdated = 0;

      for (let r = headerRowIndex + 1; r <= range.e.r + 1; r++) {
        const getCellVal = (colKey) => {
          const colLetter = colMap[colKey];
          if (!colLetter) return '';
          const cell = ws[colLetter + r];
          return cell && cell.v !== undefined ? cell.v : '';
        };

        let sku = String(getCellVal('sku')).trim().toUpperCase();
        const name = String(getCellVal('name')).trim();

        if (!sku && !name) {
          totalSkipped++;
          continue;
        }

        if (!sku) {
          sku = `${brand.slice(0, 3)}-${r}`;
        }

        const category = inferCategory(name, sheetName);
        const unit = String(getCellVal('unit')).trim() || 'UNI';
        const costFob = parseSpanishNumber(getCellVal('costFob'));
        const percentVal = parseSpanishNumber(getCellVal('percent'));
        
        // Calculated Net Cost ($) = CostFob - (CostFob * % / 100)
        const discountAmt = percentVal > 0 ? (costFob * percentVal / 100) : 0;
        const netCost = costFob - discountAmt;
        const landedCost = netCost > 0 ? netCost : costFob;

        const exchangeRate = parseSpanishNumber(getCellVal('exchangeRate')) || 11.5;

        // Prices
        const priceMayor = parseSpanishNumber(getCellVal('priceMayor'));
        const priceCaja = parseSpanishNumber(getCellVal('priceCaja'));
        const priceEspecial = parseSpanishNumber(getCellVal('priceEspecial'));
        const salePrice = priceMayor > 0 ? priceMayor : (priceCaja > 0 ? priceCaja : (landedCost * exchangeRate * 1.25));

        // Stock Breakdown
        const boxesCount = Math.max(0, Math.round(parseSpanishNumber(getCellVal('boxes'))));
        const unitsPerBox = Math.max(1, Math.round(parseSpanishNumber(getCellVal('unitsPerBox'))));
        const looseUnits = Math.max(0, Math.round(parseSpanishNumber(getCellVal('looseUnits'))));
        const totalReceived = (boxesCount * unitsPerBox) + looseUnits;

        const rawStock = parseSpanishNumber(getCellVal('stockActual'));
        const currentStock = Math.max(0, Math.round(rawStock));
        const weeklySales = Math.max(0, Math.round(parseSpanishNumber(getCellVal('weeklySales'))));
        const reservedStock = Math.max(0, Math.round(parseSpanishNumber(getCellVal('reserved'))));

        const capitalUsd = parseSpanishNumber(getCellVal('capital')) || (netCost * currentStock);

        const warehouse = String(getCellVal('warehouse')).trim() || 'CASA CUBANO';
        const policy = String(getCellVal('policy')).trim();
        const obs = String(getCellVal('obs')).trim();
        const entryYear = String(getCellVal('year')).trim();
        const entryDate = String(getCellVal('date')).trim();

        const notesParts = [];
        if (obs) notesParts.push(obs);
        if (policy) notesParts.push(`Póliza: ${policy}`);
        if (priceCaja > 0) notesParts.push(`P.Caja: Bs ${priceCaja.toFixed(2)}`);
        if (priceEspecial > 0) notesParts.push(`P.Especial: Bs ${priceEspecial.toFixed(2)}`);
        const notes = notesParts.join(' | ');

        totalStockGlobal += currentStock;
        totalCapitalGlobal += capitalUsd;

        const existing = findProductBySku.get(sku);
        if (existing) {
          updateProductStmt.run(
            name, category, brand, unit, costFob, discountAmt, landedCost,
            salePrice, priceMayor, priceCaja, priceEspecial, currentStock,
            boxesCount, unitsPerBox, looseUnits, totalReceived, weeklySales,
            reservedStock, exchangeRate, capitalUsd, warehouse, policy, brand,
            entryYear, entryDate, notes, sku
          );
          sheetUpdated++;
          totalUpdated++;
        } else {
          insertProductStmt.run(
            sku, name, category, brand, unit, costFob, 0, discountAmt, landedCost,
            salePrice, priceMayor, priceCaja, priceEspecial, currentStock, 10,
            boxesCount, unitsPerBox, looseUnits, totalReceived, weeklySales,
            reservedStock, exchangeRate, capitalUsd, warehouse, policy, brand,
            entryYear, entryDate, notes
          );
          sheetCreated++;
          totalCreated++;
        }
      }

      console.log(`   ✓ Hoja "${sheetName}": ${sheetCreated} creados, ${sheetUpdated} actualizados.`);
    }

    // Save in import history
    db.prepare(`
      INSERT INTO import_history (filename, source_type, records_count)
      VALUES (?, 'Excel Completo Multi-Hoja', ?)
    `).run(path.basename(filePath), totalCreated + totalUpdated);
  });

  transaction();

  const summary = {
    success: true,
    filename: path.basename(filePath),
    totalSheets: wb.SheetNames.length,
    sheets: wb.SheetNames,
    createdCount: totalCreated,
    updatedCount: totalUpdated,
    totalProcessed: totalCreated + totalUpdated,
    totalStockUnits: totalStockGlobal,
    totalValuationCost: Number(totalCapitalGlobal.toFixed(2))
  };

  console.log(`\n🎉 MIGRACIÓN COMPLETA FINALIZADA:`);
  console.log(`   - Hojas procesadas: ${wb.SheetNames.length}`);
  console.log(`   - Productos totales: ${totalCreated + totalUpdated}`);
  console.log(`   - Stock global: ${totalStockGlobal.toLocaleString()} unidades`);
  console.log(`   - Capital inventario: $${totalCapitalGlobal.toLocaleString()} USD\n`);

  return summary;
}

/**
 * Handle URL / CSV / Single Sheet fallback
 */
export async function migrateGoogleSheet(urlOrCsvText = null) {
  // If no param or asks for default file, check if INVENTARIO UYUS 26.xlsx exists
  const defaultExcel = path.join(__dirname, '..', 'INVENTARIO UYUS 26.xlsx');
  if (!urlOrCsvText && fs.existsSync(defaultExcel)) {
    return migrateFromExcelFile(defaultExcel);
  }

  // If local file path provided
  if (urlOrCsvText && fs.existsSync(urlOrCsvText)) {
    return migrateFromExcelFile(urlOrCsvText);
  }

  // Otherwise fetch CSV via live URL
  const sheetUrl = urlOrCsvText || 'https://docs.google.com/spreadsheets/d/1IPcFtgXBAQZNc8SDo9qH3w8PAunzwiCNTB0VFHkJnFQ/export?format=csv';
  console.log(`🌐 Descargando hoja de cálculo desde: ${sheetUrl}`);
  const res = await fetch(sheetUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const csvText = await res.text();

  const parsed = Papa.parse(csvText, { skipEmptyLines: true });
  const rawRows = parsed.data;
  if (!rawRows || rawRows.length < 2) {
    throw new Error('El archivo CSV descargado no contiene datos suficientes.');
  }

  // Find header row: look for row that has 'CODIGO' or 'DETALLE'
  let headerIndex = -1;
  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const rowStr = rawRows[i].map(c => String(c || '').trim().toUpperCase());
    if (rowStr.includes('CODIGO') && rowStr.includes('DETALLE')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) headerIndex = 1;

  const rawHeaders = rawRows[headerIndex].map(h => String(h || '').trim());
  const dataRows = rawRows.slice(headerIndex + 1);

  const colMap = {};
  rawHeaders.forEach((h, idx) => {
    const upper = h.toUpperCase().trim();
    if (upper === 'CODIGO' || upper === 'CÓDIGO') colMap.sku = idx;
    else if (upper === 'DETALLE' || upper === 'PRODUCTO') colMap.name = idx;
    else if (upper === 'POLIZA' || upper === 'PÓLIZA') colMap.policy = idx;
    else if (upper === 'BODEGA') colMap.warehouse = idx;
    else if (upper.includes('Q. DE CAJAS')) colMap.boxes = idx;
    else if (upper.includes('POR CAJA')) colMap.unitsPerBox = idx;
    else if (upper === 'UN/ MED' || upper === 'UNIDAD') colMap.unit = idx;
    else if (upper === 'COSTO') colMap.cost = idx;
    else if (upper === '%') colMap.percent = idx;
    else if (upper === 'MAYOR') colMap.priceMayor = idx;
    else if (upper === 'CAJA') colMap.priceCaja = idx;
    else if (upper === 'ESPECIAL') colMap.priceEspecial = idx;
    else if (upper === 'STOCK ACTUAL') colMap.stockActual = idx;
    else if (upper.includes('OBS')) colMap.notes = idx;
    else if (upper.includes('CAPITAL')) colMap.capital = idx;
  });

  const getVal = (row, key) => (colMap[key] !== undefined && row[colMap[key]] !== undefined ? row[colMap[key]] : '');

  const findProductBySku = db.prepare('SELECT id FROM products WHERE sku = ?');
  const insertProductStmt = db.prepare(`
    INSERT INTO products (
      sku, name, category, brand, unit, fob_price, shipping_cost, tariff_cost, landed_cost,
      sale_price, wholesale_price, box_price, special_price, current_stock, min_stock,
      boxes_count, units_per_box, warehouse, customs_policy, supplier, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateProductStmt = db.prepare(`
    UPDATE products SET
      name = ?, category = ?, brand = ?, unit = ?, fob_price = ?, tariff_cost = ?,
      landed_cost = ?, sale_price = ?, wholesale_price = ?, box_price = ?, special_price = ?,
      current_stock = ?, boxes_count = ?, units_per_box = ?, warehouse = ?, customs_policy = ?,
      supplier = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE sku = ?
  `);

  let createdCount = 0;
  let updatedCount = 0;
  let totalStockSum = 0;
  let totalValuationSum = 0;

  const transaction = db.transaction(() => {
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      let sku = String(getVal(row, 'sku')).trim().toUpperCase();
      const name = String(getVal(row, 'name')).trim();

      if (!sku && !name) continue;
      if (!sku) sku = `UYU-${String(i + 1).padStart(4, '0')}`;

      const category = inferCategory(name, 'UYUS MANUAL');
      const unit = String(getVal(row, 'unit')).trim() || 'UNI';
      const costFob = parseSpanishNumber(getVal(row, 'cost'));
      const percentVal = parseSpanishNumber(getVal(row, 'percent'));
      const discountAmt = percentVal > 0 ? (costFob * percentVal / 100) : 0;
      const landedCost = costFob - discountAmt;

      const priceMayor = parseSpanishNumber(getVal(row, 'priceMayor'));
      const priceCaja = parseSpanishNumber(getVal(row, 'priceCaja'));
      const priceEspecial = parseSpanishNumber(getVal(row, 'priceEspecial'));
      const salePrice = priceMayor > 0 ? priceMayor : (priceCaja > 0 ? priceCaja : (landedCost * 1.4));

      const currentStock = Math.max(0, Math.round(parseSpanishNumber(getVal(row, 'stockActual'))));
      const boxesCount = Math.max(0, Math.round(parseSpanishNumber(getVal(row, 'boxes'))));
      const unitsPerBox = Math.max(1, Math.round(parseSpanishNumber(getVal(row, 'unitsPerBox'))));
      const warehouse = String(getVal(row, 'warehouse')).trim() || 'CASA CUBANO';
      const policy = String(getVal(row, 'policy')).trim();
      const obs = String(getVal(row, 'notes')).trim();
      const brand = 'UYUSTOOLS';

      const notesParts = [];
      if (obs) notesParts.push(obs);
      if (policy) notesParts.push(`Póliza: ${policy}`);
      if (priceCaja > 0) notesParts.push(`P.Caja: Bs ${priceCaja.toFixed(2)}`);
      const notes = notesParts.join(' | ');

      totalStockSum += currentStock;
      totalValuationSum += (currentStock * landedCost);

      const existing = findProductBySku.get(sku);
      if (existing) {
        updateProductStmt.run(
          name, category, brand, unit, costFob, discountAmt, landedCost,
          salePrice, priceMayor, priceCaja, priceEspecial, currentStock,
          boxesCount, unitsPerBox, warehouse, policy, brand, notes, sku
        );
        updatedCount++;
      } else {
        insertProductStmt.run(
          sku, name, category, brand, unit, costFob, 0, discountAmt, landedCost,
          salePrice, priceMayor, priceCaja, priceEspecial, currentStock, 10,
          boxesCount, unitsPerBox, warehouse, policy, brand, notes
        );
        createdCount++;
      }
    }
  });

  transaction();

  return {
    success: true,
    createdCount,
    updatedCount,
    totalProcessed: createdCount + updatedCount,
    totalStockUnits: totalStockSum,
    totalValuationCost: Number(totalValuationSum.toFixed(2))
  };
}

// If run directly
if (process.argv[1] && process.argv[1].endsWith('migrateSheets.js')) {
  const target = process.argv[2] ? process.argv[2].toLowerCase() : 'all';
  const uyusFile = path.join(__dirname, '..', 'INVENTARIO UYUS 26.xlsx');
  const variosFile = path.join(__dirname, '..', 'INVENTARIO VARIOS 26.xlsx');

  if (target === 'varios' || (target === 'all' && fs.existsSync(variosFile))) {
    if (fs.existsSync(variosFile)) {
      console.log('🚀 Iniciando migración de INVENTARIO VARIOS 26.xlsx...');
      migrateFromExcelFile(variosFile);
    }
  }

  if (target === 'uyus' || target === 'all') {
    if (fs.existsSync(uyusFile)) {
      console.log('🚀 Iniciando migración de INVENTARIO UYUS 26.xlsx...');
      migrateFromExcelFile(uyusFile);
    } else {
      migrateGoogleSheet()
        .then(res => console.log('Resultado:', res))
        .catch(err => console.error('Error migrando:', err));
    }
  }
}
