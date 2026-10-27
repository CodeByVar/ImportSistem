import http from 'http';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(`http://localhost:3001${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3001${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function testCreateNote() {
  console.log('Testing creation of real note (Erick Garcia - Mercado La Pampa)...');

  // Find products in DB with SKUs matching or similar
  const prods = await get('/api/products?search=TOTAL');
  console.log(`Found ${prods.data?.length} TOTAL products`);

  const p1 = prods.data?.[0] || { id: 1, sku: 'THRTB2712', name: 'BOLSA DE HERRAMIENTAS TOTAL', wholesale_price: 330 };
  const p2 = prods.data?.[1] || { id: 2, sku: 'TWP17506', name: 'BOMBA DE AGUA PERIFERICA 1HP TOTAL', wholesale_price: 530 };

  const testPayload = {
    customer_name: 'ERICK GARCIA',
    customer_phone: '68579599',
    customer_address: 'MERCADO LA PAMPA',
    date: '2026-09-30',
    due_date: '2026-09-30',
    seller_name: 'DANIEL',
    delivery_destination: 'MERCADO LA PAMPA',
    notes: 'Nota oficial de prueba sistema',
    items: [
      {
        product_id: p1.id,
        sku: p1.sku,
        description: p1.name,
        unit_med: 'UNI',
        sale_mode: 'CAJA',
        boxes_count: 2,
        units_per_box: 2,
        unit_price: 330,
        warehouse_source: 'ALMACEN'
      },
      {
        product_id: p2.id,
        sku: p2.sku,
        description: p2.name,
        unit_med: 'UNI',
        sale_mode: 'CAJA',
        boxes_count: 6,
        units_per_box: 1,
        unit_price: 530,
        warehouse_source: 'ALMACEN'
      }
    ],
    payments: [
      { payment_method: 'Efectivo', account_info: 'Efectivo', amount: 2000, payment_date: '2026-09-30' },
      { payment_method: 'Transferencia QR', account_info: 'Cuenta Jaime', amount: 1000, payment_date: '2026-09-30' }
    ]
  };

  const createRes = await post('/api/sales-notes', testPayload);
  console.log('Create Note Response:', createRes);

  const notesList = await get('/api/sales-notes');
  console.log('\nList of Notes after creation:', notesList.data?.map(n => ({
    code: n.note_code,
    client: n.customer_name,
    total: n.total_amount,
    paid: n.paid_amount,
    balance: n.balance_amount,
    status: n.status
  })));

  const fullNote = await get(`/api/sales-notes/${createRes.data?.noteId}`);
  console.log('\nFull Note Details:', {
    code: fullNote.data?.note_code,
    itemsCount: fullNote.data?.items?.length,
    paymentsCount: fullNote.data?.payments?.length
  });
}

testCreateNote();
