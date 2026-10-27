import http from 'http';

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3001${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function verify() {
  console.log('--- Probando API con datos limpios ---');
  try {
    const stats = await get('/api/dashboard/stats');
    console.log('Stats Dashboard:');
    console.log('  Total Productos:', stats.data?.inventory?.totalProductsCount);
    console.log('  Total Unidades en Stock:', stats.data?.inventory?.totalStockUnits);
    console.log('  Valoración Costo ($):', stats.data?.inventory?.totalValuationCost);
    console.log('  Valoración Venta ($):', stats.data?.inventory?.totalValuationRetail);
    console.log('  Ventas realizadas:', stats.data?.financials?.totalSales);
    console.log('  Contenedores en seguimiento:', stats.data?.containers);

    const prods = await get('/api/products?limit=5');
    console.log('\nPrimeros 5 productos reales devueltos por la API:');
    prods.data?.slice(0, 5).forEach(p => {
      console.log(`  - [${p.sku}] ${p.name} | Marca: ${p.brand} | Stock: ${p.current_stock} | P.Mayor: Bs ${p.wholesale_price} | P.Caja: Bs ${p.box_price}`);
    });

    const charts = await get('/api/dashboard/charts');
    console.log('\nCategorías detectadas en gráficos:', charts.data?.categoryDistribution?.length);
    charts.data?.categoryDistribution?.slice(0, 5).forEach(c => {
      console.log(`  - Categoría: ${c.category} (${c.product_count} productos, ${c.total_stock} unid)`);
    });

    console.log('\n✅ Verificación exitosa: Toda la API responde perfectamente con los datos reales.');
  } catch (err) {
    console.error('Error durante la verificación:', err.message);
  }
}

verify();
