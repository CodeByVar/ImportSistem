import React, { useState, useMemo } from 'react';
import { LayoutDashboard, Users, Box, ShieldCheck, Sparkles, Eye } from 'lucide-react';
import MetricCards from './dashboard/MetricCards';
import WarehouseStock from './dashboard/WarehouseStock';
import FinancialChart from './dashboard/FinancialChart';
import RecentActivityTable from './dashboard/RecentActivityTable';
import SalesDashboard from './dashboard/SalesDashboard';
import WarehouseDashboard from './dashboard/WarehouseDashboard';

export default function ModernDashboard({ 
  stats, 
  chartsData, 
  products = [], 
  movements = [], 
  containers = [],
  onOpenNewMovement, 
  onOpenNewNote, 
  onOpenNewProduct, 
  onOpenNewContainer,
  onOpenCustomers,
  onSelectTab,
  currentUser
}) {
  const role = currentUser?.role || 'SUPER_ADMIN';
  const isSuperAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(role);
  const [adminViewMode, setAdminViewMode] = useState('EJECUTIVO'); // 'EJECUTIVO', 'VENTAS', 'ALMACEN'

  // 1. Si es Vendedor o el Super Admin previsualiza Ventas
  if (role === 'VENTAS' || (isSuperAdmin && adminViewMode === 'VENTAS')) {
    return (
      <div className="space-y-4">
        {isSuperAdmin && (
          <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-950/40 p-3 rounded-2xl border border-orange-200 dark:border-orange-900/60 text-xs">
            <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300 font-bold">
              <Eye size={15} />
              <span>👑 Modo Previsualización: Estás viendo el Dashboard exclusivo para <strong>Ventas</strong></span>
            </div>
            <button
              type="button"
              onClick={() => setAdminViewMode('EJECUTIVO')}
              className="px-3 py-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold cursor-pointer transition-colors"
            >
              Volver a Dashboard Ejecutivo
            </button>
          </div>
        )}
        <SalesDashboard
          products={products}
          onOpenNewNote={onOpenNewNote}
          onOpenCustomers={onOpenCustomers}
          onSelectTab={onSelectTab}
          currentUser={currentUser}
        />
      </div>
    );
  }

  // 2. Si es de Almacén o el Super Admin previsualiza Almacén
  if (role === 'ALMACEN' || (isSuperAdmin && adminViewMode === 'ALMACEN')) {
    return (
      <div className="space-y-4">
        {isSuperAdmin && (
          <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 text-xs">
            <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold">
              <Eye size={15} />
              <span>👑 Modo Previsualización: Estás viendo el Dashboard exclusivo para <strong>Almacén</strong></span>
            </div>
            <button
              type="button"
              onClick={() => setAdminViewMode('EJECUTIVO')}
              className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer transition-colors"
            >
              Volver a Dashboard Ejecutivo
            </button>
          </div>
        )}
        <WarehouseDashboard
          products={products}
          containers={containers}
          onSelectTab={onSelectTab}
          currentUser={currentUser}
        />
      </div>
    );
  }

  // =========================================================================
  // 3. DASHBOARD EJECUTIVO (SUPER_ADMIN / ADMIN)
  // =========================================================================
  const [currency] = useState('BOB'); // 'BOB' (Bs)
  const [searchTerm, setSearchTerm] = useState('');
  const [movementFilter, setMovementFilter] = useState('ALL'); // 'ALL', 'SALIDA', 'ENTRADA'
  const [chartFilter, setChartFilter] = useState('ALL'); // 'ALL', 'VENTAS', 'COSTOS'
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState(null);

  const EXCHANGE_RATE = 11.5; // Tasa referencial para capital USD/BOB

  // Format currency helpers
  const formatMoney = (valInBob, targetCurr = currency) => {
    const numBob = Number(valInBob || 0);
    if (targetCurr === 'USD') {
      const numUsd = numBob / EXCHANGE_RATE;
      return `$${numUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `Bs ${numBob.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatShortMoney = (valInBob, targetCurr = currency) => {
    const numBob = Number(valInBob || 0);
    if (targetCurr === 'USD') {
      const numUsd = numBob / EXCHANGE_RATE;
      if (numUsd >= 1000000) return `$${(numUsd / 1000000).toFixed(1)}M`;
      if (numUsd >= 1000) return `$${(numUsd / 1000).toFixed(1)}K`;
      return `$${numUsd.toFixed(0)}`;
    }
    if (numBob >= 1000000) return `Bs ${(numBob / 1000000).toFixed(1)}M`;
    if (numBob >= 1000) return `Bs ${(numBob / 1000).toFixed(1)}K`;
    return `Bs ${numBob.toFixed(0)}`;
  };

  // Real stats from Backend
  const totalSalesBob = stats?.financials?.totalSales ?? 32126.00;
  const grossProfitBob = stats?.financials?.grossProfit ?? 30416.00;
  const grossMarginPercent = stats?.financials?.grossMarginPercent ?? 94.7;
  const totalStockValuationCostBob = stats?.inventory?.totalValuationCost ?? 1073576.04;
  const totalStockUnits = stats?.inventory?.totalStockUnits ?? 236954;
  const totalProductsCount = stats?.inventory?.totalProductsCount ?? 5418;
  const unitsSold = stats?.merchandiseFlow?.unitsSold ?? 247;
  const inTransitContainers = stats?.containers?.in_transit ?? 1;

  // Real or dynamically computed category distribution
  const categoriesDistribution = useMemo(() => {
    if (chartsData?.categoryDistribution && chartsData.categoryDistribution.length > 0) {
      const list = chartsData.categoryDistribution.slice(0, 4);
      const sumVal = list.reduce((acc, c) => acc + (c.inventory_value || 0), 0) || 1;
      const palette = [
        { color: '#EA580C', bg: 'rgba(234, 88, 12, 0.12)', text: '#EA580C', border: 'rgba(234, 88, 12, 0.3)' },
        { color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)', text: '#0284c7', border: 'rgba(2, 132, 199, 0.3)' },
        { color: '#059669', bg: 'rgba(5, 150, 105, 0.12)', text: '#059669', border: 'rgba(5, 150, 105, 0.3)' },
        { color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.12)', text: '#7c3aed', border: 'rgba(124, 58, 237, 0.3)' },
      ];

      return list.map((item, idx) => {
        const val = item.inventory_value || 0;
        const pct = Math.max(1, Math.round((val / sumVal) * 100));
        const style = palette[idx % palette.length];
        return {
          id: item.category,
          name: item.category,
          percentage: pct,
          amountBob: val,
          color: style.color,
          badgeBg: style.bg,
          badgeColor: style.text,
          badgeBorder: style.border,
          count: item.product_count || 0
        };
      });
    }

    const total = totalStockValuationCostBob;
    return [
      {
        id: 'electricas',
        name: 'Herramientas Eléctricas',
        percentage: 38,
        amountBob: total * 0.38,
        color: '#EA580C',
        badgeBg: 'rgba(234, 88, 12, 0.12)',
        badgeColor: '#EA580C',
        badgeBorder: 'rgba(234, 88, 12, 0.3)',
        count: 1179
      },
      {
        id: 'ferreteria',
        name: 'Ferretería & Construcción',
        percentage: 28,
        amountBob: total * 0.28,
        color: '#0284c7',
        badgeBg: 'rgba(2, 132, 199, 0.12)',
        badgeColor: '#0284c7',
        badgeBorder: 'rgba(2, 132, 199, 0.3)',
        count: 1980
      },
      {
        id: 'manuales',
        name: 'Herramientas Manuales',
        percentage: 20,
        amountBob: total * 0.20,
        color: '#059669',
        badgeBg: 'rgba(5, 150, 105, 0.12)',
        badgeColor: '#059669',
        badgeBorder: 'rgba(5, 150, 105, 0.3)',
        count: 960
      },
      {
        id: 'corte',
        name: 'Corte & Abrasivos',
        percentage: 14,
        amountBob: total * 0.14,
        color: '#7c3aed',
        badgeBg: 'rgba(124, 58, 237, 0.12)',
        badgeColor: '#7c3aed',
        badgeBorder: 'rgba(124, 58, 237, 0.3)',
        count: 377
      }
    ];
  }, [chartsData, totalStockValuationCostBob]);

  // Monthly financial flow data
  const monthlyFlowData = useMemo(() => {
    return [
      { month: 'Jun', costosPct: 38, ventasPct: 58, costosValBob: 38200, ventasValBob: 58400, margen: '+34.5%' },
      { month: 'Jul', costosPct: 50, ventasPct: 82, costosValBob: 52100, ventasValBob: 84300, margen: '+38.2%' },
      { month: 'Ago', costosPct: 42, ventasPct: 68, costosValBob: 42000, ventasValBob: 68100, margen: '+38.3%' },
      { month: 'Sep', costosPct: 35, ventasPct: 54, costosValBob: 35400, ventasValBob: 54200, margen: '+34.7%' },
      { month: 'Oct', costosPct: 48, ventasPct: 88, costosValBob: 50300, ventasValBob: 88600, margen: '+43.2%' },
      { month: 'Nov', costosPct: 44, ventasPct: 95, costosValBob: 45600, ventasValBob: 95200, margen: '+52.1%' }
    ];
  }, []);

  // Real or demo movements
  const activities = useMemo(() => {
    if (movements && movements.length > 0) {
      return movements.slice(0, 12).map((m) => {
        const isEntrada = m.type === 'ENTRADA';
        return {
          id: m.reference || `MOV-${m.id}`,
          client: m.product_name ? `${m.sku ? m.sku + ' - ' : ''}${m.product_name}` : (m.party_name || 'Movimiento de Almacén'),
          party: m.party_name || (isEntrada ? 'Proveedor / Importación' : 'Cliente Mostrador'),
          sku: m.sku || '',
          category: m.category || 'General',
          type: m.type,
          amountBob: Number(m.total_amount || (m.quantity * (m.unit_price || m.unit_cost || 0))),
          quantity: m.quantity || 1,
          status: isEntrada ? 'Ingresado' : 'Despachado',
          statusType: isEntrada ? 'info' : 'success',
          date: m.date || new Date().toISOString().split('T')[0]
        };
      });
    }

    return [
      {
        id: 'LOTE-4058',
        client: 'Motores Monofásicos Wyymet (Entrada Contenedor)',
        party: 'Transporte Terrestre Frontera',
        sku: 'W-MTM402',
        category: 'Bombas & Maquinaria',
        type: 'ENTRADA',
        amountBob: 142000,
        quantity: 80,
        status: 'Ingresado',
        statusType: 'info',
        date: '2026-11-04'
      },
      {
        id: 'NV-2026-104',
        client: 'Ferretería El Tornillo Sucre',
        party: 'Ferretería El Tornillo',
        sku: 'UT-ROT900',
        category: 'Herramientas Eléctricas',
        type: 'SALIDA',
        amountBob: 12450,
        quantity: 15,
        status: 'Despachado',
        statusType: 'success',
        date: '2026-11-04'
      }
    ];
  }, [movements]);

  // Filtered movements for recent activity
  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const matchSearch = a.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.party.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = movementFilter === 'ALL' || a.type === movementFilter;
      return matchSearch && matchType;
    });
  }, [activities, searchTerm, movementFilter]);

  // Active maritime shipment info
  const activeShipment = useMemo(() => {
    if (containers && containers.length > 0) {
      return containers.find(c => c.status !== 'recibido') || containers[0];
    }
    return {
      tracking_number: 'MSCU95845',
      shipping_line: 'MSC Mediterranean Shipping',
      origin_country: 'China (Ningbo)',
      port_name: 'Arica (Chile)',
      transport_type: 'MARITIMO',
      status: 'transito',
      departure_date: '2026-10-21',
      estimated_arrival: '2026-11-08',
      total_fob: 100000
    };
  }, [containers]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. HEADER PRINCIPAL CON SELECTOR DE VISTA PARA SUPER ADMIN */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(234, 88, 12, 0.12)',
            border: '1px solid rgba(234, 88, 12, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#EA580C',
            flexShrink: 0
          }}>
            <LayoutDashboard size={22} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Panel de Control Gerencial & Financiero
              </h2>
              <span className="badge badge-emerald" style={{ fontSize: '0.70rem', padding: '2px 8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                SISCONTROL • Cochabamba
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
              Supervisión de inventario valorizado, notas de venta y contenedores en tránsito ({totalProductsCount.toLocaleString()} productos).
            </p>
          </div>
        </div>

        {/* Selector de Vistas de Dashboard para Super Admin */}
        {isSuperAdmin && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setAdminViewMode('EJECUTIVO')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                adminViewMode === 'EJECUTIVO' 
                  ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              👑 Ejecutivo
            </button>
            <button
              type="button"
              onClick={() => setAdminViewMode('VENTAS')}
              className="px-3 py-1.5 rounded-xl font-bold text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 transition-all cursor-pointer"
              title="Previsualizar el dashboard de Ventas"
            >
              💼 Ventas
            </button>
            <button
              type="button"
              onClick={() => setAdminViewMode('ALMACEN')}
              className="px-3 py-1.5 rounded-xl font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
              title="Previsualizar el dashboard de Almacén"
            >
              📦 Almacén
            </button>
          </div>
        )}
      </div>

      {/* 2. TIER 1: 4 TARJETAS KPI MODULARES */}
      <MetricCards
        totalSalesBob={totalSalesBob}
        totalStockValuationCostBob={totalStockValuationCostBob}
        totalStockUnits={totalStockUnits}
        grossProfitBob={grossProfitBob}
        grossMarginPercent={grossMarginPercent}
        unitsSold={unitsSold}
        inTransitContainers={inTransitContainers}
        formatMoney={formatMoney}
        onSelectTab={onSelectTab}
      />

      {/* 3. TIER 2: GRAFICO FINANCIERO Y DISTRIBUCION DE BODEGAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {/* Columna Izquierda: Tendencias y Flujo Financiero */}
        <FinancialChart
          monthlyFlowData={monthlyFlowData}
          chartFilter={chartFilter}
          setChartFilter={setChartFilter}
          hoveredMonthIdx={hoveredMonthIdx}
          setHoveredMonthIdx={setHoveredMonthIdx}
          formatShortMoney={formatShortMoney}
        />

        {/* Columna Derecha: Stock de Bodegas y Embarques en Tránsito */}
        <WarehouseStock
          activeShipment={activeShipment}
          categoriesDistribution={categoriesDistribution}
          onSelectTab={onSelectTab}
        />
      </div>

      {/* 4. TIER 3: KARDEX Y REGISTRO DE ACTIVIDAD RECIENTE */}
      <RecentActivityTable
        filteredActivities={filteredActivities}
        movementFilter={movementFilter}
        setMovementFilter={setMovementFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        formatMoney={formatMoney}
        onOpenNewMovement={onOpenNewMovement}
        onOpenNewNote={onOpenNewNote}
        onOpenNewProduct={onOpenNewProduct}
        onOpenNewContainer={onOpenNewContainer}
      />

    </div>
  );
}
