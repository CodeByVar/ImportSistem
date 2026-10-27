import db, { initDatabase } from './db.js';

initDatabase();

export function seedDatabase() {
  console.log('🔄 Seeding database with Importadora demo data...');

  // Clean existing tables in order
  db.exec(`
    DELETE FROM inventory_movements;
    DELETE FROM products;
    DELETE FROM containers;
    DELETE FROM expenses;
    DELETE FROM import_history;
  `);

  // Insert Containers / Shipments
  const insertContainer = db.prepare(`
    INSERT INTO containers (tracking_number, origin_country, shipping_line, status, departure_date, estimated_arrival, actual_arrival, total_cbm, total_fob, total_freight, total_taxes, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const c1 = insertContainer.run(
    'MSCU9482710',
    'China (Ningbo)',
    'MSC Mediterranean Shipping',
    'recibido',
    '2026-06-10',
    '2026-07-28',
    '2026-07-29',
    68.5,
    38450.00,
    4200.00,
    6500.00,
    'Contenedor 40HQ - Lote Verano Electrónica y Ferretería. Desaduanaje completado en puerto central.'
  ).lastInsertRowid;

  const c2 = insertContainer.run(
    'EGLV3820194',
    'China (Shenzhen)',
    'Evergreen Line',
    'aduana',
    '2026-08-05',
    '2026-09-18',
    null,
    42.0,
    29800.00,
    3800.00,
    5100.00,
    'Contenedor 20GP - En inspección física y aforo aduanero. Pendiente levante.'
  ).lastInsertRowid;

  const c3 = insertContainer.run(
    'MAEU7719203',
    'Estados Unidos (Miami)',
    'Maersk Line',
    'transito',
    '2026-09-15',
    '2026-10-20',
    null,
    55.0,
    32100.00,
    3400.00,
    4800.00,
    'Contenedor 40HC - Repuestos y Herramientas especializadas. En navegación.'
  ).lastInsertRowid;

  // Insert Products
  const insertProduct = db.prepare(`
    INSERT INTO products (sku, name, category, unit, fob_price, shipping_cost, tariff_cost, landed_cost, sale_price, current_stock, min_stock, supplier, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const productsData = [
    {
      sku: 'IMP-AUD-01',
      name: 'Auriculares Bluetooth Pro ANC con Cancelación Activa',
      category: 'Electrónica & Audio',
      unit: 'Unidad',
      fob_price: 11.50,
      shipping_cost: 1.20,
      tariff_cost: 1.80,
      landed_cost: 14.50,
      sale_price: 34.90,
      current_stock: 320,
      min_stock: 50,
      supplier: 'Shenzhen Acoustic Tech Co.',
      notes: 'Alta rotación. Empaque retail español.'
    },
    {
      sku: 'IMP-CAM-4G',
      name: 'Cámara de Seguridad Solar 4G PTZ 2K Visión Nocturna',
      category: 'Seguridad & Domótica',
      unit: 'Unidad',
      fob_price: 32.00,
      shipping_cost: 3.80,
      tariff_cost: 5.20,
      landed_cost: 41.00,
      sale_price: 89.00,
      current_stock: 95,
      min_stock: 30,
      supplier: 'Hangzhou Vision Electronics',
      notes: 'Incluye panel solar de 8W y soporte universal.'
    },
    {
      sku: 'IMP-SMW-09',
      name: 'Smartwatch AMOLED Ultra 2.02" con Llamadas Bluetooth',
      category: 'Wearables & Tecnología',
      unit: 'Unidad',
      fob_price: 14.20,
      shipping_cost: 1.10,
      tariff_cost: 2.20,
      landed_cost: 17.50,
      sale_price: 45.00,
      current_stock: 450,
      min_stock: 80,
      supplier: 'Dongguan Smart Device Ltd.',
      notes: 'Producto estrella en ventas online y mayorista.'
    },
    {
      sku: 'IMP-FER-21V',
      name: 'Kit Taladro Percutor Inalámbrico 21V con 2 Baterías + Maletín',
      category: 'Herramientas & Ferretería',
      unit: 'Kit',
      fob_price: 24.50,
      shipping_cost: 4.50,
      tariff_cost: 4.00,
      landed_cost: 33.00,
      sale_price: 69.90,
      current_stock: 140,
      min_stock: 40,
      supplier: 'Yongkang Power Tool Factory',
      notes: 'Gran demanda para talleres y ferreterías.'
    },
    {
      sku: 'IMP-LUZ-300W',
      name: 'Reflector Solar LED 300W IP67 con Control Remoto',
      category: 'Iluminación & Energía Solar',
      unit: 'Unidad',
      fob_price: 13.80,
      shipping_cost: 2.70,
      tariff_cost: 2.50,
      landed_cost: 19.00,
      sale_price: 42.50,
      current_stock: 210,
      min_stock: 60,
      supplier: 'Zhongshan Solar Lighting Co.',
      notes: 'Batería LiFePO4 de larga vida útil.'
    },
    {
      sku: 'IMP-AUT-CMP',
      name: 'Compresor de Aire Portátil Digital Recargable 150 PSI',
      category: 'Repuestos & Automotriz',
      unit: 'Unidad',
      fob_price: 12.00,
      shipping_cost: 1.50,
      tariff_cost: 2.00,
      landed_cost: 15.50,
      sale_price: 36.00,
      current_stock: 180,
      min_stock: 45,
      supplier: 'Ningbo Auto Parts Corp.',
      notes: 'Pantalla digital con apagado automático.'
    },
    {
      sku: 'IMP-FER-LLV46',
      name: 'Juego de Tubos y Llaves Crique Profesional 46 Piezas Cromo-Vanadio',
      category: 'Herramientas & Ferretería',
      unit: 'Set',
      fob_price: 6.80,
      shipping_cost: 1.60,
      tariff_cost: 1.10,
      landed_cost: 9.50,
      sale_price: 24.00,
      current_stock: 310,
      min_stock: 50,
      supplier: 'Yiwu Hardware Imports',
      notes: 'Caja plástica de alta resistencia.'
    },
    {
      sku: 'IMP-ENG-PW30',
      name: 'Power Bank Carga Rápida 30.000mAh 22.5W PD USB-C',
      category: 'Electrónica & Audio',
      unit: 'Unidad',
      fob_price: 9.50,
      shipping_cost: 1.30,
      tariff_cost: 1.70,
      landed_cost: 12.50,
      sale_price: 29.90,
      current_stock: 15, // STOCK CRÍTICO / ALERTA
      min_stock: 70,
      supplier: 'Shenzhen Energy King Co.',
      notes: 'Casi agotado! Necesita reorden urgente en próximo contenedor.'
    },
    {
      sku: 'IMP-HOG-ASP',
      name: 'Aspiradora Inalámbrica Cyclone 200W Portátil 2 en 1',
      category: 'Hogar & Electrodomésticos',
      unit: 'Unidad',
      fob_price: 28.00,
      shipping_cost: 4.20,
      tariff_cost: 4.80,
      landed_cost: 37.00,
      sale_price: 85.00,
      current_stock: 65,
      min_stock: 30,
      supplier: 'Suzhou Home Appliances Ltd.',
      notes: 'Filtro HEPA lavable, motor brushless.'
    },
    {
      sku: 'IMP-AUT-SOP',
      name: 'Soporte Celular Magnético Giratorio 360° para Rejilla Auto',
      category: 'Repuestos & Automotriz',
      unit: 'Unidad',
      fob_price: 1.40,
      shipping_cost: 0.25,
      tariff_cost: 0.25,
      landed_cost: 1.90,
      sale_price: 7.50,
      current_stock: 850,
      min_stock: 150,
      supplier: 'Yiwu Auto Accessories',
      notes: 'Producto de gancho y alto margen porcentual (+294%).'
    },
    {
      sku: 'IMP-LUZ-LED10',
      name: 'Tira LED RGB 5050 Smart WiFi Bluetooth 10m con App',
      category: 'Iluminación & Energía Solar',
      unit: 'Rollo',
      fob_price: 4.20,
      shipping_cost: 0.60,
      tariff_cost: 0.70,
      landed_cost: 5.50,
      sale_price: 15.00,
      current_stock: 420,
      min_stock: 100,
      supplier: 'Zhongshan Lighting Tech',
      notes: 'Sincronización con música por micrófono.'
    },
    {
      sku: 'IMP-TXT-MCH01',
      name: 'Mochila Ejecutiva Antirrobo Impermeable Puerto USB y Candado TSA',
      category: 'Bolsos & Confección',
      unit: 'Unidad',
      fob_price: 8.50,
      shipping_cost: 1.40,
      tariff_cost: 1.60,
      landed_cost: 11.50,
      sale_price: 32.00,
      current_stock: 8, // STOCK CRÍTICO / ALERTA
      min_stock: 50,
      supplier: 'Guangzhou Leather Goods Ltd.',
      notes: 'Muy solicitada para temporada escolar y ejecutiva.'
    },
    {
      sku: 'IMP-FER-DISC',
      name: 'Disco de Corte Fino para Metal e Inox 4.5" (Pack 50 Unid)',
      category: 'Herramientas & Ferretería',
      unit: 'Pack',
      fob_price: 9.00,
      shipping_cost: 2.00,
      tariff_cost: 1.50,
      landed_cost: 12.50,
      sale_price: 27.00,
      current_stock: 240,
      min_stock: 60,
      supplier: 'Yongkang Abrasives Factory',
      notes: 'Venta constante a talleres industriales.'
    },
    {
      sku: 'IMP-GAM-PAD',
      name: 'Control Joystick Inalámbrico Multiplataforma PC/Switch/Android',
      category: 'Electrónica & Audio',
      unit: 'Unidad',
      fob_price: 7.80,
      shipping_cost: 0.90,
      tariff_cost: 1.30,
      landed_cost: 10.00,
      sale_price: 26.50,
      current_stock: 190,
      min_stock: 40,
      supplier: 'Shenzhen Gaming Tech Ltd.',
      notes: 'Compatible con vibración y giroscopio.'
    },
    {
      sku: 'IMP-VINT-FAN',
      name: 'Mini Ventilador Portátil USB Recargable con Clip y Batería',
      category: 'Hogar & Electrodomésticos',
      unit: 'Unidad',
      fob_price: 2.10,
      shipping_cost: 0.40,
      tariff_cost: 0.35,
      landed_cost: 2.85,
      sale_price: 8.00,
      current_stock: 350,
      min_stock: 60,
      supplier: 'Ningbo Electrical Corp.',
      notes: 'Mercadería estacional.'
    }
  ];

  const productIds = [];
  for (const p of productsData) {
    const res = insertProduct.run(
      p.sku,
      p.name,
      p.category,
      p.unit,
      p.fob_price,
      p.shipping_cost,
      p.tariff_cost,
      p.landed_cost,
      p.sale_price,
      p.current_stock,
      p.min_stock,
      p.supplier,
      p.notes
    );
    productIds.push({ id: res.lastInsertRowid, ...p });
  }

  // Insert Inventory Movements (Entradas de Importación + Salidas de Ventas)
  const insertMovement = db.prepare(`
    INSERT INTO inventory_movements (
      product_id, type, quantity, unit_cost, unit_price, total_amount, gross_profit, container_id, reference, party_name, payment_method, date, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 1. Initial Inbound Container reception entries (Entradas de mercadería)
  for (const prod of productIds) {
    const initialQty = prod.current_stock + 180; // Total received was current + what we sold
    insertMovement.run(
      prod.id,
      'ENTRADA',
      initialQty,
      prod.landed_cost,
      0,
      initialQty * prod.landed_cost,
      0,
      c1,
      'IMP-BL-9482710',
      prod.supplier,
      'Carta de Crédito / Transferencia Swift',
      '2026-07-29',
      `Descarga de contenedor MSCU9482710. Recepción verificada en bodega central.`
    );
  }

  // 2. Realistic historical sales (Salidas de mercadería a clientes)
  const customers = [
    'Distribuidora Central S.A.',
    'Mega Tiendas El Sol',
    'Comercializadora San Jorge',
    'TecnoHogar Mayorista',
    'Ferretería Industrial del Norte',
    'Audio & Gadgets Express',
    'AutoPartes La Rueda',
    'Cliente Final Mostrador',
    'Luz & Color Proyectos',
    'E-Commerce MercadoLibre Store'
  ];

  const months = ['2026-08', '2026-09', '2026-10'];
  let refCount = 1001;

  for (const m of months) {
    for (let day = 1; day <= 28; day += 2) {
      const dateStr = `${m}-${String(day).padStart(2, '0')}`;
      
      // Select 2-4 products sold that day
      const numSales = Math.floor(Math.random() * 3) + 2;
      for (let s = 0; s < numSales; s++) {
        const prod = productIds[Math.floor(Math.random() * productIds.length)];
        const qty = Math.floor(Math.random() * 8) + 1; // 1 to 8 units
        const unitPrice = prod.sale_price;
        const totalAmount = qty * unitPrice;
        const grossProfit = (unitPrice - prod.landed_cost) * qty;
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const paymentMethod = ['Transferencia', 'Efectivo', 'Tarjeta Crédito'][Math.floor(Math.random() * 3)];

        insertMovement.run(
          prod.id,
          'SALIDA',
          qty,
          prod.landed_cost,
          unitPrice,
          totalAmount,
          grossProfit,
          null,
          `FAC-2026-${refCount++}`,
          customer,
          paymentMethod,
          dateStr,
          `Venta por canal comercial a ${customer}`
        );
      }
    }
  }

  // Insert Operational Expenses (Bodega, Agente de Aduanas, Flete Local, Sueldos)
  const insertExpense = db.prepare(`
    INSERT INTO expenses (category, description, amount, date)
    VALUES (?, ?, ?, ?)
  `);

  const expensesData = [
    { category: 'Alquiler Bodega', description: 'Alquiler almacén central nave 3', amount: 2400.00, date: '2026-08-01' },
    { category: 'Agente Aduanal', description: 'Honorarios de despacho aduanero contenedor MSCU', amount: 850.00, date: '2026-08-03' },
    { category: 'Logística Local', description: 'Flete de camión puerto a bodega 40 pies', amount: 620.00, date: '2026-08-04' },
    { category: 'Sueldos Logística', description: 'Personal de descarga, embalaje y bodega', amount: 3200.00, date: '2026-08-30' },
    { category: 'Alquiler Bodega', description: 'Alquiler almacén central nave 3', amount: 2400.00, date: '2026-09-01' },
    { category: 'Servicios Básicos', description: 'Electricidad trifásica y montacargas', amount: 480.00, date: '2026-09-15' },
    { category: 'Sueldos Logística', description: 'Personal de descarga y despacho', amount: 3200.00, date: '2026-09-30' },
    { category: 'Alquiler Bodega', description: 'Alquiler almacén central nave 3', amount: 2400.00, date: '2026-10-01' }
  ];

  for (const exp of expensesData) {
    insertExpense.run(exp.category, exp.description, exp.amount, exp.date);
  }

  // Insert Sample Import History record
  db.prepare(`
    INSERT INTO import_history (filename, source_type, records_count)
    VALUES (?, ?, ?)
  `).run('Inventario_GoogleSheets_Master_2026.xlsx', 'Google Sheets / Excel', productsData.length);

  console.log('✅ Base de datos SISCONTROL poblada con éxito con 15 productos, 3 contenedores y movimientos!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase();
  process.exit(0);
}
