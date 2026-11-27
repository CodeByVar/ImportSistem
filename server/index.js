import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDatabase } from './db.js';
import { seedDatabase } from './seed.js';
import { migrateFromBuffer, migrateFromExcelFile } from './migrateSheets.js';
import {
  hashPin,
  verifyPin,
  signToken,
  sanitizeUserForClient,
  sanitizeProductForRole,
  checkLoginRateLimit,
  recordLoginFailure,
  resetLoginFailures,
  apiRateLimiter,
  securityHeaders,
  createCorsOptions,
  createAuthMiddleware,
  requireRoles,
  logSecurityEvent,
  getClientIp
} from './security.js';
import {
  createDatabaseBackup,
  listDatabaseBackups,
  startBackupScheduler
} from './backup.js';

initDatabase();
startBackupScheduler(db);

const app = express();
const PORT = process.env.PORT || 3001;
const requireAuth = createAuthMiddleware(db);

app.disable('x-powered-by');
app.use(securityHeaders);
app.use(cors(createCorsOptions()));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', apiRateLimiter);

// Health Check (Public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', system: 'SISCONTROL Importadora API', timestamp: new Date().toISOString() });
});

// Global API Authentication Gate (Every /api/* route except /health and POST /users/login requires a valid JWT)
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || (req.path === '/users/login' && req.method === 'POST')) {
    return next();
  }
  return requireAuth(req, res, next);
});

// Verify active session & return fresh user profile
app.get('/api/auth/me', (req, res) => {
  res.json({ success: true, data: sanitizeUserForClient(req.user) });
});

// Dashboard Summary KPIs
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const { timeRange } = req.query; // 'all', 'month', 'quarter', 'year'
    let dateFilter = '';
    if (timeRange === 'month') {
      dateFilter = "AND date >= date('now', '-30 days')";
    } else if (timeRange === 'quarter') {
      dateFilter = "AND date >= date('now', '-90 days')";
    } else if (timeRange === 'year') {
      dateFilter = "AND date >= date('now', '-365 days')";
    }

    // 1. Sales & Margins from Outbound movements
    const salesStats = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) AS total_sales,
        COALESCE(SUM(quantity * unit_cost), 0) AS total_cogs,
        COALESCE(SUM(gross_profit), 0) AS gross_profit,
        COALESCE(SUM(quantity), 0) AS total_units_sold,
        COUNT(id) AS total_transactions
      FROM inventory_movements
      WHERE type = 'SALIDA' ${dateFilter}
    `).get();

    // 2. Inbound stats
    const inboundStats = db.prepare(`
      SELECT 
        COALESCE(SUM(quantity), 0) AS total_units_inbound,
        COALESCE(SUM(total_amount), 0) AS total_inbound_value
      FROM inventory_movements
      WHERE type = 'ENTRADA' ${dateFilter}
    `).get();

    // 3. Current Inventory Valuation & Units
    const inventoryValuation = db.prepare(`
      SELECT 
        COALESCE(SUM(current_stock * landed_cost), 0) AS total_inventory_cost,
        COALESCE(SUM(current_stock * sale_price), 0) AS total_inventory_retail_value,
        COALESCE(SUM(current_stock), 0) AS total_stock_units,
        COUNT(id) AS total_products_count
      FROM products
    `).get();

    // 4. Operational Expenses
    let expFilter = '';
    if (timeRange === 'month') expFilter = "WHERE date >= date('now', '-30 days')";
    else if (timeRange === 'quarter') expFilter = "WHERE date >= date('now', '-90 days')";
    else if (timeRange === 'year') expFilter = "WHERE date >= date('now', '-365 days')";

    const expensesStats = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total_expenses
      FROM expenses
      ${expFilter}
    `).get();

    // 5. Stock Alerts Count
    const stockAlerts = db.prepare(`
      SELECT 
        COUNT(CASE WHEN current_stock <= 0 THEN 1 END) AS out_of_stock,
        COUNT(CASE WHEN current_stock > 0 AND current_stock <= min_stock THEN 1 END) AS critical_stock,
        COUNT(CASE WHEN current_stock > min_stock THEN 1 END) AS healthy_stock
      FROM products
    `).get();

    // 6. Containers Overview
    const containersOverview = db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'transito' THEN 1 END) AS in_transit,
        COUNT(CASE WHEN status = 'aduana' THEN 1 END) AS in_customs,
        COUNT(CASE WHEN status = 'recibido' THEN 1 END) AS received
      FROM containers
    `).get();

    const totalSales = salesStats.total_sales;
    const grossProfit = salesStats.gross_profit;
    const totalExpenses = expensesStats.total_expenses;
    const netProfit = grossProfit - totalExpenses;
    const grossMarginPercent = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
    const netMarginPercent = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
    const canSeeFinancialCosts = req.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);

    res.json({
      success: true,
      data: {
        financials: {
          totalSales,
          totalCogs: canSeeFinancialCosts ? salesStats.total_cogs : 0,
          grossProfit: canSeeFinancialCosts ? grossProfit : 0,
          grossMarginPercent: canSeeFinancialCosts ? grossMarginPercent : 0,
          totalExpenses: canSeeFinancialCosts ? totalExpenses : 0,
          netProfit: canSeeFinancialCosts ? netProfit : 0,
          netMarginPercent: canSeeFinancialCosts ? netMarginPercent : 0
        },
        merchandiseFlow: {
          unitsInbound: inboundStats.total_units_inbound,
          inboundValue: canSeeFinancialCosts ? inboundStats.total_inbound_value : 0,
          unitsSold: salesStats.total_units_sold,
          salesTransactions: salesStats.total_transactions,
          netInventoryChange: inboundStats.total_units_inbound - salesStats.total_units_sold
        },
        inventory: {
          totalValuationCost: canSeeFinancialCosts ? inventoryValuation.total_inventory_cost : 0,
          totalValuationRetail: inventoryValuation.total_inventory_retail_value,
          expectedProfitInStock: canSeeFinancialCosts ? (inventoryValuation.total_inventory_retail_value - inventoryValuation.total_inventory_cost) : 0,
          totalStockUnits: inventoryValuation.total_stock_units,
          totalProductsCount: inventoryValuation.total_products_count,
          outOfStockCount: stockAlerts.out_of_stock,
          criticalStockCount: stockAlerts.critical_stock,
          healthyStockCount: stockAlerts.healthy_stock
        },
        containers: containersOverview
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dashboard Charts & Detailed Analytics
app.get('/api/dashboard/charts', (req, res) => {
  try {
    // 1. Monthly Trends (Sales vs COGS vs Gross Profit)
    const monthlyTrends = db.prepare(`
      SELECT 
        strftime('%Y-%m', date) AS month,
        ROUND(SUM(CASE WHEN type = 'SALIDA' THEN total_amount ELSE 0 END), 2) AS sales,
        ROUND(SUM(CASE WHEN type = 'SALIDA' THEN quantity * unit_cost ELSE 0 END), 2) AS cogs,
        ROUND(SUM(CASE WHEN type = 'SALIDA' THEN gross_profit ELSE 0 END), 2) AS profit,
        SUM(CASE WHEN type = 'SALIDA' THEN quantity ELSE 0 END) AS units_sold,
        SUM(CASE WHEN type = 'ENTRADA' THEN quantity ELSE 0 END) AS units_inbound
      FROM inventory_movements
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `).all();

    // 2. Category Distribution (Valuation & Product Count)
    const categoryDistribution = db.prepare(`
      SELECT 
        category,
        COUNT(id) AS product_count,
        SUM(current_stock) AS total_stock,
        ROUND(SUM(current_stock * landed_cost), 2) AS inventory_value,
        ROUND(SUM(current_stock * sale_price), 2) AS retail_value
      FROM products
      GROUP BY category
      ORDER BY inventory_value DESC
    `).all();

    // 3. Top 10 Best-Selling Products by Revenue & Volume
    const topProducts = db.prepare(`
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.category,
        p.current_stock,
        p.landed_cost,
        p.sale_price,
        ROUND(p.sale_price - p.landed_cost, 2) AS margin_unit,
        ROUND(((p.sale_price - p.landed_cost) / p.sale_price) * 100, 1) AS margin_percent,
        COALESCE(SUM(m.quantity), 0) AS units_sold,
        ROUND(COALESCE(SUM(m.total_amount), 0), 2) AS total_revenue,
        ROUND(COALESCE(SUM(m.gross_profit), 0), 2) AS total_profit
      FROM products p
      LEFT JOIN inventory_movements m ON p.id = m.product_id AND m.type = 'SALIDA'
      GROUP BY p.id
      ORDER BY total_revenue DESC
      LIMIT 10
    `).all();

    // 4. Pareto ABC Analysis calculation
    const allProductSales = db.prepare(`
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.category,
        p.current_stock,
        COALESCE(SUM(m.total_amount), 0) AS total_revenue,
        COALESCE(SUM(m.quantity), 0) AS units_sold
      FROM products p
      LEFT JOIN inventory_movements m ON p.id = m.product_id AND m.type = 'SALIDA'
      GROUP BY p.id
      ORDER BY total_revenue DESC
    `).all();

    const grandTotalRevenue = allProductSales.reduce((acc, curr) => acc + curr.total_revenue, 0);
    let cumulative = 0;
    const abcAnalysis = allProductSales.map((item) => {
      cumulative += item.total_revenue;
      const cumPercent = grandTotalRevenue > 0 ? (cumulative / grandTotalRevenue) * 100 : 0;
      let classification = 'A';
      if (cumPercent > 80 && cumPercent <= 95) classification = 'B';
      else if (cumPercent > 95) classification = 'C';

      return {
        ...item,
        revenueSharePercent: grandTotalRevenue > 0 ? Number(((item.total_revenue / grandTotalRevenue) * 100).toFixed(1)) : 0,
        cumPercent: Number(cumPercent.toFixed(1)),
        abcClass: classification
      };
    });

    // 5. Recent Movements (Last 10)
    const recentMovements = db.prepare(`
      SELECT 
        m.id,
        m.type,
        m.quantity,
        m.unit_price,
        m.unit_cost,
        m.total_amount,
        m.gross_profit,
        m.reference,
        m.party_name,
        m.payment_method,
        m.date,
        p.sku,
        p.name AS product_name,
        p.category
      FROM inventory_movements m
      JOIN products p ON m.product_id = p.id
      ORDER BY m.date DESC, m.id DESC
      LIMIT 10
    `).all();

    // 6. Active Containers list
    const containers = db.prepare(`
      SELECT * FROM containers ORDER BY created_at DESC
    `).all();

    res.json({
      success: true,
      data: {
        monthlyTrends,
        categoryDistribution,
        topProducts,
        abcAnalysis,
        recentMovements,
        containers
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard charts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Products CRUD & Filters
app.get('/api/products', (req, res) => {
  try {
    const { search, category, brand, stockStatus } = req.query;
    let query = `
      SELECT 
        p.*,
        ROUND(p.sale_price - p.landed_cost, 2) AS unit_margin,
        ROUND(CASE WHEN p.sale_price > 0 THEN ((p.sale_price - p.landed_cost) / p.sale_price) * 100 ELSE 0 END, 1) AS margin_percentage,
        ROUND(p.current_stock * p.landed_cost, 2) AS stock_total_cost,
        ROUND(p.current_stock * p.sale_price, 2) AS stock_total_retail,
        (
          SELECT COALESCE(SUM(cr.reserved_boxes), 0)
          FROM container_reservations cr
          JOIN container_items ci ON cr.container_item_id = ci.id
          WHERE ci.product_code = p.sku AND cr.status = 'PENDIENTE'
        ) + (
          SELECT COALESCE(SUM(sni.boxes_count), 0)
          FROM sales_note_items sni
          JOIN sales_notes sn ON sni.note_id = sn.id
          WHERE (sni.product_id = p.id OR sni.sku = p.sku) AND sn.status IN ('PRE-RESERVA', 'RESERVA')
        ) AS total_reserved_boxes,
        (
          SELECT COALESCE(SUM(cr.reserved_units), 0)
          FROM container_reservations cr
          JOIN container_items ci ON cr.container_item_id = ci.id
          WHERE ci.product_code = p.sku AND cr.status = 'PENDIENTE'
        ) + (
          SELECT COALESCE(SUM(sni.quantity), 0)
          FROM sales_note_items sni
          JOIN sales_notes sn ON sni.note_id = sn.id
          WHERE (sni.product_id = p.id OR sni.sku = p.sku) AND sn.status IN ('PRE-RESERVA', 'RESERVA')
        ) AS total_reserved_units,
        (
          SELECT GROUP_CONCAT(client_info, ', ')
          FROM (
            SELECT cr.customer_name || ' (' || CAST(ROUND(cr.reserved_boxes, 0) AS INTEGER) || ' cj)' AS client_info, ci.product_code as sku
            FROM container_reservations cr
            JOIN container_items ci ON cr.container_item_id = ci.id
            WHERE cr.status = 'PENDIENTE'
            UNION ALL
            SELECT sn.customer_name || ' (' || CAST(ROUND(sni.boxes_count, 0) AS INTEGER) || ' cj)' AS client_info, COALESCE(sni.sku, '') as sku
            FROM sales_note_items sni
            JOIN sales_notes sn ON sni.note_id = sn.id
            WHERE sn.status IN ('PRE-RESERVA', 'RESERVA')
          ) sub
          WHERE sub.sku = p.sku
        ) AS reserved_clients_summary
      FROM products p
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.supplier LIKE ? OR p.brand LIKE ? OR p.customs_policy LIKE ? OR p.warehouse LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category && category !== 'Todas') {
      query += ` AND p.category = ?`;
      params.push(category);
    }

    if (brand && brand !== 'Todas') {
      query += ` AND p.brand = ?`;
      params.push(brand);
    }

    if (stockStatus === 'critical') {
      query += ` AND p.current_stock <= p.min_stock`;
    } else if (stockStatus === 'out') {
      query += ` AND p.current_stock <= 0`;
    } else if (stockStatus === 'healthy') {
      query += ` AND p.current_stock > p.min_stock`;
    }

    query += ` ORDER BY p.name ASC`;

    const products = db.prepare(query).all(...params);
    const safeProducts = products.map(p => sanitizeProductForRole(p, req.user?.role));
    res.json({ success: true, data: safeProducts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create Product
app.post('/api/products', (req, res) => {
  try {
    const {
      sku,
      name,
      category,
      unit,
      fob_price,
      shipping_cost,
      tariff_cost,
      sale_price,
      current_stock,
      min_stock,
      supplier,
      notes
    } = req.body;

    if (!sku || !name) {
      return res.status(400).json({ success: false, error: 'SKU y Nombre son obligatorios' });
    }

    const landedCost = Number(fob_price || 0) + Number(shipping_cost || 0) + Number(tariff_cost || 0);

    const stmt = db.prepare(`
      INSERT INTO products (
        sku, name, category, unit, fob_price, shipping_cost, tariff_cost, landed_cost,
        sale_price, current_stock, min_stock, supplier, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      sku.trim().toUpperCase(),
      name.trim(),
      category || 'General',
      unit || 'Unidad',
      Number(fob_price || 0),
      Number(shipping_cost || 0),
      Number(tariff_cost || 0),
      landedCost,
      Number(sale_price || 0),
      Number(current_stock || 0),
      Number(min_stock || 10),
      supplier || 'Importación Directa',
      notes || ''
    );

    // If initial stock > 0, record initial inbound movement
    if (Number(current_stock) > 0) {
      db.prepare(`
        INSERT INTO inventory_movements (
          product_id, type, quantity, unit_cost, unit_price, total_amount, gross_profit, reference, party_name, date, notes
        ) VALUES (?, 'ENTRADA', ?, ?, 0, ?, 0, 'STOCK-INICIAL', ?, date('now'), 'Registro de Stock Inicial del Producto')
      `).run(
        result.lastInsertRowid,
        Number(current_stock),
        landedCost,
        Number(current_stock) * landedCost,
        supplier || 'Inventario Inicial'
      );
    }

    res.json({ success: true, id: result.lastInsertRowid, message: 'Producto registrado exitosamente' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, error: 'El código SKU ya existe en la base de datos' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Product (Admin / Super Admin only — supports full wholesale pricing & warehouse fields)
app.put('/api/products/:id', requireRoles('SUPER_ADMIN', 'ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    const {
      sku,
      name,
      category,
      brand,
      unit,
      warehouse,
      units_per_box,
      fob_price,
      shipping_cost,
      tariff_cost,
      sale_price,
      wholesale_price,
      box_price,
      special_price,
      min_stock,
      supplier,
      notes
    } = req.body;

    const nextFob = fob_price !== undefined ? Number(fob_price || 0) : Number(current.fob_price || 0);
    const nextShipping = shipping_cost !== undefined ? Number(shipping_cost || 0) : Number(current.shipping_cost || 0);
    const nextTariff = tariff_cost !== undefined ? Number(tariff_cost || 0) : Number(current.tariff_cost || 0);
    const nextLanded =
      fob_price !== undefined || shipping_cost !== undefined || tariff_cost !== undefined
        ? nextFob + nextShipping + nextTariff
        : Number(current.landed_cost || 0);

    const nextSku = sku ? sku.trim().toUpperCase() : current.sku;
    const nextName = name ? name.trim() : current.name;

    db.prepare(`
      UPDATE products SET
        sku = ?,
        name = ?,
        category = ?,
        brand = ?,
        unit = ?,
        warehouse = ?,
        units_per_box = ?,
        fob_price = ?,
        shipping_cost = ?,
        tariff_cost = ?,
        landed_cost = ?,
        sale_price = ?,
        wholesale_price = ?,
        box_price = ?,
        special_price = ?,
        min_stock = ?,
        supplier = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      nextSku,
      nextName,
      category !== undefined ? category : current.category,
      brand !== undefined ? brand : current.brand,
      unit !== undefined ? unit : current.unit,
      warehouse !== undefined ? warehouse : current.warehouse,
      units_per_box !== undefined ? Math.max(1, Number(units_per_box || 1)) : (current.units_per_box || 1),
      nextFob,
      nextShipping,
      nextTariff,
      nextLanded,
      sale_price !== undefined ? Number(sale_price || 0) : Number(current.sale_price || 0),
      wholesale_price !== undefined ? Number(wholesale_price || 0) : Number(current.wholesale_price || 0),
      box_price !== undefined ? Number(box_price || 0) : Number(current.box_price || 0),
      special_price !== undefined ? Number(special_price || 0) : Number(current.special_price || 0),
      min_stock !== undefined ? Number(min_stock || 0) : Number(current.min_stock || 10),
      supplier !== undefined ? supplier : current.supplier,
      notes !== undefined ? notes : current.notes,
      id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    logSecurityEvent(db, {
      action: 'PRODUCT_UPDATED',
      actorUser: req.user,
      target: nextSku,
      ip: getClientIp(req),
      details: { name: nextName, wholesale_price: updated.wholesale_price, box_price: updated.box_price, special_price: updated.special_price }
    });

    res.json({ success: true, data: updated, message: 'Producto actualizado con éxito' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, error: 'Ya existe otro producto con ese código SKU' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Quick Stock-In (Ingreso rápido de mercadería recién llegada desde el modal de Nota)
app.post('/api/products/:id/quick-stock-in', requireRoles('SUPER_ADMIN', 'ADMIN', 'ALMACEN'), (req, res) => {
  try {
    const { id } = req.params;
    const { boxes_count, units_per_box, quantity, notes } = req.body;
    const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!prod) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    const upb = Math.max(1, parseInt(units_per_box || prod.units_per_box || 1, 10));
    const addedUnits = quantity
      ? parseInt(quantity, 10)
      : Math.max(0, parseInt(boxes_count || 0, 10)) * upb;

    if (!Number.isFinite(addedUnits) || addedUnits <= 0) {
      return res.status(400).json({ success: false, error: 'La cantidad a ingresar debe ser mayor a 0' });
    }

    const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

    const tx = db.transaction(() => {
      db.prepare('UPDATE products SET current_stock = MAX(0, current_stock) + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(addedUnits, id);

      const unitCost = Number(prod.landed_cost || prod.fob_price || 0);
      db.prepare(`
        INSERT INTO inventory_movements (
          product_id, type, quantity, unit_cost, unit_price, total_amount, gross_profit,
          reference, party_name, date, notes
        ) VALUES (?, 'ENTRADA', ?, ?, 0, ?, 0, 'INGRESO-RAPIDO', ?, ?, ?)
      `).run(
        id,
        addedUnits,
        unitCost,
        addedUnits * unitCost,
        `Ingreso Rápido (${req.user?.name || 'USUARIO'})`,
        todayStr,
        notes || `Ingreso rápido de mercadería recién llegada (+${addedUnits} u.)`
      );
    });
    tx();

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    logSecurityEvent(db, {
      action: 'QUICK_STOCK_IN',
      actorUser: req.user,
      target: prod.sku,
      ip: getClientIp(req),
      details: { addedUnits, newStock: updated.current_stock }
    });

    res.json({
      success: true,
      data: sanitizeProductForRole(updated, req.user?.role),
      message: `Ingreso rápido registrado: +${addedUnits} u. (Nuevo stock: ${updated.current_stock} u.)`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Product (Admin / Super Admin only)
app.delete('/api/products/:id', requireRoles('SUPER_ADMIN', 'ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    logSecurityEvent(db, { action: 'PRODUCT_DELETED', actorUser: req.user, target: `product:${id}`, ip: getClientIp(req) });
    res.json({ success: true, message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Movements (Entradas y Salidas)
app.get('/api/movements', (req, res) => {
  try {
    const { type, limit, search } = req.query;
    let query = `
      SELECT 
        m.*,
        p.sku,
        p.name AS product_name,
        p.category
      FROM inventory_movements m
      JOIN products p ON m.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (type && type !== 'TODOS') {
      query += ` AND m.type = ?`;
      params.push(type);
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR m.reference LIKE ? OR m.party_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY m.date DESC, m.id DESC LIMIT ?`;
    params.push(Number(limit) || 100);

    const movements = db.prepare(query).all(...params);
    res.json({ success: true, data: movements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Register Movement (Entrada o Salida)
app.post('/api/movements', (req, res) => {
  const transaction = db.transaction(() => {
    const {
      product_id,
      type, // 'ENTRADA' o 'SALIDA'
      quantity,
      unit_price,
      unit_cost,
      reference,
      party_name,
      payment_method,
      container_id,
      date,
      notes
    } = req.body;

    const qty = Number(quantity);
    if (!product_id || !qty || qty <= 0) {
      throw new Error('Producto y cantidad mayor a cero son requeridos');
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    let totalAmount = 0;
    let grossProfit = 0;
    const landedCost = unit_cost !== undefined && unit_cost !== '' ? Number(unit_cost) : product.landed_cost;
    const salePrice = unit_price !== undefined && unit_price !== '' ? Number(unit_price) : product.sale_price;

    if (type === 'ENTRADA') {
      totalAmount = qty * landedCost;
      // Increment stock
      db.prepare('UPDATE products SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(qty, product_id);
    } else if (type === 'SALIDA') {
      if (product.current_stock < qty) {
        throw new Error(`Stock insuficiente. Stock disponible: ${product.current_stock} unidades`);
      }
      totalAmount = qty * salePrice;
      grossProfit = (salePrice - landedCost) * qty;

      // Decrement stock
      db.prepare('UPDATE products SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(qty, product_id);
    } else {
      throw new Error('Tipo de movimiento inválido (debe ser ENTRADA o SALIDA)');
    }

    const stmt = db.prepare(`
      INSERT INTO inventory_movements (
        product_id, type, quantity, unit_cost, unit_price, total_amount, gross_profit,
        container_id, reference, party_name, payment_method, date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      product_id,
      type,
      qty,
      landedCost,
      salePrice,
      totalAmount,
      grossProfit,
      container_id || null,
      reference || `MOV-${Date.now().toString().slice(-6)}`,
      party_name || (type === 'ENTRADA' ? 'Proveedor' : 'Cliente Mostrador'),
      payment_method || 'Transferencia',
      date || new Date().toISOString().split('T')[0],
      notes || ''
    );

    return { movementId: result.lastInsertRowid, type, quantity: qty, product: product.name };
  });

  try {
    const result = transaction();
    res.json({ success: true, data: result, message: `${result.type} registrada correctamente` });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Batch Entry (Entrada Masiva de Lote desde Excel)
app.post('/api/movements/batch', (req, res) => {
  const { items, reference, party_name, date, container_id } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Se requiere al menos un producto en el lote.' });
  }

  const batchTx = db.transaction(() => {
    const findBySku = db.prepare('SELECT * FROM products WHERE sku = ? COLLATE NOCASE');
    const findById = db.prepare('SELECT * FROM products WHERE id = ?');
    const updateStock = db.prepare('UPDATE products SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const insertMov = db.prepare(`
      INSERT INTO inventory_movements (
        product_id, type, quantity, unit_cost, unit_price, total_amount, gross_profit,
        container_id, reference, party_name, payment_method, date, notes
      ) VALUES (?, 'ENTRADA', ?, ?, ?, ?, 0, ?, ?, ?, 'Transferencia', ?, ?)
    `);

    const results = [];
    let totalUnits = 0;
    let totalInversion = 0;
    const batchDate = date || new Date().toISOString().split('T')[0];
    const batchRef = reference || `LOTE-${Date.now().toString().slice(-6)}`;

    for (const item of items) {
      const product = item.product_id
        ? findById.get(Number(item.product_id))
        : (item.sku ? findBySku.get(item.sku.toString().trim().toUpperCase()) : null);

      if (!product) {
        results.push({ sku: item.sku || item.product_id, status: 'NOT_FOUND', error: 'Producto no encontrado en catálogo' });
        continue;
      }

      const qty = Math.max(1, parseInt(item.quantity || item.total_units || 1, 10));
      const unitCost = parseFloat(item.unit_cost || item.costo || product.landed_cost || 0);
      const totalAmt = qty * unitCost;

      updateStock.run(qty, product.id);
      insertMov.run(
        product.id,
        qty,
        unitCost,
        product.sale_price || 0,
        totalAmt,
        container_id ? Number(container_id) : null,
        batchRef,
        party_name || 'Proveedor / Fábrica',
        batchDate,
        item.notes || `Entrada lote ${batchRef}: +${qty} ${product.unit || 'u'}`
      );

      totalUnits += qty;
      totalInversion += totalAmt;

      results.push({
        sku: product.sku,
        name: product.name,
        quantity: qty,
        unit_cost: unitCost,
        total: totalAmt,
        status: 'OK'
      });
    }

    const okCount = results.filter(r => r.status === 'OK').length;
    const notFoundCount = results.filter(r => r.status === 'NOT_FOUND').length;

    return { results, totalUnits, totalInversion, okCount, notFoundCount };
  });

  try {
    const result = batchTx();
    res.json({
      success: true,
      data: result,
      message: `Lote procesado: ${result.okCount} productos ingresados (${result.totalUnits} unidades, inversión $${result.totalInversion.toFixed(2)}). ${result.notFoundCount > 0 ? `${result.notFoundCount} SKU no encontrados.` : ''}`
    });
  } catch (err) {
    console.error('Error en entrada batch:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to calculate exact days range for a given weekCode or mondayDate
function getWeekDaysRange(weekCode, mondayDate) {
  let monday;
  if (mondayDate && /^\d{4}-\d{2}-\d{2}$/.test(mondayDate)) {
    const [y, m, d] = mondayDate.split('-').map(Number);
    monday = new Date(y, m - 1, d);
  } else if (weekCode && /^\d{4}-W\d{1,2}$/.test(weekCode)) {
    const [year, weekStr] = weekCode.split('-W');
    const simple = new Date(Number(year), 0, 1 + (Number(weekStr) - 1) * 7);
    const dayOfWeek = simple.getDay();
    const diff = simple.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    monday = new Date(simple.setDate(diff));
  } else {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    monday = new Date(d.setDate(diff));
  }

  const days = [];
  const dayNames = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
  const dayKeys = ['qty_l', 'qty_m', 'qty_mi', 'qty_j', 'qty_v', 'qty_s'];
  const daysInfo = [];

  for (let i = 0; i < 6; i++) {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    days.push(iso);
    daysInfo.push({
      key: dayKeys[i],
      dayName: dayNames[i],
      dateIso: iso,
      dateShort: `${d}/${m}`,
      dayIndex: i + 1
    });
  }

  return {
    monday: days[0],
    saturday: days[5],
    daysList: days,
    daysInfo
  };
}

// Weekly Dispatches Matrix API (L M M J V S) — Auto-sincronizado con notas de venta reales
app.get('/api/weekly-dispatches', (req, res) => {
  try {
    const { weekCode, mondayDate, brand, search, onlyDispatched, limit = 100, offset = 0 } = req.query;
    const targetWeek = weekCode || 'CURRENT';
    const weekRange = getWeekDaysRange(targetWeek, mondayDate);
    const [dL, dM, dMi, dJ, dV, dS] = weekRange.daysList;

    let query = `
      WITH weekly_sales AS (
        SELECT 
          sni.product_id,
          SUM(CASE WHEN COALESCE(strftime('%Y-%m-%d', sn.delivered_at), sn.date) = ? THEN sni.quantity ELSE 0 END) AS auto_qty_l,
          SUM(CASE WHEN COALESCE(strftime('%Y-%m-%d', sn.delivered_at), sn.date) = ? THEN sni.quantity ELSE 0 END) AS auto_qty_m,
          SUM(CASE WHEN COALESCE(strftime('%Y-%m-%d', sn.delivered_at), sn.date) = ? THEN sni.quantity ELSE 0 END) AS auto_qty_mi,
          SUM(CASE WHEN COALESCE(strftime('%Y-%m-%d', sn.delivered_at), sn.date) = ? THEN sni.quantity ELSE 0 END) AS auto_qty_j,
          SUM(CASE WHEN COALESCE(strftime('%Y-%m-%d', sn.delivered_at), sn.date) = ? THEN sni.quantity ELSE 0 END) AS auto_qty_v,
          SUM(CASE WHEN COALESCE(strftime('%Y-%m-%d', sn.delivered_at), sn.date) = ? THEN sni.quantity ELSE 0 END) AS auto_qty_s,
          SUM(sni.quantity) AS auto_total_sold,
          SUM(sni.quantity * sni.unit_price) AS auto_total_revenue,
          ROUND(AVG(sni.unit_price), 2) AS auto_avg_price,
          MIN(sni.unit_price) AS auto_min_price,
          MAX(sni.unit_price) AS auto_max_price,
          GROUP_CONCAT(sn.note_code || ' (' || sni.quantity || 'u @ Bs' || ROUND(sni.unit_price, 2) || ')', ' | ') AS notes_summary
        FROM sales_note_items sni
        JOIN sales_notes sn ON sni.note_id = sn.id
        WHERE sn.date >= ? AND sn.date <= ?
          AND sn.status != 'ANULADO'
          AND (
            sn.delivery_status = 'ENTREGADO'
            OR EXISTS (
              SELECT 1 FROM daily_dispatch_orders ddo 
              WHERE ddo.sales_note_id = sn.id AND ddo.status = 'ENTREGADO'
            )
          )
        GROUP BY sni.product_id
      )
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.brand,
        p.category,
        p.warehouse,
        p.unit,
        p.current_stock,
        p.min_stock,
        p.wholesale_price,
        p.sale_price,
        p.box_price,
        p.special_price,
        p.boxes_count,
        p.units_per_box,
        -- Cantidades automáticas directas de las notas de venta con entrega confirmada
        COALESCE(ws.auto_qty_l, 0) AS auto_qty_l,
        COALESCE(ws.auto_qty_m, 0) AS auto_qty_m,
        COALESCE(ws.auto_qty_mi, 0) AS auto_qty_mi,
        COALESCE(ws.auto_qty_j, 0) AS auto_qty_j,
        COALESCE(ws.auto_qty_v, 0) AS auto_qty_v,
        COALESCE(ws.auto_qty_s, 0) AS auto_qty_s,
        COALESCE(ws.auto_total_sold, 0) AS auto_total_sold,
        COALESCE(ws.auto_total_revenue, 0) AS auto_total_revenue,
        ws.auto_avg_price,
        ws.auto_min_price,
        ws.auto_max_price,
        ws.notes_summary,
        -- Cantidades efectivas para visualización (toma lo confirmado automáticamente)
        COALESCE(w.qty_l, ws.auto_qty_l, 0) AS qty_l,
        COALESCE(w.qty_m, ws.auto_qty_m, 0) AS qty_m,
        COALESCE(w.qty_mi, ws.auto_qty_mi, 0) AS qty_mi,
        COALESCE(w.qty_j, ws.auto_qty_j, 0) AS qty_j,
        COALESCE(w.qty_v, ws.auto_qty_v, 0) AS qty_v,
        COALESCE(w.qty_s, ws.auto_qty_s, 0) AS qty_s,
        COALESCE(w.qty_reservas, 0) AS qty_reservas,
        (
          COALESCE(w.qty_l, ws.auto_qty_l, 0) +
          COALESCE(w.qty_m, ws.auto_qty_m, 0) +
          COALESCE(w.qty_mi, ws.auto_qty_mi, 0) +
          COALESCE(w.qty_j, ws.auto_qty_j, 0) +
          COALESCE(w.qty_v, ws.auto_qty_v, 0) +
          COALESCE(w.qty_s, ws.auto_qty_s, 0) +
          COALESCE(w.qty_reservas, 0)
        ) AS total_week
      FROM products p
      LEFT JOIN weekly_sales ws ON p.id = ws.product_id
      LEFT JOIN weekly_dispatches w ON p.id = w.product_id AND w.week_code = ?
      WHERE 1=1
    `;

    const params = [
      dL, dM, dMi, dJ, dV, dS,
      dL, dS,
      targetWeek
    ];

    if (onlyDispatched === 'true') {
      query += ` AND (COALESCE(ws.auto_total_sold, 0) > 0 OR COALESCE(w.total_week, 0) > 0)`;
    }

    if (brand && brand !== 'Todas') {
      query += ` AND p.brand = ?`;
      params.push(brand);
    }
    if (search) {
      query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.warehouse LIKE ? OR p.brand LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY 
      CASE WHEN (COALESCE(ws.auto_total_sold, 0) > 0 OR COALESCE(w.total_week, 0) > 0) THEN 0 ELSE 1 END,
      p.name ASC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = db.prepare(query).all(...params);

    // Count query
    let countQuery = `
      WITH weekly_sales AS (
        SELECT 
          sni.product_id,
          SUM(sni.quantity) AS auto_total_sold
        FROM sales_note_items sni
        JOIN sales_notes sn ON sni.note_id = sn.id
        WHERE sn.date >= ? AND sn.date <= ?
          AND sn.status != 'ANULADO'
          AND (
            sn.delivery_status = 'ENTREGADO'
            OR EXISTS (
              SELECT 1 FROM daily_dispatch_orders ddo 
              WHERE ddo.sales_note_id = sn.id AND ddo.status = 'ENTREGADO'
            )
          )
        GROUP BY sni.product_id
      )
      SELECT COUNT(*) as count 
      FROM products p
      LEFT JOIN weekly_sales ws ON p.id = ws.product_id
      LEFT JOIN weekly_dispatches w ON p.id = w.product_id AND w.week_code = ?
      WHERE 1=1
    `;
    const countParams = [dL, dS, targetWeek];

    if (onlyDispatched === 'true') {
      countQuery += ` AND (COALESCE(ws.auto_total_sold, 0) > 0 OR COALESCE(w.total_week, 0) > 0)`;
    }
    if (brand && brand !== 'Todas') {
      countQuery += ` AND p.brand = ?`;
      countParams.push(brand);
    }
    if (search) {
      countQuery += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.warehouse LIKE ? OR p.brand LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const totalCount = db.prepare(countQuery).get(...countParams).count;

    // Resumen KPI global de entregas confirmadas
    const kpiDelivered = db.prepare(`
      SELECT 
        COUNT(DISTINCT sni.product_id) as total_products_sold,
        COALESCE(SUM(sni.quantity), 0) as total_units_sold,
        COALESCE(SUM(sni.quantity * sni.unit_price), 0) as total_revenue_sold
      FROM sales_note_items sni
      JOIN sales_notes sn ON sni.note_id = sn.id
      WHERE sn.date >= ? AND sn.date <= ?
        AND sn.status != 'ANULADO'
        AND (
          sn.delivery_status = 'ENTREGADO'
          OR EXISTS (
            SELECT 1 FROM daily_dispatch_orders ddo 
            WHERE ddo.sales_note_id = sn.id AND ddo.status = 'ENTREGADO'
          )
        )
    `).get(dL, dS) || { total_products_sold: 0, total_units_sold: 0, total_revenue_sold: 0 };

    // Resumen KPI de pedidos en preparación / pendientes de entrega
    const kpiPending = db.prepare(`
      SELECT 
        COUNT(DISTINCT sni.product_id) as total_products_pending,
        COALESCE(SUM(sni.quantity), 0) as total_units_pending
      FROM sales_note_items sni
      JOIN sales_notes sn ON sni.note_id = sn.id
      WHERE sn.date >= ? AND sn.date <= ?
        AND sn.status != 'ANULADO'
        AND (
          sn.delivery_status != 'ENTREGADO'
          AND NOT EXISTS (
            SELECT 1 FROM daily_dispatch_orders ddo 
            WHERE ddo.sales_note_id = sn.id AND ddo.status = 'ENTREGADO'
          )
        )
    `).get(dL, dS) || { total_products_pending: 0, total_units_pending: 0 };

    res.json({ 
      success: true, 
      data: rows, 
      total: totalCount,
      weekRange,
      kpiSummary: {
        totalProductsSold: kpiDelivered.total_products_sold,
        totalUnitsSold: kpiDelivered.total_units_sold,
        totalRevenueSold: kpiDelivered.total_revenue_sold,
        totalProductsPending: kpiPending.total_products_pending,
        totalUnitsPending: kpiPending.total_units_pending
      }
    });
  } catch (err) {
    console.error('Error in /api/weekly-dispatches:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sincronización automática de despachos semanales desde notas de venta con ENTREGA CONFIRMADA
app.post('/api/weekly-dispatches/sync-from-sales', (req, res) => {
  try {
    const { weekCode, mondayDate } = req.body;
    const targetWeek = weekCode || 'CURRENT';
    const weekRange = getWeekDaysRange(targetWeek, mondayDate);
    const [dL, dM, dMi, dJ, dV, dS] = weekRange.daysList;

    const salesQuery = `
      SELECT 
        sni.product_id,
        SUM(CASE WHEN COALESCE(strftime('%Y-%m-%d', sn.delivered_at), sn.date) = ? THEN sni.quantity ELSE 0 END) AS qty_l,
        SUM(CASE WHEN COALESCE(strftime('%Y-%m-%d', sn.delivered_at), sn.date) = ? THEN sni.quantity ELSE 0 END) AS qty_m,
        SUM(CASE WHEN COALESCE(strftime('%Y-%m-%d', sn.delivered_at), sn.date) = ? THEN sni.quantity ELSE 0 END) AS qty_mi,
        SUM(CASE WHEN COALESCE(strftime('%Y-%m-%d', sn.delivered_at), sn.date) = ? THEN sni.quantity ELSE 0 END) AS qty_j,
        SUM(CASE WHEN COALESCE(strftime('%Y-%m-%d', sn.delivered_at), sn.date) = ? THEN sni.quantity ELSE 0 END) AS qty_v,
        SUM(CASE WHEN COALESCE(strftime('%Y-%m-%d', sn.delivered_at), sn.date) = ? THEN sni.quantity ELSE 0 END) AS qty_s,
        SUM(sni.quantity) AS total_sold
      FROM sales_note_items sni
      JOIN sales_notes sn ON sni.note_id = sn.id
      WHERE sn.date >= ? AND sn.date <= ?
        AND sn.status != 'ANULADO'
        AND (
          sn.delivery_status = 'ENTREGADO'
          OR EXISTS (
            SELECT 1 FROM daily_dispatch_orders ddo 
            WHERE ddo.sales_note_id = sn.id AND ddo.status = 'ENTREGADO'
          )
        )
      GROUP BY sni.product_id
    `;

    const salesRows = db.prepare(salesQuery).all(dL, dM, dMi, dJ, dV, dS, dL, dS);

    const syncTx = db.transaction(() => {
      const upsertStmt = db.prepare(`
        INSERT INTO weekly_dispatches (
          week_code, product_id, qty_l, qty_m, qty_mi, qty_j, qty_v, qty_s, qty_reservas, total_week, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(week_code, product_id) DO UPDATE SET
          qty_l = excluded.qty_l,
          qty_m = excluded.qty_m,
          qty_mi = excluded.qty_mi,
          qty_j = excluded.qty_j,
          qty_v = excluded.qty_v,
          qty_s = excluded.qty_s,
          total_week = excluded.qty_l + excluded.qty_m + excluded.qty_mi + excluded.qty_j + excluded.qty_v + excluded.qty_s + weekly_dispatches.qty_reservas,
          updated_at = CURRENT_TIMESTAMP
      `);

      const updateWeeklySalesStmt = db.prepare(`
        UPDATE products SET weekly_sales = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `);

      let count = 0;
      let totalUnits = 0;

      for (const r of salesRows) {
        const total = r.qty_l + r.qty_m + r.qty_mi + r.qty_j + r.qty_v + r.qty_s;
        upsertStmt.run(targetWeek, r.product_id, r.qty_l, r.qty_m, r.qty_mi, r.qty_j, r.qty_v, r.qty_s, total);
        updateWeeklySalesStmt.run(total, r.product_id);
        count++;
        totalUnits += total;
      }

      return { count, totalUnits };
    });

    const result = syncTx();
    res.json({
      success: true,
      count: result.count,
      totalUnits: result.totalUnits,
      message: `Sincronizados automáticamente ${result.count} productos (${result.totalUnits} unidades entregadas) con entregas confirmadas.`
    });
  } catch (err) {
    console.error('Error syncing weekly dispatches from sales:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/weekly-dispatches/save', (req, res) => {
  const { weekCode, mondayDate, items, deductStock = false } = req.body;
  if (!weekCode || !items || !Array.isArray(items)) {
    return res.status(400).json({ success: false, error: 'Datos incompletos para guardar la planilla' });
  }

  const transaction = db.transaction(() => {
    const getProductStmt = db.prepare('SELECT * FROM products WHERE id = ?');
    const getExistingDispatchStmt = db.prepare('SELECT * FROM weekly_dispatches WHERE week_code = ? AND product_id = ?');
    const upsertDispatchStmt = db.prepare(`
      INSERT INTO weekly_dispatches (
        week_code, product_id, qty_l, qty_m, qty_mi, qty_j, qty_v, qty_s, qty_reservas, total_week, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(week_code, product_id) DO UPDATE SET
        qty_l = excluded.qty_l,
        qty_m = excluded.qty_m,
        qty_mi = excluded.qty_mi,
        qty_j = excluded.qty_j,
        qty_v = excluded.qty_v,
        qty_s = excluded.qty_s,
        qty_reservas = excluded.qty_reservas,
        total_week = excluded.total_week,
        updated_at = CURRENT_TIMESTAMP
    `);

    const updateStatsOnlyStmt = db.prepare(`
      UPDATE products SET
        weekly_sales = ?,
        reserved_stock = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const updateStockStmt = db.prepare(`
      UPDATE products SET
        current_stock = current_stock - ?,
        weekly_sales = ?,
        reserved_stock = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const insertMovementStmt = db.prepare(`
      INSERT INTO inventory_movements (
        product_id, type, quantity, unit_cost, unit_price, total_amount, gross_profit,
        reference, party_name, payment_method, date, notes
      ) VALUES (?, 'SALIDA', ?, ?, ?, ?, ?, ?, ?, 'Contado/Mostrador', ?, ?)
    `);

    let totalUnitsDelta = 0;
    let itemsUpdated = 0;

    for (const item of items) {
      const pId = Number(item.product_id);
      const prod = getProductStmt.get(pId);
      if (!prod) continue;

      const l = Math.max(0, parseInt(item.qty_l || 0, 10));
      const m = Math.max(0, parseInt(item.qty_m || 0, 10));
      const mi = Math.max(0, parseInt(item.qty_mi || 0, 10));
      const j = Math.max(0, parseInt(item.qty_j || 0, 10));
      const v = Math.max(0, parseInt(item.qty_v || 0, 10));
      const s = Math.max(0, parseInt(item.qty_s || 0, 10));
      const res = Math.max(0, parseInt(item.qty_reservas || 0, 10));

      const newTotalWeek = l + m + mi + j + v + s + res;
      const existing = getExistingDispatchStmt.get(weekCode, pId);
      const prevTotalWeek = existing ? existing.total_week : 0;
      const deltaStockToDeduct = newTotalWeek - prevTotalWeek;

      if (existing &&
          existing.qty_l === l &&
          existing.qty_m === m &&
          existing.qty_mi === mi &&
          existing.qty_j === j &&
          existing.qty_v === v &&
          existing.qty_s === s &&
          existing.qty_reservas === res) {
        continue;
      }

      upsertDispatchStmt.run(weekCode, pId, l, m, mi, j, v, s, res, newTotalWeek);

      if (deductStock && deltaStockToDeduct !== 0) {
        updateStockStmt.run(deltaStockToDeduct, newTotalWeek, res, pId);
        totalUnitsDelta += deltaStockToDeduct;

        if (deltaStockToDeduct > 0) {
          const price = prod.wholesale_price || prod.sale_price;
          const cost = prod.landed_cost;
          const totalAmt = deltaStockToDeduct * price;
          const profit = (price - cost) * deltaStockToDeduct;

          insertMovementStmt.run(
            pId,
            deltaStockToDeduct,
            cost,
            price,
            totalAmt,
            profit,
            `DESP-${weekCode}`,
            'Despacho Planilla Semanal',
            mondayDate || new Date().toISOString().split('T')[0],
            `Despachos L-M-M-J-V-S (${weekCode}): L:${l} M:${m} M:${mi} J:${j} V:${v} S:${s} Res:${res}`
          );
        }
      } else {
        updateStatsOnlyStmt.run(newTotalWeek, res, pId);
      }

      itemsUpdated++;
    }

    return { itemsUpdated, totalUnitsDelta };
  });

  try {
    const result = transaction();
    res.json({
      success: true,
      data: result,
      message: `Planilla guardada: ${result.itemsUpdated} productos actualizados (${result.totalUnitsDelta >= 0 ? '-' : '+'}${Math.abs(result.totalUnitsDelta)} unidades ajustadas en stock).`
    });
  } catch (err) {
    console.error('Error saving weekly dispatches:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Containers & Prelistas API
app.get('/api/containers', (req, res) => {
  try {
    const containers = db.prepare(`
      SELECT 
        c.*,
        COALESCE(SUM(m.quantity), 0) AS total_units_received,
        (SELECT COUNT(*) FROM container_items ci WHERE ci.container_id = c.id) AS total_items,
        (SELECT COALESCE(SUM(ci.boxes_count), 0) FROM container_items ci WHERE ci.container_id = c.id) AS total_boxes,
        (SELECT COALESCE(SUM(ci.total_units), 0) FROM container_items ci WHERE ci.container_id = c.id) AS total_prelist_units,
        (SELECT COALESCE(SUM(cr.reserved_boxes), 0) FROM container_reservations cr WHERE cr.container_id = c.id AND cr.status != 'CANCELADO') AS total_reserved_boxes
      FROM containers c
      LEFT JOIN inventory_movements m ON c.id = m.container_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all();
    res.json({ success: true, data: containers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/containers', (req, res) => {
  try {
    const {
      tracking_number,
      origin_country,
      shipping_line,
      status,
      departure_date,
      estimated_arrival,
      transport_type,
      truck_plate,
      truck_driver,
      port_name,
      port_arrival_date,
      warehouse_arrival_date,
      total_cbm,
      total_fob,
      total_freight,
      total_taxes,
      notes
    } = req.body;

    if (!tracking_number || !tracking_number.trim()) {
      return res.status(400).json({ success: false, error: 'Identificador / N° Contenedor / Placa es requerido' });
    }

    const stmt = db.prepare(`
      INSERT INTO containers (
        tracking_number, origin_country, shipping_line, status, departure_date, estimated_arrival,
        transport_type, truck_plate, truck_driver, port_name, port_arrival_date, warehouse_arrival_date,
        total_cbm, total_fob, total_freight, total_taxes, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      tracking_number.trim().toUpperCase(),
      origin_country || (transport_type === 'TERRESTRE' ? 'Frontera / Terrestre' : 'China (Ningbo)'),
      shipping_line || (transport_type === 'TERRESTRE' ? 'Transporte Terrestre' : 'MSC Mediterranean Shipping'),
      status || (transport_type === 'TERRESTRE' ? 'camion_transito' : 'mar_transito'),
      departure_date || null,
      estimated_arrival || null,
      transport_type || 'MARITIMO',
      truck_plate || '',
      truck_driver || '',
      port_name || (transport_type === 'MARITIMO' ? 'Arica (Chile)' : ''),
      port_arrival_date || null,
      warehouse_arrival_date || null,
      Number(total_cbm || 0),
      Number(total_fob || 0),
      Number(total_freight || 0),
      Number(total_taxes || 0),
      notes || ''
    );

    res.json({ success: true, id: result.lastInsertRowid, message: 'Embarque/Contenedor registrado exitosamente' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put('/api/containers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      tracking_number,
      origin_country,
      shipping_line,
      status,
      departure_date,
      estimated_arrival,
      transport_type,
      truck_plate,
      truck_driver,
      port_name,
      port_arrival_date,
      warehouse_arrival_date,
      actual_arrival,
      total_cbm,
      total_fob,
      total_freight,
      total_taxes,
      notes
    } = req.body;

    const stmt = db.prepare(`
      UPDATE containers SET
        tracking_number = COALESCE(?, tracking_number),
        origin_country = COALESCE(?, origin_country),
        shipping_line = COALESCE(?, shipping_line),
        status = COALESCE(?, status),
        departure_date = COALESCE(?, departure_date),
        estimated_arrival = COALESCE(?, estimated_arrival),
        transport_type = COALESCE(?, transport_type),
        truck_plate = COALESCE(?, truck_plate),
        truck_driver = COALESCE(?, truck_driver),
        port_name = COALESCE(?, port_name),
        port_arrival_date = COALESCE(?, port_arrival_date),
        warehouse_arrival_date = COALESCE(?, warehouse_arrival_date),
        actual_arrival = COALESCE(?, actual_arrival),
        total_cbm = COALESCE(?, total_cbm),
        total_fob = COALESCE(?, total_fob),
        total_freight = COALESCE(?, total_freight),
        total_taxes = COALESCE(?, total_taxes),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `);

    stmt.run(
      tracking_number ? tracking_number.trim().toUpperCase() : null,
      origin_country,
      shipping_line,
      status,
      departure_date,
      estimated_arrival,
      transport_type,
      truck_plate,
      truck_driver,
      port_name,
      port_arrival_date,
      warehouse_arrival_date,
      actual_arrival,
      total_cbm !== undefined ? Number(total_cbm) : null,
      total_fob !== undefined ? Number(total_fob) : null,
      total_freight !== undefined ? Number(total_freight) : null,
      total_taxes !== undefined ? Number(total_taxes) : null,
      notes,
      id
    );

    res.json({ success: true, message: 'Embarque actualizado' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/containers/:id', requireRoles('SUPER_ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM container_reservations WHERE container_id = ?').run(id);
    db.prepare('DELETE FROM container_items WHERE container_id = ?').run(id);
    db.prepare('DELETE FROM containers WHERE id = ?').run(id);
    logSecurityEvent(db, { action: 'CONTAINER_DELETED', actorUser: req.user, target: `container:${id}`, ip: getClientIp(req) });
    res.json({ success: true, message: 'Embarque eliminado' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Container Prelista Items
app.get('/api/containers/:id/items', (req, res) => {
  try {
    const { id } = req.params;
    const items = db.prepare(`
      SELECT 
        ci.*,
        p.current_stock AS current_physical_stock,
        (SELECT COALESCE(SUM(cr.reserved_boxes), 0) FROM container_reservations cr WHERE cr.container_item_id = ci.id AND cr.status != 'CANCELADO') AS live_reserved_boxes
      FROM container_items ci
      LEFT JOIN products p ON ci.product_id = p.id OR (ci.product_id IS NULL AND p.sku = ci.product_code)
      WHERE ci.container_id = ?
      ORDER BY ci.item_number ASC, ci.id ASC
    `).all(id);

    const reservations = db.prepare(`
      SELECT cr.*, ci.product_code, ci.product_name
      FROM container_reservations cr
      JOIN container_items ci ON cr.container_item_id = ci.id
      WHERE cr.container_id = ?
      ORDER BY cr.created_at DESC
    `).all(id);

    res.json({ success: true, items, reservations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/containers/:id/items/bulk', (req, res) => {
  try {
    const { id } = req.params;
    const { items, replaceExisting } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'No se enviaron filas de prelista' });
    }

    const container = db.prepare('SELECT id, tracking_number FROM containers WHERE id = ?').get(id);
    if (!container) {
      return res.status(404).json({ success: false, error: 'Contenedor no encontrado' });
    }

    const insertTransaction = db.transaction(() => {
      if (replaceExisting) {
        db.prepare('DELETE FROM container_reservations WHERE container_id = ?').run(id);
        db.prepare('DELETE FROM container_items WHERE container_id = ?').run(id);
      }

      const findProductStmt = db.prepare('SELECT id FROM products WHERE sku = ? LIMIT 1');
      const insertItemStmt = db.prepare(`
        INSERT INTO container_items (
          container_id, item_number, product_id, product_code, product_name,
          boxes_count, units_per_box, total_units, unit_measure, unit_cost,
          previous_cost, previous_price, margin_percent, price_mayor, price_caja, price_special,
          price_discount_25, price_adjustment_20, reserved_boxes, notes, order_confirmed_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let count = 0;
      for (const it of items) {
        const code = String(it.code || it.CODIGO || it.product_code || '').trim().toUpperCase();
        const name = String(it.name || it.DETALLE || it.product_name || '').trim();
        if (!code && !name) continue;

        const existingProd = code ? findProductStmt.get(code) : null;
        const boxes = parseFloat(it.boxes || it.Q_DE_CAJAS || it.boxes_count) || 0;
        const perBox = parseFloat(it.perBox || it.Q_POR_CAJA || it.units_per_box) || 1;
        const totalUnits = parseFloat(it.totalUnits || it.total_units) || (boxes * perBox);
        const cost = parseFloat(it.cost || it.COSTO || it.unit_cost) || 0;
        const prevCost = parseFloat(it.previous_cost || it.previousCost || it.costoAnt || it.COSTO_ANT || it['COSTO ANT.'] || it.costo_ant) || 0;
        const prevPrice = parseFloat(it.previous_price || it.previousPrice || it.precioAnt || it.PRECIO_ANT || it['PRECIO ANT.'] || it.precio_ant) || 0;
        const margin = parseFloat(it.margin || it['%'] || it.margin_percent) || 0;
        const pMayor = parseFloat(it.priceMayor || it.PRECIO_MAYOR || it.price_mayor) || 0;
        const pCaja = parseFloat(it.priceCaja || it.PRECIO_CAJA || it.price_caja) || 0;
        const pEsp = parseFloat(it.priceSpecial || it.PRECIO_ESPECIAL || it.price_special) || 0;
        const pDesc = parseFloat(it.priceDesc25 || it.CON_DECUENTO_25 || it.price_discount_25) || 0;
        const pAj = parseFloat(it.priceAjuste20 || it.AJUSTE_POR_CAJA || it.price_adjustment_20) || 0;
        const resv = parseFloat(it.reserved || it.RESERVA || it.reserved_boxes) || 0;
        const obs = String(it.notes || it.OBSERVACIONES || '').trim();
        const num = parseInt(it.num || it.Nº || it.item_number) || (count + 1);
        const confDate = it.order_confirmed_date || new Date().toISOString();

        insertItemStmt.run(
          id,
          num,
          existingProd ? existingProd.id : null,
          code,
          name,
          boxes,
          perBox,
          totalUnits,
          it.measure || it['UN/MED'] || 'UNI',
          cost,
          prevCost,
          prevPrice,
          margin,
          pMayor,
          pCaja,
          pEsp,
          pDesc,
          pAj,
          resv,
          obs,
          confDate
        );
        count++;
      }
      return count;
    });

    const savedCount = insertTransaction();
    res.json({ success: true, count: savedCount, message: `Se cargaron ${savedCount} productos a la prelista` });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Pre-Reservas en Contenedor
app.post('/api/containers/:id/reserve', (req, res) => {
  try {
    const { id } = req.params;
    const {
      container_item_id,
      customer_name,
      customer_phone,
      reserved_boxes,
      reserved_units,
      price_agreed,
      notes
    } = req.body;

    if (!container_item_id || !customer_name || !reserved_boxes) {
      return res.status(400).json({ success: false, error: 'Faltan datos obligatorios (Item, Cliente y Cantidad de cajas)' });
    }

    const item = db.prepare('SELECT * FROM container_items WHERE id = ? AND container_id = ?').get(container_item_id, id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item de prelista no encontrado' });
    }

    const boxes = Number(reserved_boxes);
    const units = reserved_units ? Number(reserved_units) : (boxes * (item.units_per_box || 1));

    const reserveTx = db.transaction(() => {
      const resStmt = db.prepare(`
        INSERT INTO container_reservations (
          container_id, container_item_id, customer_name, customer_phone,
          reserved_boxes, reserved_units, price_agreed, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?)
      `);
      const rResult = resStmt.run(
        id,
        container_item_id,
        customer_name.trim().toUpperCase(),
        customer_phone || '',
        boxes,
        units,
        Number(price_agreed || item.price_caja || item.price_mayor || 0),
        notes || ''
      );

      // Actualizar live reserved_boxes en container_items
      const sumRes = db.prepare(`
        SELECT COALESCE(SUM(reserved_boxes), 0) as s FROM container_reservations 
        WHERE container_item_id = ? AND status != 'CANCELADO'
      `).get(container_item_id);
      db.prepare('UPDATE container_items SET reserved_boxes = ? WHERE id = ?').run(sumRes.s, container_item_id);

      return rResult.lastInsertRowid;
    });

    const resId = reserveTx();
    res.json({ success: true, id: resId, message: 'Pre-reserva registrada con éxito' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Bulk Pre-Reservas (Múltiples productos para un mismo cliente)
app.post('/api/containers/:id/reservations/bulk', (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, customer_phone, notes, items } = req.body;

    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ success: false, error: 'El nombre del cliente es obligatorio' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Debes agregar al menos un producto a la reserva' });
    }

    const bulkTx = db.transaction(() => {
      const inserted = [];
      const insertStmt = db.prepare(`
        INSERT INTO container_reservations (
          container_id, container_item_id, customer_name, customer_phone,
          reserved_boxes, reserved_units, price_agreed, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?)
      `);

      for (const it of items) {
        const cItem = db.prepare('SELECT * FROM container_items WHERE id = ? AND container_id = ?').get(it.container_item_id, id);
        if (!cItem) continue;

        const boxes = Number(it.reserved_boxes) || 0;
        if (boxes <= 0) continue;

        const upb = Number(cItem.units_per_box) || 1;
        const units = Number(it.reserved_units) || (boxes * upb);
        const price = Number(it.price_agreed || cItem.price_caja || cItem.price_mayor || 0);

        const r = insertStmt.run(
          id,
          cItem.id,
          customer_name.trim().toUpperCase(),
          customer_phone || '',
          boxes,
          units,
          price,
          notes || ''
        );

        // Update reserved_boxes count on container_item
        const sumRes = db.prepare(`
          SELECT COALESCE(SUM(reserved_boxes), 0) as s FROM container_reservations 
          WHERE container_item_id = ? AND status != 'CANCELADO'
        `).get(cItem.id);
        db.prepare('UPDATE container_items SET reserved_boxes = ? WHERE id = ?').run(sumRes.s, cItem.id);

        inserted.push(r.lastInsertRowid);
      }

      return inserted;
    });

    const insertedIds = bulkTx();
    res.json({ 
      success: true, 
      count: insertedIds.length, 
      message: `Pre-reserva de ${insertedIds.length} producto(s) registrada con éxito para ${customer_name.trim().toUpperCase()}` 
    });
  } catch (error) {
    console.error('Error al guardar pre-reserva múltiple:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/containers/:id/reservations/:resId', (req, res) => {
  try {
    const { id, resId } = req.params;
    const resv = db.prepare('SELECT * FROM container_reservations WHERE id = ? AND container_id = ?').get(resId, id);
    if (!resv) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }

    const deleteTx = db.transaction(() => {
      db.prepare('DELETE FROM container_reservations WHERE id = ?').run(resId);
      const sumRes = db.prepare(`
        SELECT COALESCE(SUM(reserved_boxes), 0) as s FROM container_reservations 
        WHERE container_item_id = ? AND status != 'CANCELADO'
      `).get(resv.container_item_id);
      db.prepare('UPDATE container_items SET reserved_boxes = ? WHERE id = ?').run(sumRes.s, resv.container_item_id);
    });

    deleteTx();
    res.json({ success: true, message: 'Pre-reserva cancelada' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// RECEPCIÓN / INGRESO A STOCK ALMACÉN DEL CONTENEDOR O CAMIÓN
app.post('/api/containers/:id/receive', (req, res) => {
  try {
    const { id } = req.params;
    const { arrival_date, warehouse, update_prices = false } = req.body;

    const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(id);
    if (!container) {
      return res.status(404).json({ success: false, error: 'Contenedor o Embarque no encontrado' });
    }

    if (container.status === 'recibido') {
      return res.status(400).json({ 
        success: false, 
        error: 'Este embarque/camión ya fue recibido e ingresado a almacén previamente. No se puede ingresar dos veces.' 
      });
    }

    const items = db.prepare('SELECT * FROM container_items WHERE container_id = ?').all(id);
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'No hay productos en la prelista de este contenedor para ingresar' });
    }

    const receiveTx = db.transaction(() => {
      const today = arrival_date || new Date().toISOString().split('T')[0];
      const targetWarehouse = warehouse || 'CASA CUBANO';

      let totalUnitsAdded = 0;
      let totalProductsUpdated = 0;
      let totalProductsCreated = 0;

      for (const it of items) {
        const units = Number(it.total_units) || (Number(it.boxes_count) * Number(it.units_per_box));
        if (units <= 0 && (!it.boxes_count || it.boxes_count <= 0)) continue;

        // Check if product exists in products table
        let prod = db.prepare('SELECT * FROM products WHERE sku = ? LIMIT 1').get(it.product_code);

        let productId = null;
        if (prod) {
          productId = prod.id;
          if (update_prices) {
            // Actualizar stock existente Y sobreescribir precios
            db.prepare(`
              UPDATE products SET
                current_stock = current_stock + ?,
                boxes_count = boxes_count + ?,
                units_per_box = CASE WHEN ? > 1 THEN ? ELSE units_per_box END,
                landed_cost = CASE WHEN ? > 0 THEN ? ELSE landed_cost END,
                wholesale_price = CASE WHEN ? > 0 THEN ? ELSE wholesale_price END,
                box_price = CASE WHEN ? > 0 THEN ? ELSE box_price END,
                special_price = CASE WHEN ? > 0 THEN ? ELSE special_price END,
                sale_price = CASE WHEN ? > 0 THEN ? ELSE sale_price END,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).run(
              units,
              Number(it.boxes_count) || 0,
              Number(it.units_per_box) || 1, Number(it.units_per_box) || 1,
              Number(it.unit_cost) || 0, Number(it.unit_cost) || 0,
              Number(it.price_mayor) || 0, Number(it.price_mayor) || 0,
              Number(it.price_caja) || 0, Number(it.price_caja) || 0,
              Number(it.price_special) || 0, Number(it.price_special) || 0,
              Number(it.price_mayor || it.price_caja) || 0, Number(it.price_mayor || it.price_caja) || 0,
              productId
            );
          } else {
            // Actualizar SOLO stock existente, PRECIOS INTACTOS
            db.prepare(`
              UPDATE products SET
                current_stock = current_stock + ?,
                boxes_count = boxes_count + ?,
                units_per_box = CASE WHEN ? > 1 THEN ? ELSE units_per_box END,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).run(
              units,
              Number(it.boxes_count) || 0,
              Number(it.units_per_box) || 1, Number(it.units_per_box) || 1,
              productId
            );
          }
          totalProductsUpdated++;
        } else {
          // Crear nuevo producto en el catálogo (siempre incluye precios)
          const insertProd = db.prepare(`
            INSERT INTO products (
              sku, name, category, brand, current_stock, min_stock, sale_price, landed_cost,
              wholesale_price, box_price, special_price, boxes_count, units_per_box,
              warehouse
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            it.product_code,
            it.product_name,
            'IMPORTACION',
            'UYUSTOOLS',
            units,
            10,
            Number(it.price_mayor || it.price_caja || (it.unit_cost ? it.unit_cost * 1.3 : 0)),
            Number(it.unit_cost || 0),
            Number(it.price_mayor || 0),
            Number(it.price_caja || 0),
            Number(it.price_special || 0),
            Number(it.boxes_count || 0),
            Number(it.units_per_box || 1),
            targetWarehouse
          );
          productId = insertProd.lastInsertRowid;
          totalProductsCreated++;
        }

        // Registrar movimiento de Entrada en Kardex
        db.prepare(`
          INSERT INTO inventory_movements (
            product_id, type, quantity, unit_cost, unit_price, total_amount,
            container_id, reference, party_name, date, notes
          ) VALUES (?, 'ENTRADA', ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          productId,
          units,
          Number(it.unit_cost || 0),
          Number(it.price_mayor || it.price_caja || 0),
          units * Number(it.unit_cost || 0),
          container.id,
          `Entrada Lote ${container.tracking_number}`,
          container.shipping_line || 'Importación',
          today,
          `Llegada de ${it.boxes_count} cajas (${units} unid) del contenedor/camión ${container.tracking_number}${update_prices ? ' (con actualización de precios)' : ' (solo stock)'}`
        );

        totalUnitsAdded += units;
      }

      // --- OPCIÓN 2: Convertir Pre-Reservas activas en Notas de Venta (PRE-RESERVA) automáticas ---
      const activeReservations = db.prepare(`
        SELECT cr.*, ci.product_code, ci.product_name, ci.units_per_box
        FROM container_reservations cr
        JOIN container_items ci ON cr.container_item_id = ci.id
        WHERE cr.container_id = ? AND cr.status = 'PENDIENTE'
      `).all(id);

      const createdSalesNotes = [];
      if (activeReservations && activeReservations.length > 0) {
        // Agrupar reservas por cliente
        const reservationsByClient = {};
        for (const resv of activeReservations) {
          const clientKey = (resv.customer_name || 'CLIENTE RESERVA').trim().toUpperCase();
          if (!reservationsByClient[clientKey]) {
            reservationsByClient[clientKey] = {
              customer_name: clientKey,
              customer_phone: resv.customer_phone || '',
              notes: resv.notes || '',
              items: []
            };
          }
          reservationsByClient[clientKey].items.push(resv);
        }

        // Generar una Nota de Venta por cada cliente
        for (const clientKey of Object.keys(reservationsByClient)) {
          const group = reservationsByClient[clientKey];

          // Buscar cliente registrado si existe
          let finalCustId = null;
          const matchCust = db.prepare('SELECT id FROM customers WHERE UPPER(name) = ? LIMIT 1').get(group.customer_name);
          if (matchCust) finalCustId = matchCust.id;

          // Código de nota único
          const nextSeq = (db.prepare('SELECT count(*) as c FROM sales_notes').get().c || 0) + 1;
          const clientCodePart = group.customer_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'XX';
          const noteCode = `IR${nextSeq}${clientCodePart}`;

          let totalBoxesNote = 0;
          let totalUnitsNote = 0;
          let totalAmountNote = 0;

          for (const item of group.items) {
            const boxes = Number(item.reserved_boxes) || 0;
            const upb = Number(item.units_per_box) || 1;
            const units = Number(item.reserved_units) || (boxes * upb);
            const price = Number(item.price_agreed) || 0;
            const sub = boxes * upb * price;
            totalBoxesNote += boxes;
            totalUnitsNote += units;
            totalAmountNote += sub;
          }

          // Insertar nota de venta con estado 'PRE-RESERVA'
          const noteResult = db.prepare(`
            INSERT INTO sales_notes (
              note_code, customer_id, customer_name, customer_phone,
              date, due_date, seller_name, delivery_type, notes,
              total_boxes, total_units, total_amount, paid_amount, balance_amount, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            noteCode,
            finalCustId,
            group.customer_name,
            group.customer_phone,
            today,
            today,
            'SISTEMA',
            'Por coordinar entrega',
            `Pre-Reserva de Embarque ${container.tracking_number}. ${group.notes || ''}`.trim(),
            totalBoxesNote,
            totalUnitsNote,
            totalAmountNote,
            0,
            totalAmountNote,
            'PRE-RESERVA'
          );

          const newNoteId = noteResult.lastInsertRowid;

          // Insertar ítems en sales_note_items
          for (const item of group.items) {
            const boxes = Number(item.reserved_boxes) || 0;
            const upb = Number(item.units_per_box) || 1;
            const units = Number(item.reserved_units) || (boxes * upb);
            const price = Number(item.price_agreed) || 0;
            const sub = boxes * upb * price;

            const prod = db.prepare('SELECT id FROM products WHERE sku = ? LIMIT 1').get(item.product_code);

            db.prepare(`
              INSERT INTO sales_note_items (
                note_id, product_id, sku, description, unit_med, sale_mode,
                boxes_count, units_per_box, quantity, unit_price, subtotal, warehouse_source
              ) VALUES (?, ?, ?, ?, 'UNI', 'CAJA', ?, ?, ?, ?, ?, ?)
            `).run(
              newNoteId,
              prod ? prod.id : null,
              item.product_code,
              item.product_name,
              boxes,
              upb,
              units,
              price,
              sub,
              targetWarehouse
            );

            // Marcar la pre-reserva del contenedor como CONVERTIDO
            db.prepare(`
              UPDATE container_reservations 
              SET status = 'CONVERTIDO', notes = COALESCE(notes || ' ', '') || ' [Convertida a Nota ' || ? || ']'
              WHERE id = ?
            `).run(noteCode, item.id);
          }

          createdSalesNotes.push({
            noteCode,
            customer_name: group.customer_name,
            boxes: totalBoxesNote,
            total: totalAmountNote
          });
        }
      }

      // Actualizar contenedor como Recibido en Bodega
      db.prepare(`
        UPDATE containers SET
          status = 'recibido',
          actual_arrival = ?,
          warehouse_arrival_date = ?
        WHERE id = ?
      `).run(today, today, id);

      return { 
        totalUnitsAdded, 
        totalProductsUpdated, 
        totalProductsCreated, 
        update_prices: !!update_prices,
        createdSalesNotes
      };
    });

    const result = receiveTx();
    const priceText = result.update_prices ? 'con actualización de precios' : 'manteniendo los precios actuales';
    const notesSummary = result.createdSalesNotes && result.createdSalesNotes.length > 0 
      ? ` 📌 Se crearon automáticamente ${result.createdSalesNotes.length} Notas de Pre-Reserva para: ${result.createdSalesNotes.map(n => `${n.customer_name} (${n.noteCode})`).join(', ')}.`
      : '';

    res.json({
      success: true,
      message: `¡Mercadería ingresada a almacén (${priceText})! Se sumaron ${result.totalUnitsAdded} unidades (${result.totalProductsUpdated} productos actualizados${result.totalProductsCreated > 0 ? `, ${result.totalProductsCreated} nuevos creados` : ''}) al stock físico y Kardex.${notesSummary}`,
      summary: result
    });
  } catch (err) {
    console.error('Error al recibir contenedor:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Import from Google Sheets / Excel / CSV
app.post('/api/import/sheets', (req, res) => {
  const { records, filename, mode } = req.body;
  // mode: 'products' (updates/creates products) or 'movements' (creates inbound/outbound records)

  if (!records || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ success: false, error: 'No se enviaron datos para importar' });
  }

  const transaction = db.transaction(() => {
    let importedCount = 0;
    let updatedCount = 0;

    const findProductBySku = db.prepare('SELECT * FROM products WHERE sku = ?');
    const insertProductStmt = db.prepare(`
      INSERT INTO products (
        sku, name, category, unit, fob_price, shipping_cost, tariff_cost, landed_cost,
        sale_price, current_stock, min_stock, supplier, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const updateProductStmt = db.prepare(`
      UPDATE products SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        fob_price = COALESCE(?, fob_price),
        landed_cost = COALESCE(?, landed_cost),
        sale_price = COALESCE(?, sale_price),
        current_stock = COALESCE(?, current_stock),
        min_stock = COALESCE(?, min_stock),
        supplier = COALESCE(?, supplier),
        updated_at = CURRENT_TIMESTAMP
      WHERE sku = ?
    `);

    for (const row of records) {
      // Flexible field mapping
      const sku = (row.sku || row.codigo || row.cod || row.SKU || `IMP-${Date.now().toString().slice(-5)}-${importedCount}`).toString().trim().toUpperCase();
      const name = (row.name || row.nombre || row.producto || row.descripcion || 'Producto Importado').toString().trim();
      const category = (row.category || row.categoria || row.rubro || 'General').toString().trim();
      const unit = (row.unit || row.unidad || 'Unidad').toString().trim();
      const fob = parseFloat(row.fob || row.fob_price || row.costo_fob || row.precio_fabrica || 0);
      const shipping = parseFloat(row.shipping || row.flete || row.shipping_cost || 0);
      const tariff = parseFloat(row.tariff || row.arancel || row.impuesto || row.aduana || 0);

      let landed = parseFloat(row.landed || row.landed_cost || row.costo || row.costo_total || 0);
      if (!landed || landed === 0) {
        landed = fob + shipping + tariff;
      }

      const salePrice = parseFloat(row.price || row.sale_price || row.precio || row.precio_venta || row.pvp || (landed * 1.5));
      const stock = parseInt(row.stock || row.current_stock || row.cantidad || row.existencia || 0, 10);
      const minStock = parseInt(row.min_stock || row.stock_minimo || 10, 10);
      const supplier = (row.supplier || row.proveedor || row.origen || 'Importación Google Sheets').toString().trim();
      const notes = (row.notes || row.notas || row.observaciones || 'Importado desde Hoja de Cálculo').toString().trim();

      const existing = findProductBySku.get(sku);
      if (existing) {
        updateProductStmt.run(name, category, fob, landed, salePrice, stock, minStock, supplier, sku);
        updatedCount++;
      } else {
        insertProductStmt.run(sku, name, category, unit, fob, shipping, tariff, landed, salePrice, stock, minStock, supplier, notes);
        importedCount++;
      }
    }

    // Record in history
    db.prepare(`
      INSERT INTO import_history (filename, source_type, records_count)
      VALUES (?, 'Google Sheets / Archivo', ?)
    `).run(filename || 'Carga Manual Hojas de Cálculo', importedCount + updatedCount);

    return { importedCount, updatedCount, totalProcessed: records.length };
  });

  try {
    const summary = transaction();
    res.json({
      success: true,
      data: summary,
      message: `Importación completada: ${summary.importedCount} productos nuevos creados, ${summary.updatedCount} actualizados.`
    });
  } catch (error) {
    console.error('Error importing sheets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================================
// REAL DATA MIGRATION FROM GOOGLE DRIVE (Multi-Sheet Excel / Link / Customers & Debts / Test Cleanup)
// =============================================================================
app.post('/api/import/google-drive-workbook', requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { source, googleUrl, base64Data, filename, preset, replaceCatalog } = req.body;
    const opts = { replaceCatalog: Boolean(replaceCatalog) };

    if (source === 'url') {
      if (!googleUrl || typeof googleUrl !== 'string') {
        return res.status(400).json({ success: false, error: 'Pega el enlace de tu hoja de Google Sheets / Google Drive.' });
      }
      const match = googleUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        return res.status(400).json({
          success: false,
          error: 'El enlace no parece ser de Google Sheets. Debe contener "/spreadsheets/d/...".'
        });
      }
      const sheetId = match[1];
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
      const response = await fetch(exportUrl);

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || contentType.includes('text/html')) {
        return res.status(400).json({
          success: false,
          error: 'No se pudo descargar directo porque el archivo en Google Drive es privado. En Google Sheets haz clic en "Compartir → Cualquier persona con el enlace (Lector)" o descárgalo como .xlsx y súbelo en la pestaña "Subir Excel (.xlsx)".'
        });
      }

      const arrayBuf = await response.arrayBuffer();
      const summary = migrateFromBuffer(Buffer.from(arrayBuf), `GoogleSheets_${sheetId.slice(0, 8)}.xlsx`, opts);
      logSecurityEvent(db, {
        action: 'GOOGLE_DRIVE_URL_IMPORT',
        actorUser: req.user,
        target: sheetId,
        ip: getClientIp(req),
        details: { totalSheets: summary.totalSheets, totalProcessed: summary.totalProcessed }
      });
      return res.json({ success: true, data: summary });
    }

    if (source === 'file') {
      if (!base64Data) {
        return res.status(400).json({ success: false, error: 'Selecciona un archivo Excel (.xlsx) descargado de tu Google Drive.' });
      }
      const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const buf = Buffer.from(cleanBase64, 'base64');
      const summary = migrateFromBuffer(buf, filename || 'Inventario_GoogleDrive.xlsx', opts);
      logSecurityEvent(db, {
        action: 'GOOGLE_DRIVE_XLSX_IMPORT',
        actorUser: req.user,
        target: filename || 'Inventario_GoogleDrive.xlsx',
        ip: getClientIp(req),
        details: { totalSheets: summary.totalSheets, totalProcessed: summary.totalProcessed }
      });
      return res.json({ success: true, data: summary });
    }

    if (source === 'local') {
      const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
      const uyusPath = path.join(rootDir, 'INVENTARIO UYUS 26.xlsx');
      const variosPath = path.join(rootDir, 'INVENTARIO VARIOS 26.xlsx');
      let totalCreated = 0;
      let totalUpdated = 0;
      let totalSheets = 0;
      const sheetsList = [];

      if ((preset === 'varios' || preset === 'all') && fs.existsSync(variosPath)) {
        const s1 = migrateFromExcelFile(variosPath, opts);
        totalCreated += s1.createdCount;
        totalUpdated += s1.updatedCount;
        totalSheets += s1.totalSheets;
        sheetsList.push(...s1.sheets);
      }
      if ((preset === 'uyus' || preset === 'all') && fs.existsSync(uyusPath)) {
        const s2 = migrateFromExcelFile(uyusPath, { replaceCatalog: false });
        totalCreated += s2.createdCount;
        totalUpdated += s2.updatedCount;
        totalSheets += s2.totalSheets;
        sheetsList.push(...s2.sheets);
      }

      return res.json({
        success: true,
        data: {
          filename: preset === 'all' ? 'INVENTARIO UYUS 26 + VARIOS 26' : `INVENTARIO ${String(preset).toUpperCase()} 26.xlsx`,
          totalSheets,
          sheets: sheetsList,
          createdCount: totalCreated,
          updatedCount: totalUpdated,
          totalProcessed: totalCreated + totalUpdated
        }
      });
    }

    return res.status(400).json({ success: false, error: 'Tipo de origen de importación no válido.' });
  } catch (err) {
    console.error('Error importing Google Drive workbook:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Import Real Customers & Pending Debts / Initial Balances from Google Sheets
app.post('/api/import/customers-debts', requireRoles('SUPER_ADMIN', 'ADMIN'), (req, res) => {
  try {
    const { records } = req.body;
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'No se encontraron filas de clientes o saldos para importar.' });
    }

    let customersCreated = 0;
    let customersUpdated = 0;
    let notesCreated = 0;
    const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

    const tx = db.transaction(() => {
      const findCust = db.prepare('SELECT * FROM customers WHERE LOWER(name) = LOWER(?)');
      const insertCust = db.prepare(`
        INSERT INTO customers (code, name, phone, address, city, notes)
        VALUES (?, ?, ?, ?, 'Cochabamba', ?)
      `);
      const updateCust = db.prepare(`
        UPDATE customers SET
          phone = COALESCE(NULLIF(?, ''), phone),
          address = COALESCE(NULLIF(?, ''), address),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      for (const r of records) {
        const rawName = String(r.customer_name || r.cliente || r.nombre || '').trim().toUpperCase();
        if (!rawName) continue;

        const phone = String(r.phone || r.telefono || r.celular || '').trim();
        const address = String(r.address || r.direccion || r.mercado || '').trim();
        const totalAmt = Math.max(0, parseFloat(r.total_amount ?? r.total ?? r.monto_total ?? 0) || 0);
        const paidAmt = Math.max(0, parseFloat(r.paid_amount ?? r.a_cuenta ?? r.pagado ?? 0) || 0);
        const explicitBalance = parseFloat(r.balance_amount ?? r.saldo ?? r.deuda ?? NaN);
        const balanceAmt = Number.isFinite(explicitBalance)
          ? Math.max(0, explicitBalance)
          : Math.max(0, totalAmt - paidAmt);
        const finalTotal = totalAmt > 0 ? totalAmt : (paidAmt + balanceAmt);
        const noteDate = String(r.date || r.fecha || todayStr).trim().slice(0, 10) || todayStr;
        const seller = String(r.seller_name || r.vendedor || r.encargado || req.user?.name || 'HISTÓRICO').trim().toUpperCase();

        let cust = findCust.get(rawName);
        if (!cust) {
          const seq = (db.prepare('SELECT COUNT(*) as c FROM customers').get().c || 0) + 1;
          const initials = rawName.split(/\s+/).map(w => w[0]).join('').slice(0, 2) || 'CL';
          const code = `IR-${initials}${seq}`;
          const info = insertCust.run(code, rawName, phone, address, 'Importado de Google Drive');
          cust = { id: info.lastInsertRowid, name: rawName, phone, address };
          customersCreated++;
        } else {
          updateCust.run(phone, address, cust.id);
          customersUpdated++;
        }

        // If row includes a sale note or pending balance > 0, register the historical note
        if (finalTotal > 0 || balanceAmt > 0) {
          const nextSeq = (db.prepare('SELECT COUNT(*) as c FROM sales_notes').get().c || 0) + 1;
          const initials = rawName.split(/\s+/).map(w => w[0]).join('').slice(0, 2) || 'CL';
          const rawCode = String(r.note_code || r.codigo_nota || r.nota || '').trim().toUpperCase();
          const noteCode = rawCode || `IR${nextSeq}${initials}`;

          const existsNote = db.prepare('SELECT id FROM sales_notes WHERE note_code = ?').get(noteCode);
          const finalNoteCode = existsNote ? `${noteCode}-${nextSeq}` : noteCode;
          const status = balanceAmt <= 0 ? 'PAGADO' : 'PENDIENTE';

          const noteInfo = db.prepare(`
            INSERT INTO sales_notes (
              note_code, customer_id, customer_name, customer_phone, customer_address,
              date, due_date, seller_name, delivery_type, delivery_destination,
              notes, total_boxes, total_units, total_amount, paid_amount, balance_amount,
              status, delivery_status, stock_deducted, note_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'A su tienda', ?, ?, 1, 1, ?, ?, ?, ?, 'ENTREGADO', 1, 'VENTA')
          `).run(
            finalNoteCode,
            cust.id,
            rawName,
            phone,
            address,
            noteDate,
            noteDate,
            seller,
            address || 'Cochabamba',
            String(r.notes || r.detalle || 'Saldo migrado desde Google Drive').trim(),
            finalTotal,
            finalTotal - balanceAmt,
            balanceAmt,
            status
          );

          db.prepare(`
            INSERT INTO sales_note_items (
              note_id, product_id, sku, description, unit_med, sale_mode,
              boxes_count, units_per_box, quantity, unit_price, subtotal, warehouse_source
            ) VALUES (?, NULL, 'SALDO-INICIAL', ?, 'UNI', 'UNIDAD', 1, 1, 1, ?, ?, 'ALMACEN')
          `).run(
            noteInfo.lastInsertRowid,
            String(r.notes || r.detalle || `Saldo / Nota migrada (${finalNoteCode})`).trim(),
            finalTotal,
            finalTotal
          );

          notesCreated++;
        }
      }
    });
    tx();

    logSecurityEvent(db, {
      action: 'CUSTOMERS_DEBTS_IMPORTED',
      actorUser: req.user,
      target: 'customers+notes',
      ip: getClientIp(req),
      details: { customersCreated, customersUpdated, notesCreated }
    });

    res.json({
      success: true,
      data: { customersCreated, customersUpdated, notesCreated },
      message: `Migración lista: ${customersCreated} clientes nuevos, ${customersUpdated} actualizados y ${notesCreated} notas/saldos cargados.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Clean all test operational records (creates automatic backup first!)
app.post('/api/system/clean-test-data', requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const backup = await createDatabaseBackup(db, 'pre-clean-ui');
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

    const deletedCounts = {};
    const tx = db.transaction(() => {
      for (const t of tablesToClean) {
        const c = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get().c;
        deletedCounts[t] = c;
        db.prepare(`DELETE FROM ${t}`).run();
        try {
          db.prepare('DELETE FROM sqlite_sequence WHERE name = ?').run(t);
        } catch {}
      }
      db.prepare('UPDATE products SET current_stock = 0, updated_at = CURRENT_TIMESTAMP WHERE current_stock < 0').run();
    });
    tx();

    logSecurityEvent(db, {
      action: 'TEST_DATA_CLEANED',
      actorUser: req.user,
      target: backup.filename,
      ip: getClientIp(req),
      details: deletedCounts
    });

    res.json({
      success: true,
      data: { backup: backup.filename, deletedCounts },
      message: `Datos de prueba eliminados con éxito (Respaldo previo guardado: ${backup.filename}).`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== CLIENTES (CARTERA / RESUMEN 2026) ====================
app.get('/api/customers', (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        c.*,
        COUNT(sn.id) AS total_notes,
        COALESCE(SUM(CASE WHEN sn.status != 'ANULADO' THEN sn.total_amount ELSE 0 END), 0) AS total_purchases,
        COALESCE(SUM(CASE WHEN sn.status != 'ANULADO' THEN sn.balance_amount ELSE 0 END), 0) AS total_debt
      FROM customers c
      LEFT JOIN sales_notes sn ON c.id = sn.customer_id
    `;
    const params = [];
    if (search) {
      query += ` WHERE (c.name LIKE ? OR c.phone LIKE ? OR c.address LIKE ? OR c.code LIKE ?) `;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    query += ` GROUP BY c.id ORDER BY c.name ASC`;
    const customers = db.prepare(query).all(...params);
    res.json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const { name, phone, address, city, notes, store_location_url } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'El nombre del cliente es obligatorio.' });
    }
    const count = (db.prepare('SELECT count(*) as c FROM customers').get().c || 0) + 1;
    const cleanName = name.trim().toUpperCase();
    const initials = cleanName.split(' ').map(w => w[0]).join('').slice(0, 3) || 'CLI';
    const code = `IR-${initials}${String(count).padStart(2, '0')}`;
    
    const stmt = db.prepare(`
      INSERT INTO customers (code, name, phone, address, city, notes, store_location_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(code, cleanName, phone || '', address || '', city || 'Cochabamba', notes || '', store_location_url || '');
    const newCust = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, data: newCust, message: 'Cliente registrado con éxito.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/customers/:id', (req, res) => {
  try {
    const { name, phone, address, city, notes, store_location_url } = req.body;
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado.' });
    }

    const stmt = db.prepare(`
      UPDATE customers 
      SET name = ?, phone = ?, address = ?, city = ?, notes = ?, store_location_url = ?
      WHERE id = ?
    `);
    stmt.run(
      name ? name.trim().toUpperCase() : customer.name,
      phone !== undefined ? phone : customer.phone,
      address !== undefined ? address : customer.address,
      city !== undefined ? city : customer.city,
      notes !== undefined ? notes : customer.notes,
      store_location_url !== undefined ? store_location_url : customer.store_location_url,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated, message: 'Cliente actualizado correctamente.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/customers/:id/statement', (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado.' });
    }
    const notes = db.prepare(`
      SELECT * FROM sales_notes 
      WHERE customer_id = ? 
      ORDER BY date DESC, id DESC
    `).all(req.params.id);

    const summary = db.prepare(`
      SELECT 
        COUNT(id) AS total_notes_count,
        COALESCE(SUM(CASE WHEN status != 'ANULADO' THEN total_amount ELSE 0 END), 0) AS total_invoiced,
        COALESCE(SUM(CASE WHEN status != 'ANULADO' THEN paid_amount ELSE 0 END), 0) AS total_paid,
        COALESCE(SUM(CASE WHEN status != 'ANULADO' THEN balance_amount ELSE 0 END), 0) AS total_balance_due
      FROM sales_notes
      WHERE customer_id = ?
    `).get(req.params.id);

    res.json({
      success: true,
      data: {
        customer,
        summary,
        notes
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== NOTAS DE VENTA & DESPACHOS ====================
app.get('/api/sales-notes', (req, res) => {
  try {
    const { search, status, customerId, dailyDate, noteType, limit = 100, offset = 0 } = req.query;
    let query = `
      SELECT 
        sn.*,
        c.code AS customer_code,
        (SELECT COUNT(id) FROM sales_note_items WHERE note_id = sn.id) AS items_count
      FROM sales_notes sn
      LEFT JOIN customers c ON sn.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (sn.note_code LIKE ? OR sn.customer_name LIKE ? OR sn.seller_name LIKE ? OR sn.delivery_destination LIKE ?) `;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (status && status !== 'TODAS') {
      query += ` AND sn.status = ? `;
      params.push(status);
    }

    if (noteType && noteType !== 'TODAS') {
      query += ` AND COALESCE(sn.note_type, 'VENTA') = ? `;
      params.push(noteType);
    }

    if (customerId) {
      query += ` AND sn.customer_id = ? `;
      params.push(customerId);
    }

    query += ` ORDER BY sn.date DESC, sn.id DESC LIMIT ? OFFSET ? `;
    params.push(Number(limit), Number(offset));

    const notes = db.prepare(query).all(...params);

    let countQuery = 'SELECT COUNT(id) as c FROM sales_notes WHERE 1=1';
    const countParams = [];
    if (status && status !== 'TODAS') {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (noteType && noteType !== 'TODAS') {
      countQuery += " AND COALESCE(note_type, 'VENTA') = ?";
      countParams.push(noteType);
    }
    if (customerId) {
      countQuery += ' AND customer_id = ?';
      countParams.push(customerId);
    }
    const totalCount = db.prepare(countQuery).get(...countParams).c;

    // Exclude internal REPOSICION_TIENDA notes from financial sales/debt KPIs
    const kpis = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN COALESCE(note_type, 'VENTA') != 'REPOSICION_TIENDA' AND status NOT IN ('ANULADO','PRE-RESERVA') THEN total_amount ELSE 0 END), 0) AS total_sales,
        COALESCE(SUM(CASE WHEN COALESCE(note_type, 'VENTA') != 'REPOSICION_TIENDA' AND status NOT IN ('ANULADO','PRE-RESERVA') THEN paid_amount ELSE 0 END), 0) AS total_collected,
        COALESCE(SUM(CASE WHEN COALESCE(note_type, 'VENTA') != 'REPOSICION_TIENDA' AND status NOT IN ('ANULADO','PRE-RESERVA') THEN balance_amount ELSE 0 END), 0) AS total_receivable,
        COUNT(CASE WHEN COALESCE(note_type, 'VENTA') != 'REPOSICION_TIENDA' AND status = 'PENDIENTE' THEN 1 END) AS pending_notes_count,
        COUNT(CASE WHEN status = 'PRE-RESERVA' THEN 1 END) AS pre_reserva_count,
        COUNT(CASE WHEN COALESCE(note_type, 'VENTA') = 'REPOSICION_TIENDA' AND status NOT IN ('ANULADO', 'RECIBIDO', 'ENTREGADO') THEN 1 END) AS active_restocks_count,
        COUNT(CASE WHEN COALESCE(note_type, 'VENTA') != 'REPOSICION_TIENDA' AND status NOT IN ('ANULADO') THEN 1 END) AS total_notes
      FROM sales_notes
    `).get();

    const targetDailyDate = dailyDate || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const dailyStats = db.prepare(`
      SELECT
        COALESCE(SUM(CASE 
          WHEN UPPER(snp.payment_method) LIKE '%EFECTIVO%' AND UPPER(snp.payment_method) NOT LIKE '%TRANSFERENCIA%' 
          THEN snp.amount ELSE 0 END), 0) AS daily_cash,
        COUNT(CASE 
          WHEN UPPER(snp.payment_method) LIKE '%EFECTIVO%' AND UPPER(snp.payment_method) NOT LIKE '%TRANSFERENCIA%' AND snp.amount > 0 
          THEN 1 END) AS daily_cash_count,
        COALESCE(SUM(CASE 
          WHEN UPPER(snp.payment_method) LIKE '%QR%' OR UPPER(snp.payment_method) LIKE '%TRANSFERENCIA%' OR UPPER(snp.payment_method) LIKE '%DEP%' OR UPPER(snp.payment_method) LIKE '%BANCARIO%' 
          THEN snp.amount ELSE 0 END), 0) AS daily_qr,
        COUNT(CASE 
          WHEN (UPPER(snp.payment_method) LIKE '%QR%' OR UPPER(snp.payment_method) LIKE '%TRANSFERENCIA%' OR UPPER(snp.payment_method) LIKE '%DEP%' OR UPPER(snp.payment_method) LIKE '%BANCARIO%') AND snp.amount > 0 
          THEN 1 END) AS daily_qr_count,
        COALESCE(SUM(CASE 
          WHEN (UPPER(snp.payment_method) LIKE '%QR%' OR UPPER(snp.payment_method) LIKE '%TRANSFERENCIA%' OR UPPER(snp.payment_method) LIKE '%DEP%' OR UPPER(snp.payment_method) LIKE '%BANCARIO%')
               AND (UPPER(snp.payment_method) LIKE '%JAIME%' OR UPPER(snp.account_info) LIKE '%JAIME%')
          THEN snp.amount ELSE 0 END), 0) AS daily_qr_jaime,
        COALESCE(SUM(CASE 
          WHEN (UPPER(snp.payment_method) LIKE '%QR%' OR UPPER(snp.payment_method) LIKE '%TRANSFERENCIA%' OR UPPER(snp.payment_method) LIKE '%DEP%' OR UPPER(snp.payment_method) LIKE '%BANCARIO%')
               AND (UPPER(snp.payment_method) LIKE '%BET%' OR UPPER(snp.account_info) LIKE '%BET%')
          THEN snp.amount ELSE 0 END), 0) AS daily_qr_betho,
        COALESCE(SUM(CASE 
          WHEN UPPER(snp.payment_method) LIKE '%REBAJA%' OR UPPER(snp.payment_method) LIKE '%DESCUENTO%' 
          THEN snp.amount ELSE 0 END), 0) AS daily_discount
      FROM sales_note_payments snp
      JOIN sales_notes sn ON snp.note_id = sn.id
      WHERE sn.status NOT IN ('ANULADO', 'PRE-RESERVA')
        AND snp.payment_date = ?
    `).get(targetDailyDate);

    const dailyTotalCollected = (dailyStats?.daily_cash || 0) + (dailyStats?.daily_qr || 0);

    res.json({ 
      success: true, 
      data: notes, 
      total: totalCount, 
      kpis: {
        ...kpis,
        daily_date: targetDailyDate,
        daily_cash: dailyStats?.daily_cash || 0,
        daily_cash_count: dailyStats?.daily_cash_count || 0,
        daily_qr: dailyStats?.daily_qr || 0,
        daily_qr_count: dailyStats?.daily_qr_count || 0,
        daily_qr_jaime: dailyStats?.daily_qr_jaime || 0,
        daily_qr_betho: dailyStats?.daily_qr_betho || 0,
        daily_discount: dailyStats?.daily_discount || 0,
        daily_total_collected: dailyTotalCollected,
        daily_payments_count: (dailyStats?.daily_cash_count || 0) + (dailyStats?.daily_qr_count || 0)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/sales-notes/:id', (req, res) => {
  try {
    const note = db.prepare(`
      SELECT sn.*, c.code AS customer_code, c.phone AS customer_phone_official
      FROM sales_notes sn
      LEFT JOIN customers c ON sn.customer_id = c.id
      WHERE sn.id = ?
    `).get(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, error: 'Nota de venta no encontrada.' });
    }

    const items = db.prepare(`
      SELECT sni.*, p.brand, p.category, p.current_stock AS current_stock_now
      FROM sales_note_items sni
      LEFT JOIN products p ON sni.product_id = p.id
      WHERE sni.note_id = ?
    `).all(req.params.id);

    const payments = db.prepare(`
      SELECT * FROM sales_note_payments 
      WHERE note_id = ? 
      ORDER BY payment_date ASC, id ASC
    `).all(req.params.id);

    res.json({ success: true, data: { ...note, items, payments } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sales-notes', (req, res) => {
  const {
    customer_id,
    customer_name,
    customer_phone,
    customer_address,
    date,
    due_date,
    seller_name,
    delivery_type,
    delivery_destination,
    delivery_location_url,
    notes,
    items,
    payments
  } = req.body;

  const isRestock = req.body.note_type === 'REPOSICION_TIENDA';
  const allowPendingArrival = Boolean(req.body.allow_pending_arrival);
  const effectiveCustomerName = isRestock
    ? (customer_name && customer_name.trim() ? customer_name.trim() : 'REPOSICIÓN TIENDA')
    : customer_name;

  if (!effectiveCustomerName || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Debe especificar el destino/cliente y al menos un producto a despachar.' });
  }

  // Smart Stock Validation (Option 2): Validate stock for VENTA notes unless controlled pending-arrival override is explicitly checked
  let hasStockShortage = false;
  if (!isRestock && req.body.status !== 'PRE-RESERVA') {
    const requestedByProduct = new Map();
    for (const item of items) {
      if (!item.product_id) continue;
      const mode = item.sale_mode || 'CAJA';
      const qtyUnits = mode === 'CAJA'
        ? parseInt(item.boxes_count || 1, 10) * parseInt(item.units_per_box || 1, 10)
        : parseInt(item.quantity || 1, 10);
      requestedByProduct.set(item.product_id, (requestedByProduct.get(item.product_id) || 0) + qtyUnits);
    }

    const shortages = [];
    for (const [prodId, reqQty] of requestedByProduct.entries()) {
      const prod = db.prepare('SELECT sku, name, current_stock FROM products WHERE id = ?').get(prodId);
      if (prod) {
        const avail = Math.max(0, Number(prod.current_stock || 0));
        if (reqQty > avail) {
          shortages.push(`${prod.sku} (${prod.name}): pides ${reqQty} u., disponible ${avail} u.`);
        }
      }
    }

    if (shortages.length > 0) {
      hasStockShortage = true;
      if (!allowPendingArrival) {
        return res.status(400).json({
          success: false,
          code: 'INSUFFICIENT_STOCK',
          error: `Stock insuficiente: ${shortages.join(' | ')}. Ingresa el stock rápido o marca "Mercadería recién llegada (Pendiente de carga)".`
        });
      }
    }
  }

  const createTx = db.transaction(() => {
    // Resolver customer_id solo si es VENTA normal
    let finalCustId = isRestock ? null : (customer_id || null);
    if (!isRestock && !finalCustId && effectiveCustomerName) {
      const match = db.prepare('SELECT id FROM customers WHERE name = ? COLLATE NOCASE').get(effectiveCustomerName.trim());
      if (match) finalCustId = match.id;
    }

    // Generar código de nota único: REP-001 para Reposición a Tienda o IR42EG para Venta
    let noteCode;
    if (isRestock) {
      const restockSeq = (db.prepare("SELECT count(*) as c FROM sales_notes WHERE note_type = 'REPOSICION_TIENDA'").get().c || 0) + 1;
      noteCode = `REP-${String(restockSeq).padStart(3, '0')}`;
    } else {
      const nextSeq = (db.prepare("SELECT count(*) as c FROM sales_notes WHERE COALESCE(note_type, 'VENTA') != 'REPOSICION_TIENDA'").get().c || 0) + 1;
      const clientCodePart = effectiveCustomerName.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'XX';
      noteCode = `IR${nextSeq}${clientCodePart}`;
    }

    let totalBoxes = 0;
    let totalUnits = 0;
    let totalAmount = 0;

    for (const item of items) {
      const mode = item.sale_mode || 'CAJA';
      const unitPrice = isRestock ? 0 : (parseFloat(item.unit_price) || 0);
      let qtyUnits = 0;
      let sub = 0;

      if (mode === 'CAJA') {
        const boxes = parseInt(item.boxes_count || 1, 10);
        const upb = parseInt(item.units_per_box || 1, 10);
        qtyUnits = boxes * upb;
        sub = boxes * upb * unitPrice;
        totalBoxes += boxes;
      } else {
        qtyUnits = parseInt(item.quantity || 1, 10);
        sub = qtyUnits * unitPrice;
      }

      totalUnits += qtyUnits;
      totalAmount += sub;
    }

    // Calcular abonos iniciales (siempre 0 para Reposición interna)
    let initialPaid = 0;
    if (!isRestock && payments && Array.isArray(payments)) {
      for (const p of payments) {
        initialPaid += parseFloat(p.amount) || 0;
      }
    }

    const balance = isRestock ? 0 : Math.max(0, totalAmount - initialPaid);
    const isPreReserva = !isRestock && req.body.status === 'PRE-RESERVA';
    const status = isRestock
      ? 'EN_CURSO'
      : (isPreReserva ? 'PRE-RESERVA' : (balance <= 0 ? 'PAGADO' : 'PENDIENTE'));

    const isImmediateDelivery = !isRestock && req.body.delivery_status === 'ENTREGADO';
    const deliveryStatus = isRestock ? 'EN_CURSO' : (isImmediateDelivery ? 'ENTREGADO' : 'PENDIENTE');
    const stockDeducted = isImmediateDelivery ? 1 : 0;
    const deliveredAt = isImmediateDelivery ? (date || new Date().toISOString().split('T')[0]) : null;
    const noteType = isRestock ? 'REPOSICION_TIENDA' : 'VENTA';

    // Insertar Nota
    const pendingStockArrival = (!isRestock && hasStockShortage && allowPendingArrival) ? 1 : 0;
    const insertNoteStmt = db.prepare(`
      INSERT INTO sales_notes (
        note_code, customer_id, customer_name, customer_phone, customer_address,
        date, due_date, seller_name, delivery_type, delivery_destination, delivery_location_url, notes,
        total_boxes, total_units, total_amount, paid_amount, balance_amount, status,
        delivery_status, stock_deducted, delivered_at, note_type, pending_stock_arrival
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const noteResult = insertNoteStmt.run(
      noteCode,
      finalCustId,
      effectiveCustomerName.trim().toUpperCase(),
      isRestock ? '' : (customer_phone || ''),
      isRestock ? 'TIENDA CENTRAL' : (customer_address || ''),
      date || new Date().toISOString().split('T')[0],
      due_date || date || new Date().toISOString().split('T')[0],
      seller_name || req.user?.name || 'DANIEL',
      isRestock ? 'Reposición a Tienda' : (delivery_type || 'A su tienda'),
      isRestock ? (delivery_destination || 'TIENDA CENTRAL') : (delivery_destination || ''),
      isRestock ? '' : (delivery_location_url || ''),
      notes || '',
      totalBoxes,
      totalUnits,
      totalAmount,
      initialPaid,
      balance,
      status,
      deliveryStatus,
      stockDeducted,
      deliveredAt,
      noteType,
      pendingStockArrival
    );

    if (pendingStockArrival === 1) {
      logSecurityEvent(db, {
        action: 'STOCK_OVERRIDE_PENDING_ARRIVAL',
        actorUser: req.user,
        target: noteCode,
        ip: getClientIp(req),
        details: { customer: effectiveCustomerName, itemsCount: items.length }
      });
    }

    const noteId = noteResult.lastInsertRowid;

    // Insertar Ítems
    const insertItemStmt = db.prepare(`
      INSERT INTO sales_note_items (
        note_id, product_id, sku, description, unit_med, sale_mode,
        boxes_count, units_per_box, quantity, unit_price, subtotal, warehouse_source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const deductStockStmt = db.prepare(`
      UPDATE products 
      SET current_stock = MAX(0, current_stock - ?), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const insertMovementStmt = db.prepare(`
      INSERT INTO inventory_movements (
        product_id, type, quantity, unit_price, total_amount, gross_profit,
        reference, party_name, payment_method, date, notes
      ) VALUES (?, 'SALIDA', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      const mode = item.sale_mode || 'CAJA';
      const unitPrice = parseFloat(item.unit_price) || 0;
      let qtyUnits = 0;
      let sub = 0;
      let boxesCount = 0;
      let upb = 1;

      if (mode === 'CAJA') {
        boxesCount = parseInt(item.boxes_count || 1, 10);
        upb = parseInt(item.units_per_box || 1, 10);
        qtyUnits = boxesCount * upb;
        sub = boxesCount * upb * unitPrice;
      } else {
        qtyUnits = parseInt(item.quantity || 1, 10);
        sub = qtyUnits * unitPrice;
      }

      insertItemStmt.run(
        noteId,
        item.product_id || null,
        item.sku || 'S/C',
        item.description || item.name || '',
        item.unit_med || 'UNI',
        mode,
        boxesCount,
        upb,
        qtyUnits,
        unitPrice,
        sub,
        item.warehouse_source || 'ALMACEN'
      );

      // El stock NO se descuenta al crear la nota, ni sube a la planilla aún.
      // Se descuenta y sube RECIÉN una vez confirmada la entrega (estado ENTREGADO).
      if (isImmediateDelivery && item.product_id && !isPreReserva) {
        deductStockStmt.run(qtyUnits, item.product_id);

        const prod = db.prepare('SELECT landed_cost FROM products WHERE id = ?').get(item.product_id);
        const cost = prod ? prod.landed_cost : 0;
        const profit = sub - (qtyUnits * cost);

        insertMovementStmt.run(
          item.product_id,
          qtyUnits,
          unitPrice,
          sub,
          profit,
          noteCode,
          customer_name.trim().toUpperCase(),
          payments && payments.length > 0 ? payments[0].payment_method : 'Efectivo / Crédito',
          date || new Date().toISOString().split('T')[0],
          `Entrega Inmediata - Nota ${noteCode} (${mode === 'CAJA' ? `${boxesCount} cj` : `${qtyUnits} u`}) - ${item.warehouse_source || 'ALMACEN'}`
        );
      }
    }

    // Registrar abonos si existen
    const insertPaymentStmt = db.prepare(`
      INSERT INTO sales_note_payments (
        note_id, payment_method, account_info, amount, payment_date, registered_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    if (payments && Array.isArray(payments)) {
      for (const p of payments) {
        const amt = parseFloat(p.amount) || 0;
        if (amt > 0) {
          insertPaymentStmt.run(
            noteId,
            p.payment_method || 'Efectivo',
            p.account_info || '',
            amt,
            p.payment_date || date || new Date().toISOString().split('T')[0],
            p.registered_by || seller_name || 'DANIEL'
          );
        }
      }
    }

    // Auto-registrar en Orden del Día para la fecha de venta
    const noteDate = date || new Date().toISOString().split('T')[0];
    const dayOfWeekIdx = new Date(noteDate + 'T12:00:00Z').getDay();
    const dayNames = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    const noteDayName = dayNames[dayOfWeekIdx] || 'LUNES';

    const maxRn = (db.prepare('SELECT COALESCE(MAX(row_num), 0) as max_rn FROM daily_dispatch_orders WHERE date = ?').get(noteDate)?.max_rn || 0) + 1;

    db.prepare(`
      INSERT INTO daily_dispatch_orders (
        date, day_name, supervisor, row_num, activity_or_customer,
        sales_note_id, sales_note_code, morning_shift, afternoon_shift,
        status, observations, extra_observations, pending_tasks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      noteDate,
      noteDayName,
      (seller_name || req.user?.name || 'ENCARGADO').toUpperCase(),
      maxRn,
      effectiveCustomerName.trim().toUpperCase(),
      noteId,
      noteCode,
      req.body.shift === 'TARDE' ? 0 : 1,
      req.body.shift === 'TARDE' ? 1 : 0,
      'EN PREPARACIÓN',
      isRestock ? (delivery_destination || 'TIENDA CENTRAL') : (delivery_destination || customer_address || ''),
      notes || '',
      ''
    );

    logSecurityEvent(db, {
      action: isRestock ? 'RESTOCK_CREATED' : 'NOTE_CREATED',
      actorUser: req.user,
      target: noteCode,
      ip: getClientIp(req),
      details: {
        actor_name: (seller_name || req.user?.name || req.user?.username || 'USUARIO').toUpperCase(),
        customer: effectiveCustomerName.trim().toUpperCase(),
        destination: isRestock ? (delivery_destination || 'TIENDA CENTRAL') : (delivery_destination || customer_address || ''),
        total_boxes: totalBoxes,
        total_units: totalUnits,
        total_amount: totalAmount,
        paid_amount: initialPaid,
        balance_amount: balance,
        items_count: items.length,
        note_type: noteType
      }
    });

    return { noteId, noteCode, totalAmount, balance, status, noteType };
  });

  try {
    const result = createTx();
    res.json({
      success: true,
      data: result,
      message: result.noteType === 'REPOSICION_TIENDA'
        ? `Pedido de reposición ${result.noteCode} enviado a Almacén (en curso y editable hasta llegada a tienda).`
        : `Nota de venta ${result.noteCode} emitida con éxito.`
    });
  } catch (err) {
    console.error('Error creating sales note:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Registrar nuevo abono / pago posterior a la nota
app.post('/api/sales-notes/:id/payments', (req, res) => {
  const { amount, payment_method, account_info, payment_date, registered_by } = req.body;
  const payAmt = parseFloat(amount) || 0;

  if (payAmt <= 0) {
    return res.status(400).json({ success: false, error: 'El monto del abono debe ser mayor a 0.' });
  }

  const tx = db.transaction(() => {
    const note = db.prepare('SELECT * FROM sales_notes WHERE id = ?').get(req.params.id);
    if (!note) {
      throw new Error('Nota de venta no encontrada.');
    }

    db.prepare(`
      INSERT INTO sales_note_payments (
        note_id, payment_method, account_info, amount, payment_date, registered_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.params.id,
      payment_method || 'Efectivo',
      account_info || '',
      payAmt,
      payment_date || new Date().toISOString().split('T')[0],
      registered_by || 'DANIEL'
    );

    const paymentsTotal = db.prepare('SELECT COALESCE(SUM(amount), 0) as paid FROM sales_note_payments WHERE note_id = ?').get(req.params.id).paid || 0;
    const newBalance = Math.max(0, note.total_amount - paymentsTotal);
    const newStatus = newBalance <= 0 ? 'PAGADO' : 'PENDIENTE';

    db.prepare(`
      UPDATE sales_notes 
      SET paid_amount = ?, balance_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(paymentsTotal, newBalance, newStatus, req.params.id);

    if (newStatus === 'PAGADO') {
      db.prepare("UPDATE daily_dispatch_orders SET status = 'ENTREGADO', updated_at = CURRENT_TIMESTAMP WHERE sales_note_id = ?").run(req.params.id);
    }

    logSecurityEvent(db, {
      action: 'PAYMENT_ADDED',
      actorUser: req.user,
      target: note.note_code,
      ip: getClientIp(req),
      details: {
        actor_name: (registered_by || req.user?.name || req.user?.username || 'CAJA').toUpperCase(),
        customer: note.customer_name,
        amount: payAmt,
        payment_method: payment_method || 'Efectivo',
        account_info: account_info || '',
        before_balance: note.balance_amount,
        after_balance: newBalance,
        new_status: newStatus
      }
    });

    return { newPaid: paymentsTotal, newBalance, newStatus, noteCode: note.note_code };
  });

  try {
    const result = tx();
    res.json({ success: true, data: result, message: `Abono de Bs ${payAmt.toFixed(2)} registrado en nota ${result.noteCode}.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Eliminar un abono / pago registrado a una nota (con recálculo de saldo en tiempo real)
app.delete('/api/sales-notes/:id/payments/:paymentId', (req, res) => {
  try {
    const { id: noteId, paymentId } = req.params;
    const tx = db.transaction(() => {
      const note = db.prepare('SELECT * FROM sales_notes WHERE id = ?').get(noteId);
      if (!note) throw new Error('Nota de venta no encontrada.');

      const payment = db.prepare('SELECT * FROM sales_note_payments WHERE id = ? AND note_id = ?').get(paymentId, noteId);
      if (!payment) throw new Error('Abono no encontrado en esta nota.');

      db.prepare('DELETE FROM sales_note_payments WHERE id = ? AND note_id = ?').run(paymentId, noteId);

      const paymentsTotal = db.prepare('SELECT COALESCE(SUM(amount), 0) as paid FROM sales_note_payments WHERE note_id = ?').get(noteId).paid || 0;
      const balance = Math.max(0, note.total_amount - paymentsTotal);
      const status = balance <= 0 ? 'PAGADO' : 'PENDIENTE';

      db.prepare(`
        UPDATE sales_notes 
        SET paid_amount = ?, balance_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(paymentsTotal, balance, status, noteId);

      logSecurityEvent(db, {
        action: 'PAYMENT_DELETED',
        actorUser: req.user,
        target: note.note_code,
        ip: getClientIp(req),
        details: {
          actor_name: (req.user?.name || req.user?.username || 'ADMIN').toUpperCase(),
          customer: note.customer_name,
          deleted_amount: payment.amount,
          payment_method: payment.payment_method,
          before_balance: note.balance_amount,
          after_balance: balance
        }
      });

      return {
        noteId,
        noteCode: note.note_code,
        deletedAmount: payment.amount,
        paid_amount: paymentsTotal,
        balance_amount: balance,
        status
      };
    });

    const result = tx();
    res.json({
      success: true,
      data: result,
      message: `Abono de Bs ${Number(result.deletedAmount).toFixed(2)} eliminado correctamente.`
    });
  } catch (err) {
    console.error('Error deleting payment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Confirmar PRE-RESERVA → convierte en venta real descontando el stock
app.post('/api/sales-notes/:id/confirm-reservation', (req, res) => {
  const confirmTx = db.transaction(() => {
    const note = db.prepare('SELECT * FROM sales_notes WHERE id = ?').get(req.params.id);
    if (!note) throw new Error('Nota de venta no encontrada.');
    if (note.status !== 'PRE-RESERVA') throw new Error(`Esta nota ya no es una pre-reserva (estado actual: ${note.status}).`);

    const items = db.prepare('SELECT * FROM sales_note_items WHERE note_id = ?').all(req.params.id);

    const deductStmt = db.prepare('UPDATE products SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const insertMovStmt = db.prepare(`
      INSERT INTO inventory_movements (
        product_id, type, quantity, unit_cost, unit_price, total_amount, gross_profit,
        reference, party_name, payment_method, date, notes
      ) VALUES (?, 'SALIDA', ?, ?, ?, ?, ?, ?, ?, 'Efectivo / Crédito', ?, ?)
    `);

    for (const item of items) {
      if (!item.product_id) continue;
      deductStmt.run(item.quantity, item.product_id);
      const prod = db.prepare('SELECT landed_cost FROM products WHERE id = ?').get(item.product_id);
      const cost = prod ? prod.landed_cost : 0;
      const profit = item.subtotal - (item.quantity * cost);
      insertMovStmt.run(
        item.product_id,
        item.quantity,
        cost,
        item.unit_price,
        item.subtotal,
        profit,
        note.note_code,
        note.customer_name,
        note.date,
        `Reserva confirmada ${note.note_code} - ${item.description}`
      );
    }

    db.prepare(`
      UPDATE sales_notes SET status = 'PENDIENTE', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.params.id);

    return { noteCode: note.note_code, itemsConfirmed: items.length };
  });

  try {
    const result = confirmTx();
    res.json({
      success: true,
      data: result,
      message: `Pre-reserva ${result.noteCode} confirmada. Stock descontado del inventario. Nota ahora en estado PENDIENTE.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Actualizar nota de venta existente y ajustar stock diferencial (Opción B)
app.put('/api/sales-notes/:id', (req, res) => {
  const {
    customer_id,
    customer_name,
    customer_phone,
    customer_address,
    date,
    due_date,
    seller_name,
    delivery_type,
    delivery_destination,
    delivery_location_url,
    notes,
    items = [],
    payments = []
  } = req.body;

  const noteId = req.params.id;

  if (!customer_name) {
    return res.status(400).json({ success: false, error: 'Nombre de cliente requerido' });
  }

  const updateTx = db.transaction(() => {
    const existingNote = db.prepare('SELECT * FROM sales_notes WHERE id = ?').get(noteId);
    if (!existingNote) {
      throw new Error('Nota de venta no encontrada.');
    }
    if (existingNote.status === 'ANULADO') {
      throw new Error('No se puede editar una nota anulada.');
    }

    const isRestock = existingNote.note_type === 'REPOSICION_TIENDA' || req.body.note_type === 'REPOSICION_TIENDA';
    const allowPendingArrival = Boolean(req.body.allow_pending_arrival) || existingNote.pending_stock_arrival === 1;
    const wasStockDeducted = !isRestock && existingNote.stock_deducted === 1;

    // 1. Revertir deducción de stock y movimientos antiguos SOLO si ya se había descontado
    if (wasStockDeducted) {
      const oldItems = db.prepare('SELECT * FROM sales_note_items WHERE note_id = ?').all(noteId);
      const restoreStockStmt = db.prepare('UPDATE products SET current_stock = current_stock + ? WHERE id = ?');
      for (const oi of oldItems) {
        if (oi.product_id) {
          restoreStockStmt.run(oi.quantity, oi.product_id);
        }
      }
      db.prepare('DELETE FROM inventory_movements WHERE reference = ?').run(existingNote.note_code);
    }

    // 1b. Smart Stock Validation (Option 2) on VENTA edits
    let hasEditShortage = false;
    if (!isRestock && existingNote.status !== 'PRE-RESERVA') {
      const reqMap = new Map();
      for (const item of items) {
        if (!item.product_id) continue;
        const mode = item.sale_mode || 'CAJA';
        const q = mode === 'CAJA'
          ? parseInt(item.boxes_count || 1, 10) * parseInt(item.units_per_box || 1, 10)
          : parseInt(item.quantity || 1, 10);
        reqMap.set(item.product_id, (reqMap.get(item.product_id) || 0) + q);
      }
      const shortages = [];
      for (const [pid, reqQty] of reqMap.entries()) {
        const prod = db.prepare('SELECT sku, name, current_stock FROM products WHERE id = ?').get(pid);
        if (prod) {
          const avail = Math.max(0, Number(prod.current_stock || 0));
          if (reqQty > avail) {
            shortages.push(`${prod.sku}: pides ${reqQty} u., disponible ${avail} u.`);
          }
        }
      }
      if (shortages.length > 0) {
        hasEditShortage = true;
        if (!allowPendingArrival) {
          throw new Error(`Stock insuficiente: ${shortages.join(' | ')}. Ingresa el stock rápido o marca "Mercadería recién llegada".`);
        }
      }
    }

    db.prepare('DELETE FROM sales_note_items WHERE note_id = ?').run(noteId);

    // 2. Insertar nuevos ítems y descontar stock actualizado SOLO si está entregada
    let totalBoxes = 0;
    let totalUnits = 0;
    let totalAmount = 0;

    const insertItemStmt = db.prepare(`
      INSERT INTO sales_note_items (
        note_id, product_id, sku, description, unit_med, sale_mode,
        boxes_count, units_per_box, quantity, unit_price, subtotal, warehouse_source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const deductStockStmt = db.prepare(`
      UPDATE products 
      SET current_stock = MAX(0, current_stock - ?), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const insertMovementStmt = db.prepare(`
      INSERT INTO inventory_movements (
        product_id, type, quantity, unit_price, total_amount, gross_profit,
        reference, party_name, payment_method, date, notes
      ) VALUES (?, 'SALIDA', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      const mode = item.sale_mode || 'CAJA';
      const unitPrice = parseFloat(item.unit_price) || 0;
      let qtyUnits = 0;
      let sub = 0;
      let boxesCount = 0;
      let upb = 1;

      if (mode === 'CAJA') {
        boxesCount = parseInt(item.boxes_count || 1, 10);
        upb = parseInt(item.units_per_box || 1, 10);
        qtyUnits = boxesCount * upb;
        sub = boxesCount * upb * unitPrice;
        totalBoxes += boxesCount;
      } else {
        qtyUnits = parseInt(item.quantity || 1, 10);
        sub = qtyUnits * unitPrice;
      }

      totalUnits += qtyUnits;
      totalAmount += sub;

      insertItemStmt.run(
        noteId,
        item.product_id || null,
        item.sku || 'S/C',
        item.description || item.name || '',
        item.unit_med || 'UNI',
        mode,
        boxesCount,
        upb,
        qtyUnits,
        unitPrice,
        sub,
        item.warehouse_source || 'ALMACEN'
      );

      // Descontar stock SOLO si la nota ya estaba confirmada como entregada
      if (wasStockDeducted && item.product_id) {
        deductStockStmt.run(qtyUnits, item.product_id);

        const prod = db.prepare('SELECT landed_cost FROM products WHERE id = ?').get(item.product_id);
        const cost = prod ? prod.landed_cost : 0;
        const profit = sub - (qtyUnits * cost);

        insertMovementStmt.run(
          item.product_id,
          qtyUnits,
          unitPrice,
          sub,
          profit,
          existingNote.note_code,
          customer_name.trim().toUpperCase(),
          'Venta Modificada',
          date || existingNote.date,
          `Nota ${existingNote.note_code} (${mode === 'CAJA' ? `${boxesCount} cj` : `${qtyUnits} u`}) - ${item.warehouse_source || 'ALMACEN'}`
        );
      }
    }

    // 3. Registrar nuevos abonos o pagos a cuenta si se enviaron
    if (payments && Array.isArray(payments)) {
      const insertPaymentStmt = db.prepare(`
        INSERT INTO sales_note_payments (
          note_id, payment_method, account_info, amount, payment_date, registered_by
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const p of payments) {
        const amt = parseFloat(p.amount) || 0;
        if (amt > 0 && (!p.id || p.is_new)) {
          insertPaymentStmt.run(
            noteId,
            p.payment_method || 'Efectivo',
            p.account_info || '',
            amt,
            p.payment_date || date || existingNote.date,
            p.registered_by || seller_name || existingNote.seller_name || 'DANIEL'
          );
        }
      }
    }

    // Recalcular saldo con todos los pagos registrados (Reposición a Tienda siempre Bs 0 / sin deuda)
    const paymentsTotal = isRestock
      ? 0
      : (db.prepare('SELECT COALESCE(SUM(amount), 0) as paid FROM sales_note_payments WHERE note_id = ?').get(noteId).paid || 0);
    const finalTotalAmount = isRestock ? 0 : totalAmount;
    const balance = isRestock ? 0 : Math.max(0, finalTotalAmount - paymentsTotal);
    const status = isRestock
      ? (existingNote.status === 'RECIBIDO' ? 'RECIBIDO' : 'EN_CURSO')
      : (balance <= 0 ? 'PAGADO' : 'PENDIENTE');

    db.prepare(`
      UPDATE sales_notes SET
        customer_id = ?,
        customer_name = ?,
        customer_phone = ?,
        customer_address = ?,
        date = ?,
        due_date = ?,
        seller_name = ?,
        delivery_type = ?,
        delivery_destination = ?,
        delivery_location_url = ?,
        notes = ?,
        total_boxes = ?,
        total_units = ?,
        total_amount = ?,
        paid_amount = ?,
        balance_amount = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      isRestock ? null : (customer_id || existingNote.customer_id),
      customer_name.trim().toUpperCase(),
      isRestock ? '' : (customer_phone || ''),
      isRestock ? 'TIENDA CENTRAL' : (customer_address || ''),
      date || existingNote.date,
      due_date || existingNote.due_date,
      seller_name || existingNote.seller_name,
      isRestock ? 'Reposición a Tienda' : (delivery_type || existingNote.delivery_type),
      delivery_destination || existingNote.delivery_destination,
      isRestock ? '' : (delivery_location_url || existingNote.delivery_location_url),
      notes || '',
      totalBoxes,
      totalUnits,
      finalTotalAmount,
      paymentsTotal,
      balance,
      status,
      noteId
    );

    // 4. Actualizar nombre y destino en daily_dispatch_orders
    db.prepare(`
      UPDATE daily_dispatch_orders 
      SET activity_or_customer = ?, observations = ?, updated_at = CURRENT_TIMESTAMP
      WHERE sales_note_id = ?
    `).run(
      customer_name.trim().toUpperCase(),
      delivery_destination || '',
      noteId
    );

    if (status === 'PAGADO') {
      db.prepare("UPDATE daily_dispatch_orders SET status = 'ENTREGADO', updated_at = CURRENT_TIMESTAMP WHERE sales_note_id = ? AND status != 'ENTREGADO'").run(noteId);
    }

    // 5. Registrar en Bitácora de Auditoría exactamente qué se modificó (Antes vs Después)
    const changes = [];
    if ((existingNote.customer_name || '') !== customer_name.trim().toUpperCase()) {
      changes.push(`Cliente: "${existingNote.customer_name}" → "${customer_name.trim().toUpperCase()}"`);
    }
    if (Number(existingNote.total_boxes || 0) !== Number(totalBoxes)) {
      changes.push(`Cajas: ${existingNote.total_boxes || 0} cj → ${totalBoxes} cj`);
    }
    if (Number(existingNote.total_units || 0) !== Number(totalUnits)) {
      changes.push(`Unidades: ${existingNote.total_units || 0} u. → ${totalUnits} u.`);
    }
    if (!isRestock && Number(existingNote.total_amount || 0) !== Number(finalTotalAmount)) {
      changes.push(`Total: Bs ${Number(existingNote.total_amount || 0).toFixed(2)} → Bs ${Number(finalTotalAmount).toFixed(2)}`);
    }
    if (!isRestock && Number(existingNote.paid_amount || 0) !== Number(paymentsTotal)) {
      changes.push(`A cuenta: Bs ${Number(existingNote.paid_amount || 0).toFixed(2)} → Bs ${Number(paymentsTotal).toFixed(2)}`);
    }
    if ((existingNote.delivery_destination || '') !== (delivery_destination || existingNote.delivery_destination || '')) {
      changes.push(`Destino: "${existingNote.delivery_destination || '-'}" → "${delivery_destination || '-'}"`);
    }
    if (changes.length === 0) {
      changes.push(`Actualización de productos/observaciones (${items.length} ítems)`);
    }

    logSecurityEvent(db, {
      action: 'NOTE_UPDATED',
      actorUser: req.user,
      target: existingNote.note_code,
      ip: getClientIp(req),
      details: {
        actor_name: (req.user?.name || seller_name || existingNote.seller_name || 'USUARIO').toUpperCase(),
        customer: customer_name.trim().toUpperCase(),
        note_type: existingNote.note_type || 'VENTA',
        changes,
        before: {
          customer_name: existingNote.customer_name,
          total_boxes: existingNote.total_boxes,
          total_units: existingNote.total_units,
          total_amount: existingNote.total_amount,
          paid_amount: existingNote.paid_amount,
          balance_amount: existingNote.balance_amount
        },
        after: {
          customer_name: customer_name.trim().toUpperCase(),
          total_boxes: totalBoxes,
          total_units: totalUnits,
          total_amount: finalTotalAmount,
          paid_amount: paymentsTotal,
          balance_amount: balance
        }
      }
    });

    return { noteId, noteCode: existingNote.note_code, totalAmount, paidAmount: paymentsTotal, balance, status };
  });

  try {
    const result = updateTx();
    res.json({
      success: true,
      data: result,
      message: `Nota ${result.noteCode} actualizada con éxito. Stock de inventario sincronizado.`
    });
  } catch (err) {
    console.error('Error updating sales note:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Marcar nota como ENTREGADO y registrar liquidación de cobro / deuda
app.post('/api/sales-notes/:id/deliver', (req, res) => {
  const {
    payment_type, // 'PAGO', 'COMPLETO', 'PARCIAL', 'CREDITO'
    amount_paid,
    payment_method,
    is_mixed,
    amount_cash,
    amount_qr,
    amount_discount,
    qr_account,
    account_info,
    registered_by,
    due_date,
    notes
  } = req.body;

  const noteId = req.params.id;

  const deliverTx = db.transaction(() => {
    const note = db.prepare('SELECT * FROM sales_notes WHERE id = ?').get(noteId);
    if (!note) throw new Error('Nota de venta no encontrada.');
    if (note.status === 'ANULADO') throw new Error('No se puede entregar una nota anulada.');

    const collector = registered_by || 'ENTREGA';
    const paymentDateStr = req.body.payment_date || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

    if (payment_type !== 'CREDITO') {
      if (is_mixed || payment_method === 'POR EFECTIVO Y TRANSFERENCIA') {
        const cashVal = parseFloat(amount_cash) || 0;
        const qrVal = parseFloat(amount_qr) || 0;
        const discountVal = parseFloat(amount_discount) || 0;
        const qrAcc = qr_account || 'CUENTA JAIME';

        if (cashVal > 0) {
          db.prepare(`
            INSERT INTO sales_note_payments (
              note_id, payment_method, account_info, amount, payment_date, registered_by
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            noteId,
            'POR EFECTIVO',
            account_info ? `${account_info} - Parte Efectivo` : 'Pago en Efectivo',
            cashVal,
            paymentDateStr,
            collector
          );
        }

        if (qrVal > 0) {
          db.prepare(`
            INSERT INTO sales_note_payments (
              note_id, payment_method, account_info, amount, payment_date, registered_by
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            noteId,
            `POR TRANSFERENCIA QR ${qrAcc}`,
            account_info ? `${account_info} - Parte QR ${qrAcc}` : `Transferencia QR ${qrAcc}`,
            qrVal,
            paymentDateStr,
            collector
          );
        }

        if (discountVal > 0) {
          db.prepare(`
            INSERT INTO sales_note_payments (
              note_id, payment_method, account_info, amount, payment_date, registered_by
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            noteId,
            'REBAJA / DESCUENTO',
            account_info ? `${account_info} - Rebaja aplicada` : 'Rebaja / Descuento aplicado',
            discountVal,
            paymentDateStr,
            collector
          );
        }
      } else if (payment_type === 'COMPLETO' && amount_paid === undefined) {
        const remainingBalance = note.balance_amount;
        if (remainingBalance > 0) {
          db.prepare(`
            INSERT INTO sales_note_payments (
              note_id, payment_method, account_info, amount, payment_date, registered_by
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            noteId,
            payment_method || 'POR EFECTIVO',
            account_info || '',
            remainingBalance,
            paymentDateStr,
            collector
          );
        }
      } else {
        const paidAmt = parseFloat(amount_paid) || 0;
        if (paidAmt > 0) {
          db.prepare(`
            INSERT INTO sales_note_payments (
              note_id, payment_method, account_info, amount, payment_date, registered_by
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            noteId,
            payment_method || 'POR EFECTIVO',
            account_info || '',
            paidAmt,
            paymentDateStr,
            collector
          );
        }
      }
    }

    const paymentsTotal = db.prepare('SELECT COALESCE(SUM(amount), 0) as paid FROM sales_note_payments WHERE note_id = ?').get(noteId).paid || 0;
    const newPaid = paymentsTotal;
    const newBalance = Math.max(0, note.total_amount - newPaid);
    const newStatus = newBalance <= 0 ? 'PAGADO' : 'PENDIENTE';
    const finalDueDate = due_date || note.due_date;
    const deliveryDate = new Date().toISOString().split('T')[0];

    db.prepare(`
      UPDATE sales_notes 
      SET paid_amount = ?, balance_amount = ?, status = ?, due_date = ?,
          delivery_status = 'ENTREGADO', stock_deducted = 1, delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newPaid, newBalance, newStatus, finalDueDate, noteId);

    // Actualizar estado en orden del día a ENTREGADO
    db.prepare(`
      UPDATE daily_dispatch_orders 
      SET status = 'ENTREGADO', updated_at = CURRENT_TIMESTAMP
      WHERE sales_note_id = ?
    `).run(noteId);

    // DESCONTAR RECIÉN EL STOCK FÍSICO AL CONFIRMAR LA ENTREGA (nunca baja de 0 para evitar negativos)
    if (!note.stock_deducted || note.stock_deducted === 0) {
      const noteItems = db.prepare('SELECT * FROM sales_note_items WHERE note_id = ?').all(noteId);
      const deductStockStmt = db.prepare('UPDATE products SET current_stock = MAX(0, current_stock - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      const insertMovementStmt = db.prepare(`
        INSERT INTO inventory_movements (
          product_id, type, quantity, unit_price, total_amount, gross_profit,
          reference, party_name, payment_method, date, notes
        ) VALUES (?, 'SALIDA', ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const it of noteItems) {
        if (it.product_id) {
          deductStockStmt.run(it.quantity, it.product_id);

          const prod = db.prepare('SELECT landed_cost FROM products WHERE id = ?').get(it.product_id);
          const cost = prod ? prod.landed_cost : 0;
          const profit = it.subtotal - (it.quantity * cost);

          insertMovementStmt.run(
            it.product_id,
            it.quantity,
            it.unit_price,
            it.subtotal,
            profit,
            note.note_code,
            note.customer_name,
            payment_method || 'Entrega Confirmada',
            deliveryDate,
            `Entrega Confirmada - Nota ${note.note_code} (${it.quantity} u.)`
          );
        }
      }
    }

    logSecurityEvent(db, {
      action: 'NOTE_DELIVERED',
      actorUser: req.user,
      target: note.note_code,
      ip: getClientIp(req),
      details: {
        actor_name: (registered_by || req.user?.name || req.user?.username || 'ALMACÉN').toUpperCase(),
        customer: note.customer_name,
        total_boxes: note.total_boxes,
        total_units: note.total_units,
        total_amount: note.total_amount,
        paid_amount: newPaid,
        balance_amount: newBalance,
        payment_type: payment_type || 'ENTREGA',
        status: newStatus
      }
    });

    return {
      noteCode: note.note_code,
      newPaid,
      newBalance,
      newStatus,
      dispatchStatus: 'ENTREGADO'
    };
  });

  try {
    const result = deliverTx();
    res.json({
      success: true,
      data: result,
      message: `¡Pedido ${result.noteCode} marcado como ENTREGADO y liquidación registrada con éxito!`
    });
  } catch (err) {
    console.error('Error delivering sales note:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Confirmar llegada física de Reposición a Tienda (Sin cobro, sin afectar stock general — Opción 1)
app.post('/api/sales-notes/:id/confirm-restock', (req, res) => {
  try {
    const noteId = req.params.id;
    const note = db.prepare('SELECT * FROM sales_notes WHERE id = ?').get(noteId);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Pedido de reposición no encontrado.' });
    }
    if (note.note_type !== 'REPOSICION_TIENDA') {
      return res.status(400).json({ success: false, error: 'Esta nota no es un pedido de reposición interna.' });
    }
    if (note.status === 'ANULADO') {
      return res.status(400).json({ success: false, error: 'Este pedido fue anulado.' });
    }

    const confirmedBy = (req.body?.confirmed_by || req.user?.name || req.user?.username || 'TIENDA').trim().toUpperCase();
    const nowIso = new Date().toISOString();

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE sales_notes SET
          status = 'RECIBIDO',
          delivery_status = 'ENTREGADO',
          delivered_at = ?,
          restock_confirmed_by = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(nowIso, confirmedBy, noteId);

      db.prepare(`
        UPDATE daily_dispatch_orders SET
          status = 'ENTREGADO',
          updated_at = CURRENT_TIMESTAMP
        WHERE sales_note_id = ?
      `).run(noteId);
    });
    tx();

    logSecurityEvent(db, {
      action: 'RESTOCK_CONFIRMED',
      actorUser: req.user,
      target: note.note_code,
      ip: getClientIp(req),
      details: { confirmedBy, total_boxes: note.total_boxes, total_units: note.total_units }
    });

    const updated = db.prepare('SELECT * FROM sales_notes WHERE id = ?').get(noteId);
    res.json({
      success: true,
      data: updated,
      message: `Reposición ${note.note_code} confirmada como RECIBIDA EN TIENDA por ${confirmedBy}.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Anular nota de venta y reponer inventario
app.delete('/api/sales-notes/:id', requireRoles('SUPER_ADMIN', 'ADMIN', 'VENTAS'), (req, res) => {
  const tx = db.transaction(() => {
    const note = db.prepare('SELECT * FROM sales_notes WHERE id = ?').get(req.params.id);
    if (!note) throw new Error('Nota no encontrada');
    if (note.status === 'ANULADO') throw new Error('La nota ya se encuentra anulada.');
    logSecurityEvent(db, {
      action: 'NOTE_CANCELLED',
      actorUser: req.user,
      target: note.note_code || `note:${req.params.id}`,
      ip: getClientIp(req),
      details: { customer: note.customer_name, total: note.total_amount }
    });

    // Reponer stock SOLO si el stock fue descontado previamente al confirmar entrega (stock_deducted === 1)
    if (note.stock_deducted === 1) {
      const items = db.prepare('SELECT * FROM sales_note_items WHERE note_id = ?').all(req.params.id);
      const restoreStockStmt = db.prepare('UPDATE products SET current_stock = current_stock + ? WHERE id = ?');
      for (const item of items) {
        if (item.product_id) {
          restoreStockStmt.run(item.quantity, item.product_id);
        }
      }
      // Eliminar movimientos de salida asociados
      db.prepare('DELETE FROM inventory_movements WHERE reference = ?').run(note.note_code);
    }

    // Cambiar estado a ANULADO
    db.prepare("UPDATE sales_notes SET status = 'ANULADO', delivery_status = 'CANCELADO', stock_deducted = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);

    // Sincronizar estado en orden del día
    db.prepare("UPDATE daily_dispatch_orders SET status = 'CANCELADO', updated_at = CURRENT_TIMESTAMP WHERE sales_note_id = ?").run(req.params.id);

    return { noteCode: note.note_code };
  });

  try {
    const result = tx();
    res.json({ success: true, message: `Nota ${result.noteCode} anulada y el stock fue repuesto al inventario.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== ORDEN DEL DÍA / CONTROL DIARIO ====================
app.get('/api/daily-orders', (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, error: 'Fecha requerida' });
    }

    const orders = db.prepare(`
      SELECT 
        ddo.*,
        sn.status AS note_status,
        sn.note_type AS note_type,
        sn.delivery_status AS note_delivery_status,
        sn.total_boxes AS note_total_boxes,
        sn.total_units AS note_total_units,
        sn.restock_confirmed_by AS restock_confirmed_by,
        sn.total_amount AS note_total,
        sn.paid_amount AS note_paid,
        sn.balance_amount AS note_balance,
        sn.due_date AS note_due_date,
        sn.date AS note_date,
        sn.customer_name AS note_customer_name,
        sn.seller_name AS note_seller_name
      FROM daily_dispatch_orders ddo
      LEFT JOIN sales_notes sn ON ddo.sales_note_id = sn.id
      WHERE ddo.date = ? 
      ORDER BY ddo.row_num ASC, ddo.id ASC
    `).all(date);

    const sideItems = db.prepare(`
      SELECT * FROM daily_dispatch_side_items 
      WHERE date = ? 
      ORDER BY section ASC, row_num ASC, id ASC
    `).all(date);

    // Also get sales notes created on this date
    const dateSalesNotes = db.prepare(`
      SELECT id, note_code, customer_name, seller_name, total_amount, paid_amount, balance_amount, status, delivery_destination
      FROM sales_notes
      WHERE date = ? AND status != 'ANULADO'
      ORDER BY id ASC
    `).all(date);

    const firstNoteCreator = orders.find(o => o.note_seller_name)?.note_seller_name 
      || dateSalesNotes.find(n => n.seller_name)?.seller_name 
      || '';

    const savedMeta = db.prepare(`
      SELECT * FROM daily_dispatch_meta WHERE date = ?
    `).get(date);

    const meta = {
      supervisor: (savedMeta?.supervisor && savedMeta.supervisor !== 'TITO') 
        ? savedMeta.supervisor 
        : (firstNoteCreator || savedMeta?.supervisor || ''),
      notes: savedMeta?.notes || ''
    };

    // Pre-reservas activas sobre camiones / contenedores que están en camino o en tránsito
    const truckReservations = db.prepare(`
      SELECT 
        cr.id AS reservation_id,
        cr.container_id,
        cr.customer_name,
        cr.customer_phone,
        cr.reserved_boxes,
        cr.reserved_units,
        cr.price_agreed,
        cr.status AS reservation_status,
        cr.notes AS reservation_notes,
        cr.created_at AS reservation_created_at,
        ci.product_code,
        ci.product_name,
        ci.units_per_box,
        c.tracking_number,
        c.status AS container_status,
        c.transport_type,
        c.truck_plate,
        c.truck_driver,
        c.estimated_arrival,
        c.shipping_line
      FROM container_reservations cr
      JOIN container_items ci ON cr.container_item_id = ci.id
      JOIN containers c ON cr.container_id = c.id
      WHERE cr.status != 'CANCELADO' 
        AND LOWER(c.status) NOT IN ('recibido', 'descargado')
      ORDER BY c.id DESC, cr.customer_name ASC, cr.id ASC
    `).all();

    // Notas de venta en estado PRE-RESERVA (si las hubiera)
    const preReservaSalesNotes = db.prepare(`
      SELECT id, note_code, customer_name, customer_phone, total_boxes, total_units, total_amount, status, notes, date
      FROM sales_notes
      WHERE status = 'PRE-RESERVA' OR notes LIKE '%Pre-Reserva%'
      ORDER BY id DESC
    `).all();

    res.json({
      success: true,
      data: {
        date,
        supervisor: meta.supervisor || 'TITO',
        metaNotes: meta.notes || '',
        orders,
        sideItems,
        dateSalesNotes,
        truckReservations,
        preReservaSalesNotes
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint dedicado para consultar pre-reservas de camiones por llegar
app.get('/api/daily-orders/truck-reservations', (req, res) => {
  try {
    const reservations = db.prepare(`
      SELECT 
        cr.id AS reservation_id,
        cr.container_id,
        cr.customer_name,
        cr.customer_phone,
        cr.reserved_boxes,
        cr.reserved_units,
        cr.price_agreed,
        cr.status AS reservation_status,
        cr.notes AS reservation_notes,
        cr.created_at AS reservation_created_at,
        ci.product_code,
        ci.product_name,
        ci.units_per_box,
        c.tracking_number,
        c.status AS container_status,
        c.transport_type,
        c.truck_plate,
        c.truck_driver,
        c.estimated_arrival,
        c.shipping_line
      FROM container_reservations cr
      JOIN container_items ci ON cr.container_item_id = ci.id
      JOIN containers c ON cr.container_id = c.id
      WHERE cr.status != 'CANCELADO' 
        AND LOWER(c.status) NOT IN ('recibido', 'descargado')
      ORDER BY c.id DESC, cr.customer_name ASC, cr.id ASC
    `).all();

    res.json({ success: true, data: reservations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/daily-orders/save', (req, res) => {
  try {
    const { date, dayName, supervisor, orders = [], sideItems = [] } = req.body;
    if (!date) {
      return res.status(400).json({ success: false, error: 'Fecha requerida' });
    }

    const saveTx = db.transaction(() => {
      // 1. Update meta
      db.prepare(`
        INSERT OR REPLACE INTO daily_dispatch_meta (date, supervisor, notes)
        VALUES (?, ?, ?)
      `).run(date, supervisor || 'TITO', '');

      // 2. Replace orders for this date
      db.prepare('DELETE FROM daily_dispatch_orders WHERE date = ?').run(date);
      const insertOrder = db.prepare(`
        INSERT INTO daily_dispatch_orders (
          date, day_name, supervisor, row_num, activity_or_customer,
          sales_note_id, sales_note_code, morning_shift, afternoon_shift,
          status, observations, extra_observations, pending_tasks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      orders.forEach((o, index) => {
        insertOrder.run(
          date,
          dayName || 'LUNES',
          supervisor || 'TITO',
          index + 1,
          o.activity_or_customer || '',
          o.sales_note_id || null,
          o.sales_note_code || null,
          o.morning_shift ? 1 : 0,
          o.afternoon_shift ? 1 : 0,
          o.status || 'IMPRESO',
          o.observations || '',
          o.extra_observations || '',
          o.pending_tasks || ''
        );

        // Si se marca como ENTREGADO, descontar stock físico si aún no se había descontado
        if (o.sales_note_id) {
          const note = db.prepare('SELECT * FROM sales_notes WHERE id = ?').get(o.sales_note_id);
          if (note && note.status !== 'ANULADO') {
            if (o.status === 'ENTREGADO' && (!note.stock_deducted || note.stock_deducted === 0)) {
              // Descontar inventario físico recién ahora
              const noteItems = db.prepare('SELECT * FROM sales_note_items WHERE note_id = ?').all(o.sales_note_id);
              const deductStmt = db.prepare('UPDATE products SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
              const movStmt = db.prepare(`
                INSERT INTO inventory_movements (
                  product_id, type, quantity, unit_price, total_amount, gross_profit,
                  reference, party_name, payment_method, date, notes
                ) VALUES (?, 'SALIDA', ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `);

              for (const it of noteItems) {
                if (it.product_id) {
                  deductStmt.run(it.quantity, it.product_id);
                  const prod = db.prepare('SELECT landed_cost FROM products WHERE id = ?').get(it.product_id);
                  const cost = prod ? prod.landed_cost : 0;
                  const profit = it.subtotal - (it.quantity * cost);
                  movStmt.run(
                    it.product_id, it.quantity, it.unit_price, it.subtotal, profit,
                    note.note_code, note.customer_name, 'Entrega Confirmada', date,
                    `Entrega Confirmada en Orden del Día - Nota ${note.note_code}`
                  );
                }
              }

              db.prepare(`UPDATE sales_notes SET delivery_status = 'ENTREGADO', stock_deducted = 1, delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(o.sales_note_id);
            } else if (o.status !== 'ENTREGADO' && note.stock_deducted === 1) {
              // Si se revirtió el estado de ENTREGADO a otro estado, reponer stock
              const noteItems = db.prepare('SELECT * FROM sales_note_items WHERE note_id = ?').all(o.sales_note_id);
              const restoreStmt = db.prepare('UPDATE products SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
              for (const it of noteItems) {
                if (it.product_id) {
                  restoreStmt.run(it.quantity, it.product_id);
                }
              }
              db.prepare('DELETE FROM inventory_movements WHERE reference = ?').run(note.note_code);
              db.prepare(`UPDATE sales_notes SET delivery_status = ?, stock_deducted = 0, delivered_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(o.status || 'PENDIENTE', o.sales_note_id);
            }
          }
        }
      });

      // 3. Replace side items for this date
      db.prepare('DELETE FROM daily_dispatch_side_items WHERE date = ?').run(date);
      const insertSide = db.prepare(`
        INSERT INTO daily_dispatch_side_items (
          date, section, title, status, notes, row_num
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      sideItems.forEach((s, index) => {
        if (s.title && s.title.trim()) {
          insertSide.run(
            date,
            s.section || 'PENDIENTES',
            s.title.trim(),
            s.status || 'PENDIENTE',
            s.notes || '',
            index + 1
          );
        }
      });
    });

    saveTx();
    res.json({ success: true, message: `Orden del Día guardada correctamente para ${date}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/daily-orders/sync-notes', (req, res) => {
  try {
    const { date, dayName, supervisor } = req.body;
    if (!date) return res.status(400).json({ success: false, error: 'Fecha requerida' });

    const notes = db.prepare(`
      SELECT * FROM sales_notes 
      WHERE date = ? AND status != 'ANULADO'
      ORDER BY id ASC
    `).all(date);

    if (notes.length === 0) {
      return res.json({ success: true, message: 'No hay notas de venta registradas para esta fecha.', added: 0 });
    }

    const currentRows = db.prepare('SELECT sales_note_id, activity_or_customer FROM daily_dispatch_orders WHERE date = ?').all(date);
    const existingNoteIds = new Set(currentRows.map(r => r.sales_note_id).filter(Boolean));

    const insertOrder = db.prepare(`
      INSERT INTO daily_dispatch_orders (
        date, day_name, supervisor, row_num, activity_or_customer,
        sales_note_id, sales_note_code, morning_shift, afternoon_shift,
        status, observations, extra_observations, pending_tasks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let countAdded = 0;
    let maxRowNum = db.prepare('SELECT COALESCE(MAX(row_num), 0) as max_rn FROM daily_dispatch_orders WHERE date = ?').get(date).max_rn;

    const tx = db.transaction(() => {
      for (const n of notes) {
        if (!existingNoteIds.has(n.id)) {
          maxRowNum++;
          insertOrder.run(
            date,
            dayName || 'LUNES',
            supervisor || 'TITO',
            maxRowNum,
            n.customer_name,
            n.id,
            n.note_code,
            1, // Horario Mañana checked por defecto
            0,
            n.status === 'PAGADO' ? 'ENTREGADO' : 'IMPRESO',
            n.delivery_destination || n.customer_address || '',
            '',
            ''
          );
          countAdded++;
        }
      }
    });

    tx();
    res.json({ success: true, message: `Se agregaron ${countAdded} notas de venta a la Orden del Día.`, added: countAdded });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset Demo Data (Protected)
app.post('/api/reset-demo', (req, res) => {
  try {
    const prodCount = db.prepare('SELECT count(*) as c FROM products').get().c;
    if (prodCount > 15) {
      return res.status(400).json({ 
        success: false, 
        error: `Acción bloqueada: Existen ${prodCount} productos reales en la base de datos. Para proteger su inventario real, no se puede reiniciar a modo demostración.` 
      });
    }
    seedDatabase();
    res.json({ success: true, message: 'Base de datos reiniciada con datos de demostración de Importadora' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================================
// CONTAINERS / SHIPMENTS — Unique Item & Single-Container Routes
// (Primary container CRUD routes live earlier in this file)
// =============================================================================

// GET single container
app.get('/api/containers/:id', (req, res) => {
  try {
    const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(req.params.id);
    if (!container) return res.status(404).json({ success: false, error: 'Contenedor no encontrado' });
    res.json({ success: true, data: container });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update single container item (inline editing)
app.put('/api/containers/items/:itemId', (req, res) => {
  try {
    const { itemId } = req.params;
    const {
      product_code, product_name, boxes_count, units_per_box, total_units,
      unit_cost, previous_cost, previous_price, margin_percent,
      price_mayor, price_caja, price_special, price_discount_25, price_adjustment_20,
      reserved_boxes, notes
    } = req.body;

    const current = db.prepare('SELECT * FROM container_items WHERE id = ?').get(itemId);
    if (!current) return res.status(404).json({ success: false, error: 'Item no encontrado' });

    const newBoxes = boxes_count !== undefined ? Number(boxes_count) : current.boxes_count;
    const newPerBox = units_per_box !== undefined ? Number(units_per_box) : current.units_per_box;
    const newTotal = total_units !== undefined ? Number(total_units) : newBoxes * newPerBox;

    db.prepare(`
      UPDATE container_items SET
        product_code = ?,
        product_name = ?,
        boxes_count = ?,
        units_per_box = ?,
        total_units = ?,
        unit_cost = ?,
        previous_cost = ?,
        previous_price = ?,
        margin_percent = ?,
        price_mayor = ?,
        price_caja = ?,
        price_special = ?,
        price_discount_25 = ?,
        price_adjustment_20 = ?,
        reserved_boxes = ?,
        notes = ?
      WHERE id = ?
    `).run(
      product_code ?? current.product_code,
      product_name ?? current.product_name,
      newBoxes,
      newPerBox,
      newTotal,
      unit_cost !== undefined ? Number(unit_cost) : current.unit_cost,
      previous_cost !== undefined ? Number(previous_cost) : current.previous_cost,
      previous_price !== undefined ? Number(previous_price) : (current.previous_price || 0),
      margin_percent !== undefined ? Number(margin_percent) : current.margin_percent,
      price_mayor !== undefined ? Number(price_mayor) : current.price_mayor,
      price_caja !== undefined ? Number(price_caja) : current.price_caja,
      price_special !== undefined ? Number(price_special) : current.price_special,
      price_discount_25 !== undefined ? Number(price_discount_25) : current.price_discount_25,
      price_adjustment_20 !== undefined ? Number(price_adjustment_20) : current.price_adjustment_20,
      reserved_boxes !== undefined ? Number(reserved_boxes) : current.reserved_boxes,
      notes !== undefined ? notes : current.notes,
      itemId
    );

    const updated = db.prepare('SELECT * FROM container_items WHERE id = ?').get(itemId);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE single container item
app.delete('/api/containers/items/:itemId', (req, res) => {
  try {
    const item = db.prepare('SELECT id FROM container_items WHERE id = ?').get(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, error: 'Item no encontrado' });
    db.prepare('DELETE FROM container_reservations WHERE container_item_id = ?').run(req.params.itemId);
    db.prepare('DELETE FROM container_items WHERE id = ?').run(req.params.itemId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =============================================================================
// USERS & ROLES MANAGEMENT (Gestión Segura de Trabajadores y Roles)
// =============================================================================

// GET all users (SUPER_ADMIN / ADMIN only — NEVER returns pin_code)
app.get('/api/users', requireRoles('SUPER_ADMIN', 'ADMIN'), (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, username, role, phone, email, avatar_color, avatar_url, status, notes, created_at, updated_at
      FROM users
      ORDER BY id ASC
    `).all();
    res.json({ success: true, data: users.map(u => ({ ...u, has_pin: true })) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single user (SUPER_ADMIN / ADMIN or self — NEVER returns pin_code)
app.get('/api/users/:id', (req, res) => {
  try {
    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
    if (!isAdmin && String(req.user.id) !== String(req.params.id)) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para ver este perfil de usuario' });
    }
    const user = db.prepare(`
      SELECT id, name, username, role, phone, email, avatar_color, avatar_url, status, notes, created_at
      FROM users WHERE id = ?
    `).get(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    res.json({ success: true, data: { ...user, has_pin: true } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create user (SUPER_ADMIN only — PIN stored as salted scrypt hash)
app.post('/api/users', requireRoles('SUPER_ADMIN'), (req, res) => {
  try {
    const { name, username, pin_code, role, phone, email, avatar_color, status, notes } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'El nombre completo es requerido' });
    }
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, error: 'El nombre de usuario es requerido' });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check unique username
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(cleanUsername);
    if (existing) {
      return res.status(400).json({ success: false, error: `El nombre de usuario '${cleanUsername}' ya está registrado` });
    }

    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'VENTAS', 'ALMACEN', 'CAJA'];
    const cleanRole = validRoles.includes(role) ? role : 'VENTAS';
    const rawPin = pin_code && String(pin_code).trim() ? String(pin_code).trim() : '1234';
    if (rawPin.length < 4) {
      return res.status(400).json({ success: false, error: 'El PIN/contraseña debe tener al menos 4 caracteres' });
    }
    const hashedPin = hashPin(rawPin);
    const cleanStatus = status === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const cleanColor = avatar_color || '#EA580C';

    const result = db.prepare(`
      INSERT INTO users (name, username, pin_code, role, phone, email, avatar_color, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      cleanUsername,
      hashedPin,
      cleanRole,
      phone ? phone.trim() : null,
      email ? email.trim() : null,
      cleanColor,
      cleanStatus,
      notes ? notes.trim() : null
    );

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    logSecurityEvent(db, {
      action: 'USER_CREATED',
      actorUser: req.user,
      target: cleanUsername,
      ip: getClientIp(req),
      details: { role: cleanRole }
    });
    res.json({ success: true, data: sanitizeUserForClient(newUser), message: `Usuario ${newUser.name} creado exitosamente` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update user (SUPER_ADMIN edits anyone; other roles can ONLY edit their own profile without changing role/status)
app.put('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, pin_code, role, phone, email, avatar_color, avatar_url, status, notes } = req.body;

    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const isSelf = String(req.user.id) === String(id);

    if (!isSuperAdmin && !isSelf) {
      return res.status(403).json({ success: false, error: 'Solo puedes modificar tu propio perfil de usuario' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    // Prevent non-SuperAdmin privilege escalation
    const nextRole = isSuperAdmin && role ? role : user.role;
    const nextStatus = isSuperAdmin && status ? status : user.status;

    if (username && username.trim().toLowerCase() !== user.username.toLowerCase()) {
      const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ? AND id != ?').get(username.trim().toLowerCase(), id);
      if (existing) {
        return res.status(400).json({ success: false, error: `El nombre de usuario '${username}' ya está en uso` });
      }
    }

    // Protect last active super admin from being set inactive or downgraded
    if (user.role === 'SUPER_ADMIN' && (nextStatus === 'INACTIVO' || nextRole !== 'SUPER_ADMIN')) {
      const activeSuperCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'SUPER_ADMIN' AND status = 'ACTIVO' AND id != ?").get(id).c;
      if (activeSuperCount === 0) {
        return res.status(400).json({ success: false, error: 'No puedes desactivar ni degradar al único Super Administrador activo del sistema' });
      }
    }

    // Hash new PIN only if provided and non-empty
    let nextPinHash = user.pin_code;
    if (pin_code && String(pin_code).trim().length > 0) {
      const rawPin = String(pin_code).trim();
      if (rawPin.length < 4) {
        return res.status(400).json({ success: false, error: 'El nuevo PIN/contraseña debe tener al menos 4 caracteres' });
      }
      nextPinHash = hashPin(rawPin);
    }

    db.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        username = COALESCE(?, username),
        pin_code = ?,
        role = ?,
        phone = ?,
        email = ?,
        avatar_color = COALESCE(?, avatar_color),
        avatar_url = ?,
        status = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ? name.trim() : user.name,
      username ? username.trim().toLowerCase() : user.username,
      nextPinHash,
      nextRole,
      phone !== undefined ? phone : user.phone,
      email !== undefined ? email : user.email,
      avatar_color || user.avatar_color,
      avatar_url !== undefined ? avatar_url : user.avatar_url,
      nextStatus,
      notes !== undefined ? notes : user.notes,
      id
    );

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    logSecurityEvent(db, {
      action: 'USER_UPDATED',
      actorUser: req.user,
      target: updated.username,
      ip: getClientIp(req),
      details: { pinChanged: Boolean(pin_code && String(pin_code).trim()), role: updated.role, status: updated.status }
    });
    res.json({ success: true, data: sanitizeUserForClient(updated), message: `Usuario ${updated.name} actualizado` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE user (SUPER_ADMIN only)
app.delete('/api/users/:id', requireRoles('SUPER_ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ success: false, error: 'No puedes eliminar tu propia cuenta mientras tienes sesión activa' });
    }

    // Protect last active super admin
    if (user.role === 'SUPER_ADMIN') {
      const activeSuperCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'SUPER_ADMIN' AND id != ?").get(id).c;
      if (activeSuperCount === 0) {
        return res.status(400).json({ success: false, error: 'No se puede eliminar el único Super Administrador del sistema' });
      }
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    logSecurityEvent(db, {
      action: 'USER_DELETED',
      actorUser: req.user,
      target: user.username,
      ip: getClientIp(req),
      details: { deletedName: user.name, deletedRole: user.role }
    });
    res.json({ success: true, message: `Usuario ${user.name} eliminado` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST impersonate / switch active profile (SUPER_ADMIN only — issues signed JWT for target user)
app.post('/api/users/impersonate', requireRoles('SUPER_ADMIN'), (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'userId es requerido' });

    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!targetUser) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    if (targetUser.status !== 'ACTIVO') {
      return res.status(403).json({ success: false, error: 'No se puede cambiar a una cuenta inactiva' });
    }

    const token = signToken(targetUser);
    logSecurityEvent(db, {
      action: 'USER_IMPERSONATED',
      actorUser: req.user,
      target: targetUser.username,
      ip: getClientIp(req),
      details: { targetRole: targetUser.role }
    });

    res.json({
      success: true,
      token,
      data: sanitizeUserForClient(targetUser),
      message: `Sesión cambiada a ${targetUser.name}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST login (Public — protected by Brute-Force Rate Limiter + Scrypt Hash + HS256 JWT)
app.post('/api/users/login', (req, res) => {
  try {
    const { userId, username, pin_code } = req.body;
    const rateKey = username ? String(username).trim().toLowerCase() : `id_${userId || 'unknown'}`;
    const ip = getClientIp(req);

    // 1. Check Brute-Force Lockout
    const limitStatus = checkLoginRateLimit(req, rateKey);
    if (limitStatus.blocked) {
      logSecurityEvent(db, {
        action: 'LOGIN_LOCKED',
        target: rateKey,
        ip,
        details: { retryAfterMinutes: limitStatus.retryAfterMinutes }
      });
      return res.status(429).json({
        success: false,
        error: limitStatus.message
      });
    }

    let user = null;
    if (userId) {
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    } else if (username) {
      user = db.prepare('SELECT * FROM users WHERE LOWER(username) = ?').get(String(username).trim().toLowerCase());
    }

    // Use uniform failure tracking to prevent user enumeration & brute force
    if (!user || !verifyPin(pin_code, user.pin_code)) {
      const fail = recordLoginFailure(req, rateKey);
      logSecurityEvent(db, {
        action: 'LOGIN_FAILED',
        target: rateKey,
        ip,
        details: { remainingAttempts: fail.remaining, locked: fail.locked }
      });

      const msg = fail.locked
        ? 'Demasiados intentos fallidos. Cuenta bloqueada por 10 minutos por seguridad.'
        : `Usuario o PIN incorrecto. Te quedan ${fail.remaining} intento(s) antes del bloqueo temporal.`;

      return res.status(fail.locked ? 429 : 401).json({ success: false, error: msg });
    }

    if (user.status !== 'ACTIVO') {
      return res.status(403).json({ success: false, error: 'Esta cuenta de usuario se encuentra inactiva' });
    }

    // Success: reset failure counter and issue signed HS256 JWT
    resetLoginFailures(req, rateKey);
    const token = signToken(user);

    logSecurityEvent(db, {
      action: 'LOGIN_SUCCESS',
      actorUser: user,
      target: user.username,
      ip
    });

    res.json({ 
      success: true, 
      token,
      data: sanitizeUserForClient(user),
      message: `¡Bienvenido al sistema, ${user.name}!` 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =============================================================================
// CASH CLOSING & DAILY EXPENSES (Cierre de Caja Diario + Gastos / Caja Chica)
// =============================================================================
app.get('/api/cash-closing', (req, res) => {
  try {
    const targetDate = (req.query.date && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date))
      ? req.query.date
      : new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

    const rawPayments = db.prepare(`
      SELECT
        p.id,
        p.note_id,
        p.amount,
        p.payment_method,
        p.account_info,
        p.payment_date,
        p.registered_by,
        p.created_at,
        sn.note_code,
        sn.customer_name
      FROM sales_note_payments p
      JOIN sales_notes sn ON sn.id = p.note_id
      WHERE sn.status NOT IN ('ANULADO', 'PRE-RESERVA')
        AND (
          substr(p.payment_date, 1, 10) = ?
          OR (p.payment_date IS NULL AND substr(p.created_at, 1, 10) = ?)
        )
      ORDER BY p.id DESC
    `).all(targetDate, targetDate);

    let totalCash = 0;
    let totalQr = 0;
    let qrJaime = 0;
    let qrBetho = 0;
    let totalDiscount = 0;

    const payments = rawPayments.map((p) => {
      const amt = Number(p.amount || 0);
      const method = String(p.payment_method || '').toUpperCase();
      const acc = String(p.account_info || '').toUpperCase();

      let amount_cash = 0;
      let amount_qr = 0;
      let amount_discount = 0;
      let qr_account = '';

      if (method.includes('REBAJA') || method.includes('DESCUENTO')) {
        amount_discount = amt;
        totalDiscount += amt;
      } else if (
        method.includes('QR') ||
        method.includes('TRANSFERENCIA') ||
        method.includes('DEP') ||
        method.includes('BANCARIO')
      ) {
        amount_qr = amt;
        totalQr += amt;
        if (method.includes('BET') || acc.includes('BET')) {
          qrBetho += amt;
          qr_account = 'CUENTA BETHO';
        } else {
          qrJaime += amt;
          qr_account = 'CUENTA JAIME';
        }
      } else {
        amount_cash = amt;
        totalCash += amt;
      }

      return {
        ...p,
        amount_cash,
        amount_qr,
        amount_discount,
        qr_account,
        notes: p.account_info || ''
      };
    });

    const expenses = db.prepare(`
      SELECT id, category, description, amount, date, registered_by, created_at
      FROM expenses
      WHERE substr(date, 1, 10) = ?
      ORDER BY id DESC
    `).all(targetDate);

    const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const totalCollected = totalCash + totalQr;
    const netCashInHand = totalCash - totalExpenses;

    res.json({
      success: true,
      data: {
        date: targetDate,
        summary: {
          total_cash: Number(totalCash.toFixed(2)),
          total_qr: Number(totalQr.toFixed(2)),
          qr_jaime: Number(qrJaime.toFixed(2)),
          qr_betho: Number(qrBetho.toFixed(2)),
          total_discount: Number(totalDiscount.toFixed(2)),
          total_collected: Number(totalCollected.toFixed(2)),
          total_expenses: Number(totalExpenses.toFixed(2)),
          net_cash_in_hand: Number(netCashInHand.toFixed(2)),
          payments_count: payments.length,
          expenses_count: expenses.length
        },
        payments,
        expenses
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/expenses', (req, res) => {
  try {
    const { date } = req.query;
    const rows = date
      ? db.prepare('SELECT * FROM expenses WHERE substr(date, 1, 10) = ? ORDER BY id DESC').all(date)
      : db.prepare('SELECT * FROM expenses ORDER BY date DESC, id DESC LIMIT 200').all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/expenses', (req, res) => {
  try {
    const { category, description, amount, date } = req.body;
    const numAmount = Number(amount);
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, error: 'La descripción del gasto es obligatoria' });
    }
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'El monto del gasto debe ser mayor a 0' });
    }

    const cleanDate = (date && /^\d{4}-\d{2}-\d{2}$/.test(date))
      ? date
      : new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

    const registeredBy = req.user?.name || req.user?.username || 'USUARIO';

    const result = db.prepare(`
      INSERT INTO expenses (category, description, amount, date, registered_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      (category || 'Varios').trim(),
      description.trim(),
      numAmount,
      cleanDate,
      registeredBy
    );

    const created = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
    logSecurityEvent(db, {
      action: 'EXPENSE_CREATED',
      actorUser: req.user,
      target: `expense:${created.id}`,
      ip: getClientIp(req),
      details: { category: created.category, amount: created.amount, date: created.date }
    });

    res.json({ success: true, data: created, message: 'Gasto registrado correctamente' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/expenses/:id', (req, res) => {
  try {
    const exp = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
    if (!exp) return res.status(404).json({ success: false, error: 'Gasto no encontrado' });

    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'CAJA'].includes(req.user.role);
    const isOwner = exp.registered_by && (exp.registered_by === req.user.name || exp.registered_by === req.user.username);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para eliminar este gasto' });
    }

    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    logSecurityEvent(db, {
      action: 'EXPENSE_DELETED',
      actorUser: req.user,
      target: `expense:${req.params.id}`,
      ip: getClientIp(req),
      details: { description: exp.description, amount: exp.amount }
    });

    res.json({ success: true, message: 'Gasto eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =============================================================================
// SYSTEM SECURITY: BACKUPS & AUDIT LOGS (SUPER_ADMIN / ADMIN only)
// =============================================================================
app.get('/api/system/backups', requireRoles('SUPER_ADMIN', 'ADMIN'), (req, res) => {
  try {
    const backups = listDatabaseBackups();
    res.json({ success: true, data: backups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/system/backup', requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const info = await createDatabaseBackup(db, 'manual');
    logSecurityEvent(db, {
      action: 'BACKUP_CREATED',
      actorUser: req.user,
      target: info.filename,
      ip: getClientIp(req),
      details: { size_kb: info.size_kb }
    });
    res.json({ success: true, data: info, message: `Respaldo ${info.filename} generado con éxito (${info.size_kb} KB)` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/system/audit-logs', requireRoles('SUPER_ADMIN', 'ADMIN'), (req, res) => {
  try {
    const limit = Math.min(300, Math.max(10, parseInt(req.query.limit || '150', 10)));
    const logs = db.prepare(`
      SELECT * FROM security_audit_logs
      ORDER BY id DESC
      LIMIT ?
    `).all(limit);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint de Historial de Actividad, Validaciones y Modificaciones por Usuario (Para Reportes)
app.get('/api/audit-logs', (req, res) => {
  try {
    const limit = Math.min(400, Math.max(20, parseInt(req.query.limit || '200', 10)));
    const rawLogs = db.prepare(`
      SELECT l.*, u.name AS user_full_name
      FROM security_audit_logs l
      LEFT JOIN users u ON u.id = l.actor_user_id
      ORDER BY l.id DESC
      LIMIT ?
    `).all(limit);

    const parsedLogs = rawLogs.map(row => {
      let detailsObj = {};
      if (row.details) {
        try {
          detailsObj = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
        } catch {
          detailsObj = { raw: row.details };
        }
      }
      const actorName = (
        detailsObj.actor_name ||
        detailsObj.confirmedBy ||
        row.user_full_name ||
        row.actor_username ||
        'SISTEMA'
      ).toUpperCase();

      return {
        id: row.id,
        action: row.action,
        actor_name: actorName,
        actor_username: row.actor_username || actorName.toLowerCase(),
        actor_role: row.actor_role || 'OPERADOR',
        target: row.target || '-',
        created_at: row.created_at,
        details: detailsObj
      };
    });

    res.json({
      success: true,
      data: parsedLogs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =============================================================================
// UNIFIED PRODUCTION FRONTEND SERVING (Express serves Vite build from ../dist)
// =============================================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '..', 'dist');
const distIndex = path.join(distDir, 'index.html');

if (fs.existsSync(distIndex)) {
  app.use(express.static(distDir, { maxAge: '1h' }));
  app.get(/^(?!\/api(?:\/|$)).*/, (req, res) => {
    res.sendFile(distIndex);
  });
}

// =============================================================================

app.listen(PORT, '0.0.0.0', () => {
  const modeMsg = fs.existsSync(distIndex)
    ? `App + API unificados en http://localhost:${PORT}`
    : `API en http://localhost:${PORT}`;
  console.log(`🚀 SISCONTROL Server activo: ${modeMsg} (JWT + Scrypt + RateLimit + Backups)`);
});

