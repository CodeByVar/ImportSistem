// ============================================================================
// MODO DEMO TEMPORAL (FRONTEND STANDALONE / VERCEL DEPLOY SIN BACKEND)
// ============================================================================
// Para desactivar el modo demo cuando conectes el backend real:
// Cambia DEMO_MODE = false o define VITE_DEMO_MODE=false en tus variables de entorno.

export const DEMO_MODE =
  import.meta.env.VITE_DEMO_MODE !== undefined
    ? String(import.meta.env.VITE_DEMO_MODE).toLowerCase() === 'true'
    : true;

export const DEMO_TOKEN = 'demo-jwt-token-importadora-rivero-2026';

const DEMO_STORAGE_KEY = 'siscontrol_demo_state_v1';

/**
 * Construye el usuario autenticado para el Modo Demo
 */
export function buildDemoUser(rawUsername = 'Abel', provider = 'credentials') {
  const clean = String(rawUsername || 'Abel').trim() || 'Abel';
  const formattedName =
    clean.toLowerCase() === 'abel'
      ? 'Abel (Super Admin)'
      : clean.charAt(0).toUpperCase() + clean.slice(1);

  return {
    id: 1,
    name: formattedName,
    nombre: formattedName,
    username: clean.toLowerCase().replace(/\s+/g, ''),
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
        sku: 'IR15AV',
        name: 'Licuadora Industrial Vaso Vidrio 1.5L',
        category: 'ELECTRODOMÉSTICOS',
        current_stock: 180,
        stock_almacen: 120,
        stock_tienda: 40,
        stock_cubano: 20,
        min_stock: 24,
        units_per_box: 6,
        fob_price: 12.5,
        landed_cost: 98.0,
        sale_price: 145.0,
        box_price: 840.0,
        wholesale_price: 138.0,
        vip_price: 132.0,
        supplier: 'Guangzhou Home Appliances'
      },
      {
        id: 2,
        sku: 'IR2032',
        name: 'Juego de Ollas Acero Inoxidable 12 Pzs',
        category: 'MENAJE & COCINA',
        current_stock: 96,
        stock_almacen: 72,
        stock_tienda: 16,
        stock_cubano: 8,
        min_stock: 16,
        units_per_box: 4,
        fob_price: 22.0,
        landed_cost: 175.0,
        sale_price: 260.0,
        box_price: 1000.0,
        wholesale_price: 245.0,
        vip_price: 235.0,
        supplier: 'Yiwu Kitchen Pro'
      },
      {
        id: 3,
        sku: 'IR8810',
        name: 'Freidora de Aire Digital 6.5 Litros XXL',
        category: 'ELECTRODOMÉSTICOS',
        current_stock: 64,
        stock_almacen: 48,
        stock_tienda: 12,
        stock_cubano: 4,
        min_stock: 12,
        units_per_box: 4,
        fob_price: 28.0,
        landed_cost: 220.0,
        sale_price: 330.0,
        box_price: 1280.0,
        wholesale_price: 315.0,
        vip_price: 300.0,
        supplier: 'Ningbo Smart Tech'
      },
      {
        id: 4,
        sku: 'IR4050',
        name: 'Termo Acero Inoxidable 2L Pico Cebador',
        category: 'TERMOS & BAZAR',
        current_stock: 240,
        stock_almacen: 180,
        stock_tienda: 60,
        stock_cubano: 0,
        min_stock: 36,
        units_per_box: 12,
        fob_price: 4.8,
        landed_cost: 38.0,
        sale_price: 62.0,
        box_price: 720.0,
        wholesale_price: 58.0,
        vip_price: 55.0,
        supplier: 'Yiwu Drinkware Co.'
      },
      {
        id: 5,
        sku: 'IR9012',
        name: 'Plancha a Vapor Vertical Profesional 2000W',
        category: 'ELECTRODOMÉSTICOS',
        current_stock: 18,
        stock_almacen: 12,
        stock_tienda: 6,
        stock_cubano: 0,
        min_stock: 20,
        units_per_box: 6,
        fob_price: 16.0,
        landed_cost: 128.0,
        sale_price: 195.0,
        box_price: 1110.0,
        wholesale_price: 182.0,
        vip_price: 175.0,
        supplier: 'Guangzhou Home Appliances'
      }
    ],
    customers: [
      {
        id: 1,
        name: 'COMERCIAL LA PAZ - SRA. MARTHA',
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
        name: 'TIENDA CENTRAL SANTA CRUZ - JORGE',
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
        note_code: 'NV-00101',
        note_type: 'VENTA',
        date: today,
        due_date: today,
        customer_name: 'COMERCIAL LA PAZ - SRA. MARTHA',
        customer_phone: '71544321',
        customer_address: 'Zona Eloy Salmón, La Paz',
        delivery_type: 'FLOTA / ENCOMIENDA',
        delivery_destination: 'Trans Copacabana - La Paz',
        seller_name: 'Abel (Super Admin)',
        total_boxes: 10,
        total_units: 48,
        total_amount: 9400,
        paid_amount: 6000,
        balance_amount: 3400,
        status: 'PENDIENTE',
        payment_method: 'QR',
        account_info: 'CUENTA JAIME',
        notes: 'Enviar guía por WhatsApp apenas salga.',
        items: [
          {
            id: 1,
            product_id: 1,
            sku: 'IR15AV',
            description: 'Licuadora Industrial Vaso Vidrio 1.5L',
            sale_mode: 'CAJA',
            boxes_count: 5,
            units_per_box: 6,
            quantity: 30,
            unit_price: 840,
            subtotal: 4200,
            warehouse_source: 'ALMACÉN'
          },
          {
            id: 2,
            product_id: 3,
            sku: 'IR8810',
            description: 'Freidora de Aire Digital 6.5 Litros XXL',
            sale_mode: 'CAJA',
            boxes_count: 4,
            units_per_box: 4,
            quantity: 16,
            unit_price: 1300,
            subtotal: 5200,
            warehouse_source: 'ALMACÉN'
          }
        ],
        payments: [
          {
            id: 1,
            amount: 6000,
            payment_method: 'QR',
            account_info: 'CUENTA JAIME',
            payment_date: today,
            registered_by: 'Abel (Super Admin)'
          }
        ]
      },
      {
        id: 102,
        note_code: 'NV-00102',
        note_type: 'VENTA',
        date: today,
        due_date: today,
        customer_name: 'DISTRIBUIDORA EL SOL - SR. RAMIRO',
        customer_phone: '70788912',
        customer_address: 'Mercado La Pampa, Cochabamba',
        delivery_type: 'ENTREGA LOCAL',
        delivery_destination: 'Mercado La Pampa Pasillo 4',
        seller_name: 'Daniel Ventas',
        total_boxes: 4,
        total_units: 28,
        total_amount: 3280,
        paid_amount: 2000,
        balance_amount: 1280,
        status: 'PENDIENTE',
        payment_method: 'EFECTIVO',
        account_info: 'CAJA EFECTIVO',
        notes: 'Cobrar saldo en la tarde.',
        items: [
          {
            id: 3,
            product_id: 2,
            sku: 'IR2032',
            description: 'Juego de Ollas Acero Inoxidable 12 Pzs',
            sale_mode: 'CAJA',
            boxes_count: 2,
            units_per_box: 4,
            quantity: 8,
            unit_price: 1000,
            subtotal: 2000,
            warehouse_source: 'ALMACÉN'
          },
          {
            id: 4,
            product_id: 3,
            sku: 'IR8810',
            description: 'Freidora de Aire Digital 6.5 Litros XXL',
            sale_mode: 'CAJA',
            boxes_count: 1,
            units_per_box: 4,
            quantity: 4,
            unit_price: 1280,
            subtotal: 1280,
            warehouse_source: 'TIENDA'
          }
        ],
        payments: [
          {
            id: 2,
            amount: 2000,
            payment_method: 'EFECTIVO',
            account_info: 'CAJA EFECTIVO',
            payment_date: today,
            registered_by: 'Daniel Ventas'
          }
        ]
      }
    ],
    dailyOrders: [
      {
        id: 1,
        order_date: today,
        shift: 'MAÑANA',
        note_code: 'NV-00101',
        customer_name: 'COMERCIAL LA PAZ - SRA. MARTHA',
        destination: 'Trans Copacabana - La Paz',
        boxes_count: 9,
        total_amount: 9400,
        paid_amount: 6000,
        balance_amount: 3400,
        payment_status: 'A CUENTA',
        status: 'EN_PROCESO',
        warehouse_source: 'ALMACÉN',
        seller_name: 'Abel (Super Admin)'
      },
      {
        id: 2,
        order_date: today,
        shift: 'TARDE',
        note_code: 'NV-00102',
        customer_name: 'DISTRIBUIDORA EL SOL - SR. RAMIRO',
        destination: 'Mercado La Pampa Pasillo 4',
        boxes_count: 3,
        total_amount: 3280,
        paid_amount: 2000,
        balance_amount: 1280,
        payment_status: 'A CUENTA',
        status: 'PENDIENTE',
        warehouse_source: 'TIENDA',
        seller_name: 'Daniel Ventas'
      }
    ],
    containers: [
      {
        id: 1,
        code: 'MSCU-928374-1',
        name: 'Contenedor 40HQ Electrodomésticos & Licuadoras',
        origin: 'Guangzhou / Ningbo, China',
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
            sku: 'IR15AV',
            description: 'Licuadora Industrial Vaso Vidrio 1.5L',
            boxes_expected: 250,
            units_per_box: 6,
            total_units: 1500,
            box_price_bob: 840,
            reservations: [
              { id: 1, customer_name: 'COMERCIAL LA PAZ - SRA. MARTHA', boxes_reserved: 30, notes: 'Confirmado' }
            ]
          },
          {
            id: 2,
            sku: 'IR8810',
            description: 'Freidora de Aire Digital 6.5 Litros XXL',
            boxes_expected: 180,
            units_per_box: 4,
            total_units: 720,
            box_price_bob: 1280,
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
        product_sku: 'IR15AV',
        product_name: 'Licuadora Industrial Vaso Vidrio 1.5L',
        quantity: 30,
        boxes: 5,
        warehouse: 'ALMACÉN',
        reference: 'NV-00101',
        user_name: 'Abel (Super Admin)',
        notes: 'Despacho Trans Copacabana'
      },
      {
        id: 2,
        date: `${today} 10:30`,
        type: 'SALIDA',
        product_sku: 'IR2032',
        product_name: 'Juego de Ollas Acero Inoxidable 12 Pzs',
        quantity: 8,
        boxes: 2,
        warehouse: 'ALMACÉN',
        reference: 'NV-00102',
        user_name: 'Daniel Ventas',
        notes: 'Entrega Mercado La Pampa'
      }
    ],
    expenses: [
      {
        id: 1,
        date: today,
        category: 'TRANSPORTE / TAXI',
        description: 'Flete envío cajas a terminal flota La Paz',
        amount: 45,
        payment_method: 'EFECTIVO',
        registered_by: 'Abel (Super Admin)'
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
          { name: 'ELECTRODOMÉSTICOS', value: 262, stock: 262 },
          { name: 'TERMOS & BAZAR', value: 240, stock: 240 },
          { name: 'MENAJE & COCINA', value: 96, stock: 96 }
        ],
        topProducts: state.products.slice(0, 5).map(p => ({
          sku: p.sku,
          name: p.name,
          sold_units: 48,
          revenue_bob: Number(p.box_price || p.sale_price) * 6
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
      category: body.category || 'GENERAL',
      current_stock: Number(body.current_stock || 0),
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
      vip_price: Number(body.vip_price || body.sale_price || 0)
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
      const added = Number(body.units_to_add || body.quantity || 0);
      state.products[idx].current_stock = Number(state.products[idx].current_stock || 0) + added;
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
    return jsonResponse({ success: true, data: state.salesNotes });
  }

  if (path === '/api/sales-notes' && method === 'POST') {
    const isRestock = body.note_type === 'REPOSICION_TIENDA';
    const nextNum = state.salesNotes.length + 101;
    const totalAmount = isRestock ? 0 : Number(body.total_amount || 0);
    const paidAmount = isRestock ? 0 : Number(body.paid_amount || 0);
    const balanceAmount = isRestock ? 0 : Math.max(0, totalAmount - paidAmount);
    const newNote = {
      id: Date.now(),
      note_code: body.note_code || (isRestock ? `REP-${nextNum}` : `NV-00${nextNum}`),
      note_type: body.note_type || 'VENTA',
      date: body.date || today,
      due_date: body.due_date || today,
      customer_name: isRestock ? 'REPOSICIÓN A TIENDA' : body.customer_name || 'CLIENTE GENERAL',
      customer_phone: body.customer_phone || '',
      customer_address: body.customer_address || 'Cochabamba',
      delivery_type: body.delivery_type || 'ENTREGA LOCAL',
      delivery_destination: body.delivery_destination || 'Tienda Central',
      seller_name: body.seller_name || 'Abel (Super Admin)',
      total_boxes: Number(body.total_boxes || 0),
      total_units: Number(body.total_units || 0),
      total_amount: totalAmount,
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
      status: isRestock ? 'EN_CURSO' : balanceAmount <= 0 ? 'PAGADO' : 'PENDIENTE',
      items: body.items || [],
      payments:
        paidAmount > 0
          ? [
              {
                id: Date.now(),
                amount: paidAmount,
                payment_method: body.payment_method || 'EFECTIVO',
                account_info: body.account_info || '',
                payment_date: body.date || today,
                registered_by: body.seller_name || 'Abel (Super Admin)'
              }
            ]
          : []
    };
    state.salesNotes.unshift(newNote);
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
        payment_method: body.payment_method || 'EFECTIVO',
        account_info: body.account_info || '',
        payment_date: body.payment_date || today,
        registered_by: body.registered_by || 'Abel (Super Admin)'
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
      saveDemoState(state);
      return jsonResponse({ success: true, data: state.salesNotes[idx] });
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
      state.salesNotes.splice(idx, 1);
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
        orders: state.dailyOrders
      }
    });
  }

  if (path === '/api/daily-orders' && method === 'POST') {
    const newOrder = {
      id: Date.now(),
      order_date: body.order_date || today,
      shift: body.shift || 'MAÑANA',
      note_code: body.note_code || 'NV-DEMO',
      customer_name: body.customer_name || 'CLIENTE DEMO',
      destination: body.destination || 'Cochabamba',
      boxes_count: Number(body.boxes_count || 1),
      total_amount: Number(body.total_amount || 0),
      paid_amount: Number(body.paid_amount || 0),
      balance_amount: Number(body.balance_amount || 0),
      status: body.status || 'PENDIENTE',
      warehouse_source: body.warehouse_source || 'ALMACÉN'
    };
    state.dailyOrders.unshift(newOrder);
    saveDemoState(state);
    return jsonResponse({ success: true, data: newOrder });
  }

  if (path.startsWith('/api/daily-orders/')) {
    const id = Number(path.split('/')[3]);
    const idx = state.dailyOrders.findIndex(o => Number(o.id) === id);
    if (idx >= 0 && (method === 'PUT' || method === 'POST')) {
      state.dailyOrders[idx] = { ...state.dailyOrders[idx], ...body };
      saveDemoState(state);
      return jsonResponse({ success: true, data: state.dailyOrders[idx] });
    }
    if (idx >= 0 && method === 'DELETE') {
      state.dailyOrders.splice(idx, 1);
      saveDemoState(state);
      return jsonResponse({ success: true });
    }
  }

  // 6. Weekly Dispatches
  if (path.startsWith('/api/weekly-dispatches')) {
    return jsonResponse({
      success: true,
      data: {
        dispatches: state.dailyOrders,
        summary: {
          totalBoxes: state.dailyOrders.reduce((s, o) => s + Number(o.boxes_count || 0), 0),
          totalAmount: state.dailyOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0)
        }
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
      name: body.name || 'NUEVO CLIENTE',
      phone: body.phone || '',
      address: body.address || 'Cochabamba',
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
        product_sku: body.product_sku || 'IR15AV',
        product_name: body.product_name || 'Producto',
        quantity: Number(body.quantity || 1),
        warehouse: body.warehouse || 'ALMACÉN',
        user_name: 'Abel (Super Admin)',
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
          qr_jaime: 6000,
          qr_betho: 0,
          qr_otros: 0,
          total_ingresos: 8000,
          gastos_efectivo: totalExpenses,
          gastos_qr: 0,
          total_gastos: totalExpenses,
          efectivo_neto_caja: 2000 - totalExpenses,
          saldo_total_dia: 8000 - totalExpenses
        },
        payments: [
          {
            id: 1,
            note_code: 'NV-00101',
            customer_name: 'COMERCIAL LA PAZ - SRA. MARTHA',
            amount: 6000,
            payment_method: 'QR',
            account_info: 'CUENTA JAIME',
            registered_by: 'Abel (Super Admin)'
          },
          {
            id: 2,
            note_code: 'NV-00102',
            customer_name: 'DISTRIBUIDORA EL SOL - SR. RAMIRO',
            amount: 2000,
            payment_method: 'EFECTIVO',
            account_info: 'CAJA EFECTIVO',
            registered_by: 'Daniel Ventas'
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
      registered_by: 'Abel (Super Admin)'
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
