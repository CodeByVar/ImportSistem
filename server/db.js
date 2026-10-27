import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'siscontrol.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency & speed
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // Create Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      unit TEXT NOT NULL DEFAULT 'Unidad',
      fob_price REAL NOT NULL DEFAULT 0,
      shipping_cost REAL NOT NULL DEFAULT 0,
      tariff_cost REAL NOT NULL DEFAULT 0,
      landed_cost REAL NOT NULL DEFAULT 0,
      sale_price REAL NOT NULL DEFAULT 0,
      current_stock INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 10,
      supplier TEXT DEFAULT 'Importación Directa',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  `);

  // Create Containers / Shipments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS containers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_number TEXT UNIQUE NOT NULL,
      origin_country TEXT NOT NULL DEFAULT 'China',
      shipping_line TEXT DEFAULT 'CMA CGM',
      status TEXT NOT NULL DEFAULT 'transito', -- 'transito', 'aduana', 'recibido', 'inspeccion'
      departure_date TEXT,
      estimated_arrival TEXT,
      actual_arrival TEXT,
      total_cbm REAL DEFAULT 0,
      total_fob REAL DEFAULT 0,
      total_freight REAL DEFAULT 0,
      total_taxes REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_containers_status ON containers(status);
  `);

  // Create Inventory Movements (Entradas y Salidas)
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
      quantity INTEGER NOT NULL,
      unit_cost REAL NOT NULL DEFAULT 0,
      unit_price REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      gross_profit REAL NOT NULL DEFAULT 0,
      container_id INTEGER REFERENCES containers(id) ON DELETE SET NULL,
      reference TEXT, -- N° Factura / Boleta / Guía de Embarque
      party_name TEXT, -- Cliente o Proveedor
      payment_method TEXT DEFAULT 'Transferencia',
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_movements_product ON inventory_movements(product_id);
    CREATE INDEX IF NOT EXISTS idx_movements_type ON inventory_movements(type);
    CREATE INDEX IF NOT EXISTS idx_movements_date ON inventory_movements(date);
  `);

  // Create Operational Expenses
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Import History
  db.exec(`
    CREATE TABLE IF NOT EXISTS import_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'Google Sheets',
      records_count INTEGER NOT NULL DEFAULT 0,
      imported_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weekly_dispatches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_code TEXT NOT NULL,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      qty_l INTEGER NOT NULL DEFAULT 0,
      qty_m INTEGER NOT NULL DEFAULT 0,
      qty_mi INTEGER NOT NULL DEFAULT 0,
      qty_j INTEGER NOT NULL DEFAULT 0,
      qty_v INTEGER NOT NULL DEFAULT 0,
      qty_s INTEGER NOT NULL DEFAULT 0,
      qty_reservas INTEGER NOT NULL DEFAULT 0,
      total_week INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(week_code, product_id)
    );

    CREATE INDEX IF NOT EXISTS idx_weekly_dispatches_week ON weekly_dispatches(week_code);

    -- Clientes (Equivalente al encabezado y consolidado del cliente)
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      city TEXT DEFAULT 'Cochabamba',
      notes TEXT,
      store_location_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

    -- Notas de Venta / Pedidos (Equivalente a Hoja 1, Hoja 2... Hoja 42)
    CREATE TABLE IF NOT EXISTS sales_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_code TEXT UNIQUE NOT NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      customer_address TEXT,
      date TEXT NOT NULL,
      due_date TEXT,
      seller_name TEXT DEFAULT 'DANIEL',
      delivery_type TEXT DEFAULT 'A su tienda',
      delivery_destination TEXT,
      delivery_location_url TEXT,
      notes TEXT,
      total_boxes INTEGER DEFAULT 0,
      total_units INTEGER DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      balance_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'PAGADO', 'ANULADO'
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_sales_notes_customer ON sales_notes(customer_id);
    CREATE INDEX IF NOT EXISTS idx_sales_notes_status ON sales_notes(status);
    CREATE INDEX IF NOT EXISTS idx_sales_notes_date ON sales_notes(date);

    -- Ítems de la Nota (Soporte Mixto: Por Caja y Por Cantidad Unitaria)
    CREATE TABLE IF NOT EXISTS sales_note_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER NOT NULL REFERENCES sales_notes(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      sku TEXT NOT NULL,
      description TEXT NOT NULL,
      unit_med TEXT DEFAULT 'UNI',
      sale_mode TEXT NOT NULL DEFAULT 'CAJA', -- 'CAJA' (Hoja XX) o 'UNIDAD' (Hoja X)
      boxes_count INTEGER DEFAULT 0,
      units_per_box INTEGER DEFAULT 1,
      quantity INTEGER NOT NULL, -- Total de unidades físicas descontadas de inventario
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      warehouse_source TEXT NOT NULL DEFAULT 'ALMACEN' -- 'ALMACEN' o 'TIENDA'
    );

    CREATE INDEX IF NOT EXISTS idx_sales_items_note ON sales_note_items(note_id);

    -- Pagos y Abonos de la Nota (A/C múltiples: Efectivo, QR Cuenta Jaime, etc.)
    CREATE TABLE IF NOT EXISTS sales_note_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER NOT NULL REFERENCES sales_notes(id) ON DELETE CASCADE,
      payment_method TEXT NOT NULL DEFAULT 'Efectivo',
      account_info TEXT,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      registered_by TEXT DEFAULT 'DANIEL',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_sales_payments_note ON sales_note_payments(note_id);

    -- Orden del Día / Despacho Diario (Equivalente exacto a la Hoja de Entregas Diario)
    CREATE TABLE IF NOT EXISTS daily_dispatch_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL, -- 'YYYY-MM-DD'
      day_name TEXT NOT NULL, -- 'LUNES', 'MARTES', etc.
      supervisor TEXT DEFAULT 'TITO',
      row_num INTEGER DEFAULT 1,
      activity_or_customer TEXT NOT NULL,
      sales_note_id INTEGER REFERENCES sales_notes(id) ON DELETE SET NULL,
      sales_note_code TEXT,
      morning_shift INTEGER DEFAULT 0,
      afternoon_shift INTEGER DEFAULT 0,
      status TEXT DEFAULT 'IMPRESO', -- 'IMPRESO', 'PENDIENTE', 'EN PREPARACIÓN', 'ENTREGADO', 'CANCELADO'
      observations TEXT DEFAULT '',
      extra_observations TEXT DEFAULT '',
      pending_tasks TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_daily_orders_date ON daily_dispatch_orders(date);

    CREATE TABLE IF NOT EXISTS daily_dispatch_side_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      section TEXT NOT NULL, -- 'PENDIENTES', 'LISTAS_HACER', 'CORRECCIONES'
      title TEXT NOT NULL,
      status TEXT DEFAULT 'PENDIENTE',
      notes TEXT DEFAULT '',
      row_num INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_daily_side_items_date ON daily_dispatch_side_items(date);

    CREATE TABLE IF NOT EXISTS daily_dispatch_meta (
      date TEXT PRIMARY KEY,
      supervisor TEXT DEFAULT 'TITO',
      notes TEXT
    );
  `);

  // Insertar cliente inicial si la tabla está vacía
  const customerCount = db.prepare('SELECT count(*) as c FROM customers').get().c;
  if (customerCount === 0) {
    db.prepare(`
      INSERT INTO customers (code, name, phone, address, city, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('IR-EG', 'ERICK GARCIA', '68579599', 'MERCADO LA PAMPA', 'Cochabamba', 'Cliente recurrente - Mercado La Pampa');
  }

  // Migrate new columns if they do not exist
  const prodCols = db.prepare("PRAGMA table_info(products)").all().map(c => c.name);
  const addCol = (col, typeDef) => {
    if (!prodCols.includes(col)) {
      try {
        db.exec(`ALTER TABLE products ADD COLUMN ${col} ${typeDef}`);
      } catch (e) {
        // column may already exist
      }
    }
  };

  addCol('brand', "TEXT DEFAULT 'UYUSTOOLS'");
  addCol('warehouse', "TEXT DEFAULT 'CASA CUBANO'");
  addCol('customs_policy', "TEXT");
  addCol('wholesale_price', "REAL DEFAULT 0");
  addCol('box_price', "REAL DEFAULT 0");
  addCol('special_price', "REAL DEFAULT 0");
  addCol('boxes_count', "INTEGER DEFAULT 0");
  addCol('units_per_box', "INTEGER DEFAULT 1");
  addCol('loose_units', "INTEGER DEFAULT 0");
  addCol('total_units_received', "INTEGER DEFAULT 0");
  addCol('weekly_sales', "INTEGER DEFAULT 0");
  addCol('reserved_stock', "INTEGER DEFAULT 0");
  addCol('exchange_rate', "REAL DEFAULT 11.5");
  addCol('capital_usd', "REAL DEFAULT 0");
  addCol('entry_year', "TEXT");
  addCol('entry_date', "TEXT");

  // Migrate customers columns
  const custCols = db.prepare("PRAGMA table_info(customers)").all().map(c => c.name);
  if (!custCols.includes('store_location_url')) {
    try {
      db.exec("ALTER TABLE customers ADD COLUMN store_location_url TEXT");
    } catch (e) {}
  }

  // Migrate sales_notes columns
  const noteCols = db.prepare("PRAGMA table_info(sales_notes)").all().map(c => c.name);
  if (!noteCols.includes('delivery_type')) {
    try {
      db.exec("ALTER TABLE sales_notes ADD COLUMN delivery_type TEXT DEFAULT 'A su tienda'");
    } catch (e) {}
  }
  if (!noteCols.includes('delivery_location_url')) {
    try {
      db.exec("ALTER TABLE sales_notes ADD COLUMN delivery_location_url TEXT");
    } catch (e) {}
  }

  // Create Container Items (Prelista por contenedor/camión)
  db.exec(`
    CREATE TABLE IF NOT EXISTS container_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_id INTEGER NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
      item_number INTEGER,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_code TEXT NOT NULL,
      product_name TEXT NOT NULL,
      boxes_count REAL NOT NULL DEFAULT 0,
      units_per_box REAL NOT NULL DEFAULT 1,
      total_units REAL NOT NULL DEFAULT 0,
      unit_measure TEXT DEFAULT 'UNI',
      unit_cost REAL DEFAULT 0,
      margin_percent REAL DEFAULT 0,
      price_mayor REAL DEFAULT 0,
      price_caja REAL DEFAULT 0,
      price_special REAL DEFAULT 0,
      price_discount_25 REAL DEFAULT 0,
      price_adjustment_20 REAL DEFAULT 0,
      reserved_boxes REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_container_items_cont ON container_items(container_id);
    CREATE INDEX IF NOT EXISTS idx_container_items_code ON container_items(product_code);
  `);

  // Create Container Reservations (Pre-reservas de clientes sobre el embarque/camión en camino)
  db.exec(`
    CREATE TABLE IF NOT EXISTS container_reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_id INTEGER NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
      container_item_id INTEGER NOT NULL REFERENCES container_items(id) ON DELETE CASCADE,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      reserved_boxes REAL NOT NULL DEFAULT 0,
      reserved_units REAL NOT NULL DEFAULT 0,
      price_agreed REAL DEFAULT 0,
      status TEXT DEFAULT 'PENDIENTE',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_cont_res_cont ON container_reservations(container_id);
  `);

  // Migrate container columns for multimodal & truck support
  const containerCols = db.prepare("PRAGMA table_info(containers)").all().map(c => c.name);
  const addContCol = (col, typeDef) => {
    if (!containerCols.includes(col)) {
      try {
        db.exec(`ALTER TABLE containers ADD COLUMN ${col} ${typeDef}`);
      } catch (e) {}
    }
  };

  addContCol('transport_type', "TEXT DEFAULT 'MARITIMO'"); // 'MARITIMO' (Barco + Camión) o 'TERRESTRE' (Camión Directo)
  addContCol('truck_plate', "TEXT"); // Placa de camión / manifiesto terrestre
  addContCol('truck_driver', "TEXT"); // Chofer o empresa de transporte terrestre
  addContCol('port_name', "TEXT DEFAULT 'Arica (Chile)'"); // Puerto de llegada si es marítimo
  addContCol('port_arrival_date', "TEXT"); // Fecha en que llega a puerto
  addContCol('warehouse_arrival_date', "TEXT"); // Fecha en que llega a bodega

  // Migrate container_items columns (new fields for inline editing)
  const contItemCols = db.prepare("PRAGMA table_info(container_items)").all().map(c => c.name);
  const addCiCol = (col, typeDef) => {
    if (!contItemCols.includes(col)) {
      try {
        db.exec(`ALTER TABLE container_items ADD COLUMN ${col} ${typeDef}`);
      } catch (e) {}
    }
  };
  addCiCol('previous_cost', 'REAL DEFAULT 0');             // Costo Anterior del producto
  addCiCol('previous_price', 'REAL DEFAULT 0');            // Precio Anterior del producto
  addCiCol('order_confirmed_date', 'TEXT');                 // Fecha en que se confirmó/subió el pedido
  addCiCol('sale_price', 'REAL DEFAULT 0');                 // Precio venta sugerido
  addCiCol('wholesale_price', 'REAL DEFAULT 0');            // Precio Mayorista
  addCiCol('special_price', 'REAL DEFAULT 0');              // Precio Especial

  console.log('✅ SISCONTROL SQLite Database initialized at:', dbPath);
}

export default db;
