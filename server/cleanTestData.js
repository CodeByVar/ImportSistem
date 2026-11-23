/**
 * SISCONTROL — Limpiador Seguro Pre-Producción (Para arrancar Diciembre con datos reales)
 *
 * Uso:
 *   npm run clean:test-data                 -> Vista previa (NO borra nada)
 *   npm run clean:test-data -- --confirm    -> Crea backup automático y limpia los datos de prueba
 *
 * Qué CONSERVA intacto:
 *   - Usuarios y roles (con sus PINs cifrados scrypt)
 *   - Catálogo de productos (y corrige cualquier stock negativo a 0)
 *   - Logs de auditoría de seguridad
 *
 * Qué LIMPIA (datos de prueba):
 *   - Notas de venta, ítems y pagos de prueba
 *   - Orden del día y planilla semanal de prueba
 *   - Movimientos de prueba, gastos de prueba y clientes de prueba
 *   - Contenedores/prelistas de prueba
 */
import db, { initDatabase } from './db.js';
import { createDatabaseBackup } from './backup.js';

initDatabase();

const isConfirmed = process.argv.includes('--confirm');

const tablesToClean = [
  'sales_note_payments',
  'sales_note_items',
  'sales_notes',
  'daily_dispatch_orders',
  'daily_dispatch_side_items',
  'daily_dispatch_meta',
  'weekly_dispatches',
  'inventory_movements',
  'expenses',
  'container_reservations',
  'container_items',
  'containers',
  'customers'
];

function getSummary() {
  const counts = {};
  for (const t of tablesToClean) {
    try {
      counts[t] = db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c;
    } catch {
      counts[t] = 0;
    }
  }
  const productsCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  const negativeStockCount = db.prepare('SELECT COUNT(*) AS c FROM products WHERE current_stock < 0').get().c;
  const usersCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  return { counts, productsCount, negativeStockCount, usersCount };
}

async function run() {
  const summary = getSummary();

  console.log('\n==============================================================');
  console.log('🧹 SISCONTROL — LIMPIEZA SEGURA DE DATOS DE PRUEBA');
  console.log('==============================================================');
  console.log(`✅ SE CONSERVARÁN: ${summary.productsCount} productos y ${summary.usersCount} usuarios.`);
  console.log(`🔧 Se nivelarán a 0: ${summary.negativeStockCount} producto(s) con stock negativo.`);
  console.log('\n📋 Registros de prueba detectados para limpiar:');
  for (const [table, count] of Object.entries(summary.counts)) {
    console.log(`   - ${table.padEnd(28)}: ${count}`);
  }

  if (!isConfirmed) {
    console.log('\nℹ️  MODO VISTA PREVIA (no se borró ningún dato).');
    console.log('👉 Para ejecutar la limpieza real con respaldo automático previo, corre:');
    console.log('   npm run clean:test-data -- --confirm\n');
    return;
  }

  console.log('\n💾 Creando respaldo automático de seguridad antes de limpiar...');
  const backup = await createDatabaseBackup(db, 'pre-clean');
  console.log(`✅ Respaldo guardado en: ${backup.path} (${backup.size_kb} KB)`);

  const tx = db.transaction(() => {
    for (const t of tablesToClean) {
      db.prepare(`DELETE FROM ${t}`).run();
      try {
        db.prepare('DELETE FROM sqlite_sequence WHERE name = ?').run(t);
      } catch {
        // ignore if sqlite_sequence doesn't have table
      }
    }
    // Fix any negative stock leftover from test sales
    db.prepare('UPDATE products SET current_stock = 0, updated_at = CURRENT_TIMESTAMP WHERE current_stock < 0').run();
  });
  tx();

  console.log('\n🎉 ¡Limpieza completada! SISCONTROL está listo para arrancar con tus datos reales de Diciembre.');
  console.log('👉 Siguiente paso: actualiza tu catálogo real con "npm run migrate:all" o desde "Importar Google Sheets".\n');
}

run().catch(err => {
  console.error('❌ Error en limpieza:', err);
  process.exit(1);
});

