// ============================================================================
// MODO DEMO TEMPORAL (FRONTEND STANDALONE / VERCEL DEPLOY SIN BACKEND)
// ============================================================================
// Para desactivar el modo demo cuando conectes el backend real:
// Cambia DEMO_MODE = false o define VITE_DEMO_MODE=false en tus variables de entorno.

const isLocalEnvironment =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.'));

export const DEMO_MODE =
  import.meta.env.VITE_DEMO_MODE !== undefined
    ? String(import.meta.env.VITE_DEMO_MODE).toLowerCase() === 'true'
    : !isLocalEnvironment;

export const DEMO_TOKEN = 'demo-jwt-token-importadora-rivero-2026';

const DEMO_STORAGE_KEY = 'siscontrol_demo_state_v1';

/**
 * Construye el usuario autenticado para el Modo Demo
 */
export function buildDemoUser(rawUsername = 'Abel', provider = 'credentials') {
  const clean = String(rawUsername || 'Abel').trim() || 'Abel';
  const lower = clean.toLowerCase();

  if (lower === 'daniel' || lower === 'ventas') {
    return {
      id: 2,
      name: 'Daniel Ventas',
      nombre: 'Daniel Ventas',
      username: 'daniel',
      role: 'VENTAS',
      rol: 'Ventas & Despachos',
      empresa: 'Importadora Rivero',
      phone: '72211111',
      avatar_color: '#0284c7',
      provider,
      is_demo: true
    };
  }

  if (lower === 'almacen' || lower === 'bodega') {
    return {
      id: 3,
      name: 'Encargado Almacén',
      nombre: 'Encargado Almacén',
      username: 'almacen',
      role: 'ALMACEN',
      rol: 'Almacén & Logística',
      empresa: 'Importadora Rivero',
      phone: '72222222',
      avatar_color: '#059669',
      provider,
      is_demo: true
    };
  }

  const formattedName =
    lower === 'abel'
      ? 'Abel (Super Admin)'
      : clean.charAt(0).toUpperCase() + clean.slice(1);

  return {
    id: 1,
    name: formattedName,
    nombre: formattedName,
    username: lower.replace(/\s+/g, ''),
    role: 'SUPER_ADMIN',
    rol: 'Administrador',
    empresa: 'Importadora Rivero',
    phone: '72200000',
    avatar_color: '#FF8C00',
    provider,
    is_demo: true
  };
}

function getLocalToday() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
}

function getInitialDemoState() {
  const today = getLocalToday();
  return {
    users: [
      {
        id: 1,
        name: 'Abel (Super Admin)',
        nombre: 'Abel (Super Admin)',
        username: 'abel',
        role: 'SUPER_ADMIN',
        rol: 'Administrador',
        empresa: 'Importadora Rivero',
        phone: '72200000',
        avatar_color: '#FF8C00',
        active: 1
      },
      {
        id: 2,
        name: 'Daniel Ventas',
        nombre: 'Daniel Ventas',
        username: 'daniel',
        role: 'VENTAS',
        rol: 'Ventas & Despachos',
        empresa: 'Importadora Rivero',
        phone: '72211111',
        avatar_color: '#0284c7',
        active: 1
      },
      {
        id: 3,
        name: 'Encargado Almacén',
        nombre: 'Encargado Almacén',
        username: 'almacen',
        role: 'ALMACEN',
        rol: 'Almacén & Logística',
        empresa: 'Importadora Rivero',
        phone: '72222222',
        avatar_color: '#059669',
        active: 1
      }
    ],
    products: [
      {
        id: 1,
        sku: 'TAKTMT1502',
        name: 'ACCESORIOS P/SIERRAS MULTIFUNCION SET/15PZS TOTAL',
        brand: 'TOTAL TOOLS',
        category: 'Corte & Abrasivos',
        warehouse: 'CASA CUBANO',
        current_stock: 73,
        boxes_count: 2,
        stock_almacen: 73,
        stock_tienda: 0,
        stock_cubano: 73,
        min_stock: 15,
        units_per_box: 40,
        unit: 'SET',
        fob_price: 8.5,
        landed_cost: 68.0,
        sale_price: 98.0,
        wholesale_price: 98.0,
        box_price: 96.0,
        special_price: 95.0,
        supplier: 'TOTAL TOOLS'
      },
      {
        id: 2,
        sku: 'ACT080',
        name: 'ACCESORIOS P/T(D)REMEL 80PZS SET UYUS',
        brand: 'UYUSTOOLS',
        category: 'Ferretería & Construcción',
        warehouse: 'CASA CUBANO',
        customs_policy: 'DI-2024-201-2086886',
        current_stock: 110,
        boxes_count: 2,
        stock_almacen: 110,
        stock_tienda: 0,
        stock_cubano: 110,
        min_stock: 20,
        units_per_box: 50,
        unit: 'SET',
        fob_price: 4.8,
        landed_cost: 36.0,
        sale_price: 55.0,
        wholesale_price: 55.0,
        box_price: 53.0,
        special_price: 50.0,
        supplier: 'UYUSTOOLS'
      },
      {
        id: 3,
        sku: 'KM-1352',
        name: 'ACCESORIOS COMPRESOR 17PZS KAMASA',
        brand: 'KAMASA',
        category: 'Neumática & Aire',
        warehouse: 'VILLA PAGADOR',
        customs_policy: 'DI-2025-201-2305901',
        current_stock: 60,
        boxes_count: 3,
        stock_almacen: 60,
        stock_tienda: 0,
        stock_cubano: 0,
        min_stock: 12,
        units_per_box: 20,
        unit: 'SET',
        fob_price: 7.9,
        landed_cost: 59.0,
        sale_price: 89.0,
        wholesale_price: 89.0,
        box_price: 87.0,
        special_price: 84.0,
        supplier: 'KAMASA'
      },
      {
        id: 4,
        sku: 'ACC017',
        name: 'ACCESORIOS P/COMPRESOR 17PZS UYUS',
        brand: 'UYUSTOOLS',
        category: 'Neumática & Aire',
        warehouse: 'CASA CUBANO',
        current_stock: 80,
        boxes_count: 4,
        stock_almacen: 80,
        stock_tienda: 0,
        stock_cubano: 80,
        min_stock: 16,
        units_per_box: 20,
        unit: 'SET',
        fob_price: 11.2,
        landed_cost: 86.0,
        sale_price: 130.0,
        wholesale_price: 130.0,
        box_price: 125.0,
        special_price: 120.0,
        supplier: 'UYUSTOOLS'
      },
      {
        id: 5,
        sku: 'ACA250',
        name: 'ACEITERA 250GRS. FERRAWYY',
        brand: 'UYUSTOOLS',
        category: 'Neumática & Aire',
        warehouse: 'CASA CUBANO',
        current_stock: 120,
        boxes_count: 2,
        stock_almacen: 120,
        stock_tienda: 0,
        stock_cubano: 120,
        min_stock: 30,
        units_per_box: 60,
        unit: 'UNI',
        fob_price: 1.4,
        landed_cost: 10.5,
        sale_price: 18.0,
        wholesale_price: 18.0,
        box_price: 16.0,
        special_price: 14.0,
        supplier: 'UYUSTOOLS'
      }
    ],
    customers: [
      {
        id: 1,
        name: 'FERRETERÍA INDUSTRIAL LA PAZ - SRA. MARTHA',
        phone: '71544321',
        address: 'Zona Eloy Salmón, La Paz',
        city: 'La Paz',
        total_debt: 3400,
        notes_count: 2
      },
      {
        id: 2,
        name: 'DISTRIBUIDORA EL SOL - SR. RAMIRO',
        phone: '70788912',
        address: 'Mercado La Pampa, Cochabamba',
        city: 'Cochabamba',
        total_debt: 1280,
        notes_count: 1
      },
      {
        id: 3,
        name: 'FERRETERÍA CENTRAL SANTA CRUZ - JORGE',
        phone: '76012345',
        address: 'Feria Barrio Lindo, Santa Cruz',
        city: 'Santa Cruz',
        total_debt: 0,
        notes_count: 1
      }
    ],
    salesNotes: [
      {
        id: 101,
        note_code: 'IR101A',
        note_type: 'VENTA',
        date: today,
        due_date: today,
        customer_name: 'FERRETERÍA INDUSTRIAL LA PAZ - SRA. MARTHA',
        customer_phone: '71544321',
        customer_address: 'Zona Eloy Salmón, La Paz',
        delivery_type: 'Flota / Encomienda',
        delivery_destination: 'Trans Copacabana - La Paz',
        seller_name: 'ABEL',
        total_boxes: 3,
        total_units: 130,
        items_count: 2,
        total_amount: 9140,
        paid_amount: 5740,
        balance_amount: 3400,
        status: 'PENDIENTE',
        payment_method: 'QR',
        account_info: 'CUENTA JAIME',
        notes: 'Enviar guía por WhatsApp apenas salga.',
        items: [
          {
            id: 1,
            product_id: 1,
            sku: 'TAKTMT1502',
            description: 'ACCESORIOS P/SIERRAS MULTIFUNCION SET/15PZS TOTAL',
            unit_med: 'SET',
            sale_mode: 'CAJA',
            boxes_count: 1,
            units_per_box: 40,
            quantity: 40,
            unit_price: 96,
            subtotal: 3840,
            warehouse_source: 'CASA CUBANO'
          },
          {
            id: 2,
            product_id: 2,
            sku: 'ACT080',
            description: 'ACCESORIOS P/T(D)REMEL 80PZS SET UYUS',
            unit_med: 'SET',
            sale_mode: 'CAJA',
            boxes_count: 2,
            units_per_box: 50,
            quantity: 100,
            unit_price: 53,
            subtotal: 5300,
            warehouse_source: 'CASA CUBANO'
          }
        ],
        payments: [
          {
            id: 1,
            amount: 5740,
            payment_method: 'POR TRANSFERENCIA QR CUENTA JAIME',
            account_info: 'CUENTA JAIME',
            payment_date: today,
            registered_by: 'ABEL'
          }
        ]
      },
      {
        id: 102,
        note_code: 'REP-001',
        note_type: 'REPOSICION_TIENDA',
        date: today,
        due_date: today,
        customer_name: 'REPOSICIÓN TIENDA CENTRAL',
        customer_phone: '',
        customer_address: 'TIENDA CENTRAL',
        delivery_type: 'Reposición a Tienda',
        delivery_destination: 'TIENDA CENTRAL',
        seller_name: 'DANIEL',
        total_boxes: 2,
        total_units: 90,
        items_count: 2,
        total_amount: 0,
        paid_amount: 0,
        balance_amount: 0,
        status: 'EN_CURSO',
        notes: 'Reposición de mercadería para mostrador tienda.',
        items: [
          {
            id: 3,
            product_id: 1,
            sku: 'TAKTMT1502',
            description: 'ACCESORIOS P/SIERRAS MULTIFUNCION SET/15PZS TOTAL',
            unit_med: 'SET',
            sale_mode: 'CAJA',
            boxes_count: 1,
            units_per_box: 40,
            quantity: 40,
            unit_price: 0,
            subtotal: 0,
            warehouse_source: 'ALMACEN'
          },
          {
            id: 4,
            product_id: 2,
            sku: 'ACT080',
            description: 'ACCESORIOS P/T(D)REMEL 80PZS SET UYUS',
            unit_med: 'SET',
            sale_mode: 'CAJA',
            boxes_count: 1,
            units_per_box: 50,
            quantity: 50,
            unit_price: 0,
            subtotal: 0,
            warehouse_source: 'ALMACEN'
          }
        ],
        payments: []
      }
    ],
    dailyOrders: [
      {
        id: 1,
        order_date: today,
        shift: 'MAÑANA',
        order_number: 1,
        client_name: 'FERRETERÍA INDUSTRIAL LA PAZ - SRA. MARTHA',
        sales_note_id: 101,
        sales_note_code: 'IR101A',
        note_type: 'VENTA',
        note_status: 'PENDIENTE',
        note_total: 9140,
        note_paid: 5740,
        note_balance: 3400,
        note_total_boxes: 3,
        note_total_units: 140,
        delivery_place: 'Trans Copacabana - La Paz',
        seller_name: 'ABEL',
        is_delivered: 0,
        status: 'PENDIENTE'
      },
      {
        id: 2,
        order_date: today,
        shift: 'MAÑANA',
        order_number: 2,
        client_name: 'REPOSICIÓN TIENDA CENTRAL',
        sales_note_id: 102,
        sales_note_code: 'REP-001',
        note_type: 'REPOSICION_TIENDA',
        note_status: 'EN_CURSO',
        note_total: 0,
        note_paid: 0,
        note_balance: 0,
        note_total_boxes: 2,
        note_total_units: 90,
        delivery_place: 'TIENDA CENTRAL',
        seller_name: 'DANIEL',
        is_delivered: 0,
        status: 'EN_CURSO'
      }
    ],
    containers: [
      {
        id: 1,
        code: 'MSCU-928374-1',
        name: 'Contenedor 40HQ Herramientas UYUSTOOLS & TOTAL',
        origin: 'Ningbo, China',
        destination: 'Aduana Interior Cochabamba',
        departure_date: '2026-10-25',
        eta_date: '2026-12-04',
        status: 'EN TRÁNSITO',
        transport_type: 'MARÍTIMO + CAMIÓN',
        total_fob_usd: 38400,
        freight_usd: 4200,
        customs_bob: 24500,
        items_count: 14,
        total_boxes: 680,
        progress: 75,
        prelista_items: [
          {
            id: 1,
            sku: 'TAKTMT1502',
            description: 'ACCESORIOS P/SIERRAS MULTIFUNCION SET/15PZS TOTAL',
            boxes_expected: 120,
            units_per_box: 40,
            total_units: 4800,
            box_price_bob: 96,
            reservations: []
          },
          {
            id: 2,
            sku: 'ACT080',
            description: 'ACCESORIOS P/T(D)REMEL 80PZS SET UYUS',
            boxes_expected: 150,
            units_per_box: 50,
            total_units: 7500,
            box_price_bob: 53,
            reservations: []
          }
        ]
      }
    ],
    movements: [
      {
        id: 1,
        date: `${today} 09:15`,
        type: 'SALIDA',
        product_sku: 'TAKTMT1502',
        product_name: 'ACCESORIOS P/SIERRAS MULTIFUNCION SET/15PZS TOTAL',
        quantity: 40,
        boxes: 1,
        warehouse: 'CASA CUBANO',
        reference: 'IR101A',
        user_name: 'ABEL',
        notes: 'Despacho Trans Copacabana'
      }
    ],
    expenses: [
      {
        id: 1,
        date: today,
        category: 'TRANSPORTE',
        description: 'Flete envío cajas a terminal flota La Paz',
        amount: 45,
        payment_method: 'EFECTIVO',
        registered_by: 'ABEL'
      }
    ]
  };
}

function loadDemoState() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore storage errors
  }
  const initial = getInitialDemoState();
  saveDemoState(initial);
  return initial;
}

function saveDemoState(state) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Demo-Mode': 'true'
    }
  });
}

function parseBody(init) {
  if (!init?.body) return {};
  if (typeof init.body === 'string') {
    try {
      return JSON.parse(init.body);
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Intercepta llamadas a /api/* cuando DEMO_MODE está activo o cuando el backend
 * no existe (ej. deploy estático en Vercel que devuelve HTML en vez de JSON).
 */
export async function handleDemoApiRequest(urlStr, init = {}) {
  const method = (init?.method || 'GET').toUpperCase();
  const url = new URL(urlStr, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  const path = url.pathname;
  const body = parseBody(init);
  const state = loadDemoState();
  const today = getLocalToday();

  // 1. Auth & Users
  if (path === '/api/users/login' && method === 'POST') {
    const user = buildDemoUser(body.username || 'Abel', body.provider || 'credentials');
    return jsonResponse({
      success: true,
      token: DEMO_TOKEN,
      data: user
    });
  }

  if (path === '/api/auth/me') {
    try {
      const saved = JSON.parse(localStorage.getItem('siscontrol_auth_session') || 'null');
      if (saved?.user) {
        return jsonResponse({ success: true, data: saved.user });
      }
    } catch {
      // fallback
    }
    return jsonResponse({ success: true, data: buildDemoUser('Abel') });
  }

  if (path === '/api/users/impersonate' && method === 'POST') {
    const found = state.users.find(u => Number(u.id) === Number(body.userId)) || buildDemoUser('Abel');
    return jsonResponse({
      success: true,
      token: DEMO_TOKEN,
      data: found
    });
  }

  if (path === '/api/users' && method === 'GET') {
    return jsonResponse({ success: true, data: state.users });
  }

  if (path === '/api/users' && method === 'POST') {
    const newUser = {
      id: Date.now(),
      name: body.name || 'Nuevo Usuario',
      nombre: body.name || 'Nuevo Usuario',
      username: (body.username || `user${Date.now()}`).toLowerCase(),
      role: body.role || 'VENTAS',
      rol: body.role || 'VENTAS',
      empresa: 'Importadora Rivero',
      phone: body.phone || '',
      avatar_color: body.avatar_color || '#FF8C00',
      active: 1
    };
    state.users.push(newUser);
    saveDemoState(state);
    return jsonResponse({ success: true, data: newUser });
  }

  if (path.startsWith('/api/users/') && (method === 'GET' || method === 'PUT' || method === 'DELETE')) {
    const id = Number(path.split('/').pop());
    if (method === 'GET') {
      const found = state.users.find(u => Number(u.id) === id) || state.users[0];
      return jsonResponse({ success: true, data: found });
    }
    if (method === 'PUT') {
      const idx = state.users.findIndex(u => Number(u.id) === id);
      if (idx >= 0) {
        state.users[idx] = { ...state.users[idx], ...body };
        saveDemoState(state);
        return jsonResponse({ success: true, data: state.users[idx] });
      }
      return jsonResponse({ success: true, data: { id, ...body } });
    }
    if (method === 'DELETE') {
      state.users = state.users.filter(u => Number(u.id) !== id);
      saveDemoState(state);
      return jsonResponse({ success: true });
    }
  }

  // 2. Dashboard Stats & Charts
  if (path === '/api/dashboard/stats') {
    const totalInventoryUnits = state.products.reduce((s, p) => s + Number(p.current_stock || 0), 0);
    const totalValuationSale = state.products.reduce(
      (s, p) => s + Number(p.current_stock || 0) * Number(p.sale_price || 0),
      0
    );
    const totalValuationCost = state.products.reduce(
      (s, p) => s + Number(p.current_stock || 0) * Number(p.landed_cost || 0),
      0
    );
    const totalSales = state.salesNotes
      .filter(n => n.note_type !== 'REPOSICION_TIENDA' && n.status !== 'ANULADO')
      .reduce((s, n) => s + Number(n.total_amount || 0), 0);
    const totalCollected = state.salesNotes
      .filter(n => n.note_type !== 'REPOSICION_TIENDA' && n.status !== 'ANULADO')
      .reduce((s, n) => s + Number(n.paid_amount || 0), 0);
    const totalReceivable = state.salesNotes
      .filter(n => n.note_type !== 'REPOSICION_TIENDA' && n.status !== 'ANULADO')
      .reduce((s, n) => s + Number(n.balance_amount || 0), 0);

    return jsonResponse({
      success: true,
      data: {
        totalProducts: state.products.length,
        totalUnits: totalInventoryUnits,
        lowStockCount: state.products.filter(p => Number(p.current_stock) <= Number(p.min_stock || 15)).length,
        outOfStockCount: state.products.filter(p => Number(p.current_stock) <= 0).length,
        totalValuationBob: totalValuationSale,
        totalCostValuationBob: totalValuationCost,
        projectedProfitBob: totalValuationSale - totalValuationCost,
        totalSalesBob: totalSales,
        totalCollectedBob: totalCollected,
        totalReceivableBob: totalReceivable,
        activeContainers: state.containers.length
      }
    });
  }

  if (path === '/api/dashboard/charts') {
    return jsonResponse({
      success: true,
      data: {
        monthlyFlow: [
          { month: 'Jul', entradas: 420, salidas: 360, ventasBob: 48500 },
          { month: 'Ago', entradas: 510, salidas: 470, ventasBob: 61200 },
          { month: 'Sep', entradas: 480, salidas: 440, ventasBob: 58900 },
          { month: 'Oct', entradas: 640, salidas: 590, ventasBob: 74300 },
          { month: 'Nov', entradas: 720, salidas: 685, ventasBob: 89400 }
        ],
        categoriesDistribution: [
          { name: 'Corte & Abrasivos', value: 73, stock: 73 },
          { name: 'Ferretería & Construcción', value: 110, stock: 110 },
          { name: 'Neumática & Aire', value: 260, stock: 260 }
        ],
        topProducts: state.products.slice(0, 5).map(p => ({
          sku: p.sku,
          name: p.name,
          sold_units: 48,
          revenue_bob: Number(p.box_price || p.sale_price) * 40
        }))
      }
    });
  }

  // 3. Products
  if (path === '/api/products' && method === 'GET') {
    return jsonResponse({ success: true, data: state.products });
  }

  if (path === '/api/products' && method === 'POST') {
    const newProd = {
      id: Date.now(),
      sku: (body.sku || `IR${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase(),
      name: body.name || 'Producto Nuevo',
      brand: body.brand || 'UYUSTOOLS',
      category: body.category || 'GENERAL',
      warehouse: body.warehouse || 'CASA CUBANO',
      current_stock: Number(body.current_stock || 0),
      boxes_count: Number(body.boxes_count || 1),
      stock_almacen: Number(body.stock_almacen ?? body.current_stock ?? 0),
      stock_tienda: Number(body.stock_tienda || 0),
      stock_cubano: Number(body.stock_cubano || 0),
      min_stock: Number(body.min_stock || 12),
      units_per_box: Number(body.units_per_box || 1),
      fob_price: Number(body.fob_price || 0),
      landed_cost: Number(body.landed_cost || 0),
      sale_price: Number(body.sale_price || 0),
      box_price: Number(body.box_price || 0),
      wholesale_price: Number(body.wholesale_price || body.sale_price || 0),
      special_price: Number(body.special_price || body.sale_price || 0)
    };
    state.products.unshift(newProd);
    saveDemoState(state);
    return jsonResponse({ success: true, data: newProd });
  }

  if (path.startsWith('/api/products/') && path.endsWith('/quick-stock-in') && method === 'POST') {
    const parts = path.split('/');
    const id = Number(parts[parts.length - 2]);
    const idx = state.products.findIndex(p => Number(p.id) === id);
    if (idx >= 0) {
      const boxes = Number(body.boxes_count || 1);
      const upb = Number(body.units_per_box || state.products[idx].units_per_box || 1);
      const added = Number(body.units_to_add || body.quantity || boxes * upb);
      state.products[idx].current_stock = Number(state.products[idx].current_stock || 0) + added;
      state.products[idx].boxes_count = Number(state.products[idx].boxes_count || 0) + boxes;
      state.products[idx].stock_almacen = Number(state.products[idx].stock_almacen || 0) + added;
      saveDemoState(state);
      return jsonResponse({ success: true, data: state.products[idx] });
    }
  }

  if (path.startsWith('/api/products/') && (method === 'PUT' || method === 'DELETE')) {
    const id = Number(path.split('/').pop());
    if (method === 'PUT') {
      const idx = state.products.findIndex(p => Number(p.id) === id);
      if (idx >= 0) {
        state.products[idx] = { ...state.products[idx], ...body };
        saveDemoState(state);
        return jsonResponse({ success: true, data: state.products[idx] });
      }
    }
    if (method === 'DELETE') {
      state.products = state.products.filter(p => Number(p.id) !== id);
      saveDemoState(state);
      return jsonResponse({ success: true });
    }
  }

  // 4. Sales Notes
  if (path === '/api/sales-notes' && method === 'GET') {
    const validSales = state.salesNotes.filter(n => n.note_type !== 'REPOSICION_TIENDA' && n.status !== 'ANULADO');
    const totalSales = validSales.reduce((s, n) => s + Number(n.total_amount || 0), 0);
    const totalCollected = validSales.reduce((s, n) => s + Number(n.paid_amount || 0), 0);
    const totalReceivable = validSales.reduce((s, n) => s + Number(n.balance_amount || 0), 0);
    return jsonResponse({
      success: true,
      data: state.salesNotes,
      kpis: {
        total_sales: totalSales,
        total_notes: validSales.length,
        total_collected: totalCollected,
        total_receivable: totalReceivable,
        pending_notes_count: validSales.filter(n => Number(n.balance_amount) > 0).length,
        daily_cash: 2000,
        daily_cash_count: 1,
        daily_qr: 5740,
        daily_qr_jaime: 5740,
        daily_qr_betho: 0,
        daily_total_collected: 7740,
        daily_payments_count: 2
      }
    });
  }

  if (path === '/api/sales-notes' && method === 'POST') {
    const isRestock = body.note_type === 'REPOSICION_TIENDA';
    const nextNum = state.salesNotes.length + 1;
    const rawItems = (body.items || []).map((it, idx) => {
      const isBox = it.sale_mode === 'CAJA';
      const boxes = Number(it.boxes_count || 1);
      const upb = Number(it.units_per_box || 1);
      const qty = isBox ? boxes * upb : Number(it.quantity || 1);
      const price = isRestock ? 0 : Number(it.unit_price || 0);
      return {
        id: Date.now() + idx,
        ...it,
        boxes_count: boxes,
        units_per_box: upb,
        quantity: qty,
        unit_price: price,
        subtotal: isRestock ? 0 : qty * price
      };
    });
    const totalBoxes = rawItems.reduce((s, i) => s + (i.sale_mode === 'CAJA' ? i.boxes_count : 0), 0);
    const totalUnits = rawItems.reduce((s, i) => s + i.quantity, 0);
    const totalAmount = isRestock ? 0 : rawItems.reduce((s, i) => s + i.subtotal, 0);
    const paidAmount = isRestock
      ? 0
      : (body.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    const balanceAmount = isRestock ? 0 : Math.max(0, totalAmount - paidAmount);
    const noteId = Date.now();
    const noteCode = body.note_code || (isRestock ? `REP-00${nextNum}` : `IR10${nextNum}A`);

    const newNote = {
      id: noteId,
      noteId,
      note_code: noteCode,
      note_type: body.note_type || 'VENTA',
      date: body.date || today,
      due_date: body.due_date || today,
      customer_name: isRestock ? 'REPOSICIÓN TIENDA CENTRAL' : body.customer_name || 'CLIENTE GENERAL',
      customer_phone: body.customer_phone || '',
      customer_address: body.customer_address || 'Cochabamba',
      delivery_type: body.delivery_type || (isRestock ? 'Reposición a Tienda' : 'A su tienda'),
      delivery_destination: body.delivery_destination || 'TIENDA CENTRAL',
      seller_name: body.seller_name || 'ABEL',
      total_boxes: totalBoxes,
      total_units: totalUnits,
      items_count: rawItems.length,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
      status: isRestock ? 'EN_CURSO' : balanceAmount <= 0 ? 'PAGADO' : 'PENDIENTE',
      items: rawItems,
      payments: (body.payments || []).map((p, i) => ({
        id: Date.now() + i,
        ...p
      }))
    };

    // Si es VENTA normal, descuenta stock automáticamente en demo
    if (!isRestock) {
      rawItems.forEach(it => {
        const pIdx = state.products.findIndex(p => Number(p.id) === Number(it.product_id) || p.sku === it.sku);
        if (pIdx >= 0) {
          state.products[pIdx].current_stock = Math.max(0, Number(state.products[pIdx].current_stock || 0) - it.quantity);
        }
      });
    }

    state.salesNotes.unshift(newNote);
    state.dailyOrders.unshift({
      id: Date.now() + 99,
      order_date: newNote.date,
      shift: body.shift || 'MAÑANA',
      order_number: state.dailyOrders.length + 1,
      client_name: newNote.customer_name,
      sales_note_id: newNote.id,
      sales_note_code: newNote.note_code,
      note_type: newNote.note_type,
      note_status: newNote.status,
      note_total: newNote.total_amount,
      note_paid: newNote.paid_amount,
      note_balance: newNote.balance_amount,
      note_total_boxes: newNote.total_boxes,
      note_total_units: newNote.total_units,
      delivery_place: newNote.delivery_destination,
      seller_name: newNote.seller_name,
      is_delivered: 0,
      status: newNote.status
    });
    saveDemoState(state);
    return jsonResponse({ success: true, data: newNote });
  }

  if (path.startsWith('/api/sales-notes/')) {
    const parts = path.split('/');
    const id = Number(parts[3]);
    const idx = state.salesNotes.findIndex(n => Number(n.id) === id);

    if (path.endsWith('/payments') && method === 'POST' && idx >= 0) {
      const amount = Number(body.amount || 0);
      const note = state.salesNotes[idx];
      const payment = {
        id: Date.now(),
        amount,
        payment_method: body.payment_method || 'POR EFECTIVO',
        account_info: body.account_info || '',
        payment_date: body.payment_date || today,
        registered_by: body.registered_by || 'ABEL'
      };
      note.payments = [...(note.payments || []), payment];
      note.paid_amount = Number(note.paid_amount || 0) + amount;
      note.balance_amount = Math.max(0, Number(note.total_amount || 0) - note.paid_amount);
      note.status = note.balance_amount <= 0 ? 'PAGADO' : 'PENDIENTE';
      saveDemoState(state);
      return jsonResponse({ success: true, data: note });
    }

    if (path.endsWith('/confirm-restock') && method === 'POST' && idx >= 0) {
      state.salesNotes[idx].status = 'RECIBIDO';
      state.dailyOrders.forEach(o => {
        if (Number(o.sales_note_id) === id) {
          o.note_status = 'RECIBIDO';
          o.status = 'ENTREGADO';
          o.is_delivered = 1;
        }
      });
      saveDemoState(state);
      return jsonResponse({
        success: true,
        message: 'Reposición confirmada como recibida en tienda.',
        data: state.salesNotes[idx]
      });
    }

    if (method === 'GET' && idx >= 0) {
      return jsonResponse({ success: true, data: state.salesNotes[idx] });
    }

    if (method === 'PUT' && idx >= 0) {
      state.salesNotes[idx] = { ...state.salesNotes[idx], ...body };
      saveDemoState(state);
      return jsonResponse({ success: true, data: state.salesNotes[idx] });
    }

    if (method === 'DELETE' && idx >= 0) {
      state.salesNotes[idx].status = 'ANULADO';
      saveDemoState(state);
      return jsonResponse({ success: true });
    }
  }

  // 5. Daily Orders
  if (path === '/api/daily-orders' && method === 'GET') {
    return jsonResponse({
      success: true,
      data: {
        date: url.searchParams.get('date') || today,
        orders: state.dailyOrders,
        sideItems: [],
        salesNotes: state.salesNotes,
        truckReservations: [],
        preReservaNotes: []
      }
    });
  }

  if (path === '/api/daily-orders' && method === 'POST') {
    if (Array.isArray(body.orders)) {
      state.dailyOrders = body.orders;
      saveDemoState(state);
      return jsonResponse({ success: true, data: state.dailyOrders });
    }
    const newOrder = {
      id: Date.now(),
      order_date: body.order_date || today,
      shift: body.shift || 'MAÑANA',
      client_name: body.client_name || body.customer_name || 'CLIENTE DEMO',
      delivery_place: body.delivery_place || body.destination || 'Cochabamba',
      note_total_boxes: Number(body.boxes_count || 1),
      status: body.status || 'PENDIENTE'
    };
    state.dailyOrders.unshift(newOrder);
    saveDemoState(state);
    return jsonResponse({ success: true, data: newOrder });
  }

  if (path.startsWith('/api/daily-orders/')) {
    const id = Number(path.split('/')[3]);
    const idx = state.dailyOrders.findIndex(o => Number(o.id) === id);
    if (idx >= 0 && (method === 'PUT' || method === 'POST')) {
      state.dailyOrders[idx] = { ...state.dailyOrders[idx], ...body, is_delivered: 1, status: 'ENTREGADO' };
      saveDemoState(state);
      return jsonResponse({ success: true, data: state.dailyOrders[idx] });
    }
    if (idx >= 0 && method === 'DELETE') {
      state.dailyOrders.splice(idx, 1);
      saveDemoState(state);
      return jsonResponse({ success: true });
    }
  }

  // 6. Weekly Dispatches / Reportes Semanales
  if (path.startsWith('/api/weekly-dispatches')) {
    const demoRows = state.products.map((p, idx) => ({
      ...p,
      auto_qty_l: idx === 0 ? 40 : idx === 1 ? 50 : 0,
      auto_qty_m: idx === 1 ? 50 : 0,
      auto_qty_mi: 0,
      auto_qty_j: 0,
      auto_qty_v: 0,
      auto_qty_s: 0,
      auto_total_sold: idx === 0 ? 40 : idx === 1 ? 100 : 0,
      auto_avg_price: p.box_price || p.wholesale_price || p.sale_price || 0,
      auto_min_price: p.box_price || p.wholesale_price || p.sale_price || 0,
      auto_max_price: p.box_price || p.wholesale_price || p.sale_price || 0,
      auto_total_revenue: (idx === 0 ? 40 : idx === 1 ? 100 : 0) * Number(p.box_price || p.sale_price || 0),
      notes_summary: idx <= 1 ? 'IR101A: FERRETERÍA INDUSTRIAL LA PAZ (ABEL)' : ''
    })).filter(r => r.auto_total_sold > 0);

    return jsonResponse({
      success: true,
      total: demoRows.length,
      data: demoRows,
      kpiSummary: {
        totalProductsSold: demoRows.length,
        totalUnitsSold: 140,
        totalUnitsPending: 90,
        totalRevenueSold: 9140
      }
    });
  }

  // 7. Customers
  if (path === '/api/customers' && method === 'GET') {
    return jsonResponse({ success: true, data: state.customers });
  }

  if (path === '/api/customers' && method === 'POST') {
    const newCust = {
      id: Date.now(),
      name: (body.name || 'NUEVO CLIENTE').toUpperCase(),
      phone: body.phone || '',
      address: body.address || 'Cochabamba',
      store_location_url: body.store_location_url || '',
      city: body.city || 'Cochabamba',
      total_debt: Number(body.total_debt || 0),
      notes_count: 0
    };
    state.customers.unshift(newCust);
    saveDemoState(state);
    return jsonResponse({ success: true, data: newCust });
  }

  // 8. Containers
  if (path === '/api/containers' && method === 'GET') {
    return jsonResponse({ success: true, data: state.containers });
  }

  if (path === '/api/containers' && method === 'POST') {
    const newCont = {
      id: Date.now(),
      code: body.code || `CONT-${Date.now().toString().slice(-4)}`,
      name: body.name || 'Nuevo Embarque en Tránsito',
      origin: body.origin || 'China',
      destination: body.destination || 'Cochabamba',
      eta_date: body.eta_date || today,
      status: body.status || 'EN TRÁNSITO',
      total_boxes: Number(body.total_boxes || 0),
      prelista_items: body.prelista_items || []
    };
    state.containers.unshift(newCont);
    saveDemoState(state);
    return jsonResponse({ success: true, data: newCont });
  }

  // 9. Movements
  if (path === '/api/movements') {
    if (method === 'POST') {
      const mov = {
        id: Date.now(),
        date: `${today} 12:00`,
        type: body.type || 'ENTRADA',
        product_sku: body.product_sku || 'TAKTMT1502',
        product_name: body.product_name || 'Producto',
        quantity: Number(body.quantity || 1),
        warehouse: body.warehouse || 'CASA CUBANO',
        user_name: 'ABEL',
        notes: body.notes || ''
      };
      state.movements.unshift(mov);
      saveDemoState(state);
      return jsonResponse({ success: true, data: mov });
    }
    return jsonResponse({ success: true, data: state.movements });
  }

  // 10. Cash Closing & Expenses
  if (path === '/api/cash-closing') {
    const totalExpenses = state.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    return jsonResponse({
      success: true,
      data: {
        date: url.searchParams.get('date') || today,
        summary: {
          efectivo_ingresos: 2000,
          qr_jaime: 5740,
          qr_betho: 0,
          qr_otros: 0,
          total_ingresos: 7740,
          gastos_efectivo: totalExpenses,
          gastos_qr: 0,
          total_gastos: totalExpenses,
          efectivo_neto_caja: 2000 - totalExpenses,
          saldo_total_dia: 7740 - totalExpenses
        },
        payments: [
          {
            id: 1,
            note_code: 'IR101A',
            customer_name: 'FERRETERÍA INDUSTRIAL LA PAZ - SRA. MARTHA',
            amount: 5740,
            payment_method: 'POR TRANSFERENCIA QR CUENTA JAIME',
            account_info: 'CUENTA JAIME',
            registered_by: 'ABEL'
          }
        ],
        expenses: state.expenses
      }
    });
  }

  if (path === '/api/expenses' && method === 'POST') {
    const exp = {
      id: Date.now(),
      date: body.date || today,
      category: body.category || 'OPERATIVO',
      description: body.description || 'Gasto de caja chica',
      amount: Number(body.amount || 0),
      payment_method: body.payment_method || 'EFECTIVO',
      registered_by: 'ABEL'
    };
    state.expenses.unshift(exp);
    saveDemoState(state);
    return jsonResponse({ success: true, data: exp });
  }

  if (path.startsWith('/api/expenses/') && method === 'DELETE') {
    const id = Number(path.split('/').pop());
    state.expenses = state.expenses.filter(e => Number(e.id) !== id);
    saveDemoState(state);
    return jsonResponse({ success: true });
  }

  // Fallback genérico para cualquier otro endpoint /api/*
  return jsonResponse({
    success: true,
    demo: true,
    data: []
  });
}

