import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarDays,
  Search,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  RefreshCw,
  Zap,
  FileText,
  Layers,
  Users,
  TrendingUp,
  Download,
  Award,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  Trash2,
  DollarSign,
  Clock,
  UserCheck
} from 'lucide-react';
import { formatNumber } from '../utils/formatters';

function getWeekInfo(offsetWeeks = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetWeeks * 7);

  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));

  const saturday = new Date(monday);
  saturday.setDate(saturday.getDate() + 5);

  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const startOfYear = new Date(monday.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((monday - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  const weekCode = `${monday.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;

  const formatD = (date) => `${date.getDate()} ${date.toLocaleString('es-ES', { month: 'short' })}`;
  const label = `Semana ${weekNumber} (${formatD(monday)} - ${formatD(saturday)} ${monday.getFullYear()})`;

  const toIso = (dt) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const dStr = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${dStr}`;
  };

  return {
    weekCode,
    label,
    mondayIso: toIso(monday),
    saturdayIso: toIso(saturday),
    sundayIso: toIso(sunday)
  };
}

// Helper para traducir acciones de auditoría a lenguaje claro en español
function describeAuditEvent(log) {
  const d = log.details || {};
  const fmtBs = (v) => Number(v || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  switch (log.action) {
    case 'NOTE_CREATED':
      return {
        category: 'NOTES',
        badgeLabel: 'NUEVA NOTA',
        badgeColor: '#38bdf8',
        badgeBg: 'rgba(56, 189, 248, 0.14)',
        title: `Emitió Nota de Venta ${log.target}`,
        subtitle: `Cliente: ${d.customer || 'General'} • ${d.total_boxes || 0} cj (${d.total_units || 0} u.) • Total: Bs ${fmtBs(d.total_amount)}`,
        changes: d.paid_amount > 0 ? [`Abono inicial: Bs ${fmtBs(d.paid_amount)} | Saldo: Bs ${fmtBs(d.balance_amount)}`] : ['Sin abono inicial (Pendiente de cobro)']
      };
    case 'RESTOCK_CREATED':
      return {
        category: 'NOTES',
        badgeLabel: 'PEDIDO REPOSICIÓN',
        badgeColor: '#a5b4fc',
        badgeBg: 'rgba(165, 180, 252, 0.16)',
        title: `Creó Pedido de Reposición a Tienda ${log.target}`,
        subtitle: `Destino: ${d.destination || 'TIENDA CENTRAL'} • ${d.total_boxes || 0} cajas (${d.total_units || 0} unidades)`,
        changes: ['En curso (editable hasta confirmar recepción en tienda)']
      };
    case 'NOTE_UPDATED':
      return {
        category: 'MODIFICATIONS',
        badgeLabel: 'MODIFICACIÓN DE NOTA',
        badgeColor: '#FFC107',
        badgeBg: 'rgba(255, 193, 7, 0.16)',
        title: `Modificó la Nota ${log.target}`,
        subtitle: `Cliente: ${d.customer || d.after?.customer_name || 'General'}`,
        changes: Array.isArray(d.changes) && d.changes.length > 0
          ? d.changes
          : ['Se actualizaron productos, cantidades o precios de la nota']
      };
    case 'NOTE_DELIVERED':
      return {
        category: 'CONFIRMATIONS',
        badgeLabel: 'ENTREGA CONFIRMADA',
        badgeColor: '#10b981',
        badgeBg: 'rgba(16, 185, 129, 0.16)',
        title: `Confirmó Entrega Física de Nota ${log.target}`,
        subtitle: `Cliente: ${d.customer || 'General'} • Stock descontado del inventario`,
        changes: [`Pagado acumulado: Bs ${fmtBs(d.paid_amount)} | Saldo: Bs ${fmtBs(d.balance_amount)} (${d.status || 'ENTREGADO'})`]
      };
    case 'RESTOCK_CONFIRMED':
      return {
        category: 'CONFIRMATIONS',
        badgeLabel: 'REPOSICIÓN RECIBIDA',
        badgeColor: '#10b981',
        badgeBg: 'rgba(16, 185, 129, 0.16)',
        title: `Confirmó Llegada a Tienda de ${log.target}`,
        subtitle: `Recibido por: ${d.confirmedBy || log.actor_name} • ${d.total_boxes || 0} cajas (${d.total_units || 0} u.)`,
        changes: ['Traspaso interno Almacén → Tienda completado (sin cobro ni deuda)']
      };
    case 'PAYMENT_ADDED':
      return {
        category: 'PAYMENTS',
        badgeLabel: 'COBRO / ABONO',
        badgeColor: '#34d399',
        badgeBg: 'rgba(52, 211, 153, 0.15)',
        title: `Registró Cobro/Abono en Nota ${log.target}`,
        subtitle: `Cliente: ${d.customer || 'General'} • Monto: Bs ${fmtBs(d.amount)} (${d.payment_method || 'Efectivo'})`,
        changes: [`Saldo anterior: Bs ${fmtBs(d.before_balance)} → Nuevo saldo: Bs ${fmtBs(d.after_balance)}`]
      };
    case 'PAYMENT_DELETED':
      return {
        category: 'MODIFICATIONS',
        badgeLabel: 'ABONO ELIMINADO',
        badgeColor: '#fb7185',
        badgeBg: 'rgba(244, 63, 94, 0.16)',
        title: `Eliminó un Abono de la Nota ${log.target}`,
        subtitle: `Cliente: ${d.customer || 'General'} • Abono anulado: Bs ${fmtBs(d.deleted_amount)}`,
        changes: [`Nuevo saldo pendiente: Bs ${fmtBs(d.after_balance)}`]
      };
    case 'NOTE_CANCELLED':
      return {
        category: 'CANCELLATIONS',
        badgeLabel: 'NOTA ANULADA',
        badgeColor: '#f43f5e',
        badgeBg: 'rgba(244, 63, 94, 0.18)',
        title: `Anuló la Nota ${log.target}`,
        subtitle: `Cliente: ${d.customer || 'General'} • Total anulado: Bs ${fmtBs(d.total)}`,
        changes: ['Nota marcada como ANULADA y stock devuelto al inventario']
      };
    case 'QUICK_STOCK_IN':
      return {
        category: 'INVENTORY',
        badgeLabel: 'INGRESO RÁPIDO STOCK',
        badgeColor: '#38bdf8',
        badgeBg: 'rgba(56, 189, 248, 0.15)',
        title: `Ingreso Rápido de Mercadería (${log.target})`,
        subtitle: `Agregó +${d.addedUnits || 0} unidades (${d.boxes || 0} cajas)`,
        changes: [`Stock anterior: ${d.previousStock ?? 0} u. → Nuevo stock: ${d.newStock ?? 0} u.`]
      };
    case 'PRODUCT_UPDATED':
      return {
        category: 'INVENTORY',
        badgeLabel: 'EDICIÓN PRODUCTO / PRECIO',
        badgeColor: '#FFC107',
        badgeBg: 'rgba(255, 193, 7, 0.16)',
        title: `Editó Datos/Precios de Producto (${log.target})`,
        subtitle: `${d.name || log.target}`,
        changes: [`Mayor: Bs ${fmtBs(d.wholesale_price)} | Caja: Bs ${fmtBs(d.box_price)} | Stock: ${d.current_stock ?? '-'} u.`]
      };
    case 'STOCK_OVERRIDE_PENDING_ARRIVAL':
      return {
        category: 'CONFIRMATIONS',
        badgeLabel: 'MERCADERÍA RECIÉN LLEGADA',
        badgeColor: '#f59e0b',
        badgeBg: 'rgba(245, 158, 11, 0.16)',
        title: `Autorizó Venta con Mercadería Recién Llegada (${log.target})`,
        subtitle: `Cliente: ${d.customer || 'General'} • Pendiente de carga formal en inventario`,
        changes: ['Validado con casilla de mercadería recién llegada']
      };
    case 'EXPENSE_CREATED':
      return {
        category: 'PAYMENTS',
        badgeLabel: 'GASTO CAJA CHICA',
        badgeColor: '#fb7185',
        badgeBg: 'rgba(244, 63, 94, 0.14)',
        title: `Registró Gasto del Día (Bs ${fmtBs(d.amount)})`,
        subtitle: `Categoría: ${d.category || 'Varios'} • Fecha: ${d.date || ''}`,
        changes: []
      };
    case 'LOGIN_SUCCESS':
      return {
        category: 'SECURITY',
        badgeLabel: 'INICIO DE SESIÓN',
        badgeColor: '#94a3b8',
        badgeBg: 'rgba(148, 163, 184, 0.14)',
        title: `Inició sesión en el sistema`,
        subtitle: `Usuario: ${log.actor_name}`,
        changes: []
      };
    default:
      return {
        category: 'OTHER',
        badgeLabel: log.action,
        badgeColor: '#94a3b8',
        badgeBg: 'rgba(148, 163, 184, 0.14)',
        title: `${log.action} (${log.target || '-'})`,
        subtitle: JSON.stringify(d),
        changes: []
      };
  }
}

export default function WeeklyDispatchesTable({ userRole = 'SUPER_ADMIN' }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const { weekCode, label: weekLabel, mondayIso, sundayIso } = getWeekInfo(weekOffset);

  const [reportTab, setReportTab] = useState('PRODUCTS'); // 'PRODUCTS' | 'SELLERS' | 'DAILY' | 'AUDIT'
  const [productsData, setProductsData] = useState([]);
  const [weekNotes, setWeekNotes] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditCategoryFilter, setAuditCategoryFilter] = useState('ALL'); // 'ALL' | 'MODIFICATIONS' | 'CONFIRMATIONS' | 'NOTES' | 'PAYMENTS' | 'INVENTORY'
  const [auditUserFilter, setAuditUserFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  const [kpiSummary, setKpiSummary] = useState({
    totalProductsSold: 0,
    totalUnitsSold: 0,
    totalUnitsPending: 0,
    totalRevenueSold: 0
  });
  const [weekRange, setWeekRange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [brands, setBrands] = useState(['Todas']);
  const [onlyDispatched, setOnlyDispatched] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedNoteDetail, setSelectedNoteDetail] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  const isAlmacen = userRole === 'ALMACEN';

  const todayIso = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const fetchWeekReportData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const dispatchesUrl = `/api/weekly-dispatches?weekCode=${weekCode}&mondayDate=${mondayIso}&onlyDispatched=${onlyDispatched}&brand=${encodeURIComponent(selectedBrand)}&search=${encodeURIComponent(searchTerm)}&limit=${itemsPerPage}&offset=${offset}`;

      const [dispRes, notesRes, auditRes] = await Promise.all([
        fetch(dispatchesUrl).then(r => r.json()),
        fetch('/api/sales-notes?limit=300').then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/audit-logs?limit=250').then(r => r.json()).catch(() => ({ success: false, data: [] }))
      ]);

      if (dispRes.success) {
        const list = Array.isArray(dispRes.data) ? dispRes.data : [];
        setProductsData(list);
        setTotalCount(dispRes.total || list.length);
        if (dispRes.kpiSummary) setKpiSummary(dispRes.kpiSummary);
        if (dispRes.weekRange) setWeekRange(dispRes.weekRange);
      }

      if (notesRes.success && Array.isArray(notesRes.data)) {
        const filteredWeekNotes = notesRes.data.filter(n => {
          if (n.status === 'ANULADO' || n.note_type === 'REPOSICION_TIENDA') return false;
          const d = (n.date || '').slice(0, 10);
          return d >= mondayIso && d <= sundayIso;
        });
        setWeekNotes(filteredWeekNotes);
      }

      if (auditRes.success && Array.isArray(auditRes.data)) {
        setAuditLogs(auditRes.data);
      }

      if (brands.length <= 1) {
        const brandsRes = await fetch('/api/products').then(r => r.json()).catch(() => ({ success: false }));
        if (brandsRes.success && Array.isArray(brandsRes.data)) {
          const uniqueBrands = ['Todas', ...new Set(brandsRes.data.map(p => p.brand).filter(Boolean))];
          setBrands(uniqueBrands);
        }
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [weekCode, mondayIso, sundayIso, onlyDispatched, selectedBrand, searchTerm, currentPage, itemsPerPage, brands.length]);

  useEffect(() => {
    fetchWeekReportData();
  }, [fetchWeekReportData]);

  // Cálculos automáticos de Ventas, Vendedores, Clientes y Días de la Semana
  const financialReport = useMemo(() => {
    let totalFacturado = 0;
    let totalCobrado = 0;
    let totalPorCobrar = 0;

    const sellerMap = new Map();
    const customerMap = new Map();
    const dayMap = new Map();

    for (const n of weekNotes) {
      const tot = Number(n.total_amount || 0);
      const paid = Number(n.paid_amount || 0);
      const bal = Number(n.balance_amount || 0);
      totalFacturado += tot;
      totalCobrado += paid;
      totalPorCobrar += bal;

      // Por vendedor
      const seller = (n.seller_name || 'GENERAL').toUpperCase();
      const sPrev = sellerMap.get(seller) || {
        seller,
        notesCount: 0,
        boxesCount: 0,
        totalSales: 0,
        totalPaid: 0,
        totalBalance: 0
      };
      sPrev.notesCount += 1;
      sPrev.boxesCount += Number(n.total_boxes || 0);
      sPrev.totalSales += tot;
      sPrev.totalPaid += paid;
      sPrev.totalBalance += bal;
      sellerMap.set(seller, sPrev);

      // Por cliente
      const cust = (n.customer_name || 'CLIENTE GENERAL').toUpperCase();
      const cPrev = customerMap.get(cust) || {
        customer: cust,
        destination: n.delivery_destination || n.customer_address || 'Cochabamba',
        notesCount: 0,
        totalSales: 0,
        totalPaid: 0,
        totalBalance: 0
      };
      cPrev.notesCount += 1;
      cPrev.totalSales += tot;
      cPrev.totalPaid += paid;
      cPrev.totalBalance += bal;
      customerMap.set(cust, cPrev);

      // Por día
      const dIso = (n.date || '').slice(0, 10);
      const dPrev = dayMap.get(dIso) || {
        date: dIso,
        notesCount: 0,
        boxesCount: 0,
        totalSales: 0,
        totalPaid: 0,
        totalBalance: 0
      };
      dPrev.notesCount += 1;
      dPrev.boxesCount += Number(n.total_boxes || 0);
      dPrev.totalSales += tot;
      dPrev.totalPaid += paid;
      dPrev.totalBalance += bal;
      dayMap.set(dIso, dPrev);
    }

    return {
      totalFacturado: totalFacturado || Number(kpiSummary.totalRevenueSold || 0),
      totalCobrado,
      totalPorCobrar,
      notesCount: weekNotes.length,
      sellers: Array.from(sellerMap.values()).sort((a, b) => b.totalSales - a.totalSales),
      topCustomers: Array.from(customerMap.values()).sort((a, b) => b.totalSales - a.totalSales).slice(0, 15),
      byDay: dayMap
    };
  }, [weekNotes, kpiSummary.totalRevenueSold]);

  // Procesar y enriquecer los logs de auditoría y actividad de usuarios
  const enrichedAuditLogs = useMemo(() => {
    return auditLogs
      .filter(l => l.action !== 'LOGIN_FAILED')
      .map(l => ({
        ...l,
        meta: describeAuditEvent(l)
      }));
  }, [auditLogs]);

  const auditUsersList = useMemo(() => {
    const set = new Set();
    enrichedAuditLogs.forEach(l => {
      if (l.actor_name) set.add(l.actor_name);
    });
    return ['ALL', ...Array.from(set)];
  }, [enrichedAuditLogs]);

  const filteredAuditLogs = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return enrichedAuditLogs.filter(l => {
      if (auditCategoryFilter !== 'ALL' && l.meta.category !== auditCategoryFilter) return false;
      if (auditUserFilter !== 'ALL' && l.actor_name !== auditUserFilter) return false;
      if (q) {
        const hay = `${l.actor_name} ${l.target} ${l.meta.title} ${l.meta.subtitle} ${(l.meta.changes || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [enrichedAuditLogs, auditCategoryFilter, auditUserFilter, auditSearch]);

  const dayCols = useMemo(() => {
    const baseMonday = new Date(`${mondayIso}T12:00:00`);
    const names = [
      { key: 'qty_l', autoKey: 'auto_qty_l', label: 'LUN', fullLabel: 'Lunes' },
      { key: 'qty_m', autoKey: 'auto_qty_m', label: 'MAR', fullLabel: 'Martes' },
      { key: 'qty_mi', autoKey: 'auto_qty_mi', label: 'MIÉ', fullLabel: 'Miércoles' },
      { key: 'qty_j', autoKey: 'auto_qty_j', label: 'JUE', fullLabel: 'Jueves' },
      { key: 'qty_v', autoKey: 'auto_qty_v', label: 'VIE', fullLabel: 'Viernes' },
      { key: 'qty_s', autoKey: 'auto_qty_s', label: 'SÁB', fullLabel: 'Sábado' }
    ];
    return names.map((n, idx) => {
      const dt = new Date(baseMonday);
      dt.setDate(baseMonday.getDate() + idx);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      return {
        ...n,
        dateIso: weekRange?.daysList?.[idx] || `${y}-${m}-${d}`,
        dateShort: weekRange?.daysInfo?.[idx]?.dateShort || `${d}/${m}`
      };
    });
  }, [mondayIso, weekRange]);

  const formatBs = (val) =>
    Number(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleExportReportCSV = () => {
    const headers = ['SKU', 'Producto', 'Marca', 'Bodega', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'Total_Salidas_Unid', 'Precio_Venta_Bs', 'Total_Facturado_Bs'];
    const rows = productsData.map(p => {
      const l = Number(p.auto_qty_l || p.qty_l || 0);
      const m = Number(p.auto_qty_m || p.qty_m || 0);
      const mi = Number(p.auto_qty_mi || p.qty_mi || 0);
      const j = Number(p.auto_qty_j || p.qty_j || 0);
      const v = Number(p.auto_qty_v || p.qty_v || 0);
      const s = Number(p.auto_qty_s || p.qty_s || 0);
      const tot = Number(p.auto_total_sold || l + m + mi + j + v + s);
      const price = Number(p.auto_avg_price || p.wholesale_price || p.sale_price || 0);
      const rev = Number(p.auto_total_revenue || tot * price);
      return [
        `"${p.sku}"`,
        `"${p.name}"`,
        `"${p.brand || 'GENERAL'}"`,
        `"${p.warehouse || 'ALMACÉN'}"`,
        l, m, mi, j, v, s,
        tot,
        price.toFixed(2),
        rev.toFixed(2)
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Reporte_Semanal_${weekCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
      {/* Top Header & Week Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.22), rgba(255, 193, 7, 0.22))',
            border: '1px solid rgba(255, 140, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cyan-primary)'
          }}>
            <TrendingUp size={25} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 className="font-heading" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Reportes & Resumen Semanal
              </h3>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399'
              }}>
                <Zap size={13} />
                100% Automático
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Salidas de mercadería (L-S), ventas por vendedor y bitácora de actividad/validaciones por usuario
            </p>
          </div>
        </div>

        {/* Week Switcher & Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-glass)',
            borderRadius: '10px',
            padding: '4px'
          }}>
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="btn btn-secondary"
              style={{ padding: '6px 8px', borderRadius: '6px', border: 'none' }}
              title="Semana Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ padding: '0 12px', fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
              {weekLabel}
            </span>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className="btn btn-secondary"
              style={{ padding: '6px 8px', borderRadius: '6px', border: 'none' }}
              title="Semana Siguiente"
            >
              <ChevronRight size={16} />
            </button>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.7rem', marginLeft: '6px', borderRadius: '6px' }}
              >
                Semana Actual
              </button>
            )}
          </div>

          <button
            onClick={fetchWeekReportData}
            disabled={loading}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '8px 14px', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={handleExportReportCSV}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '8px 14px', gap: '6px' }}
          >
            <Download size={14} />
            <span>Exportar Excel (.csv)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Automáticas de la Semana */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '14px 18px',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Unidades Despachadas (L-S)
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
            {(kpiSummary.totalUnitsSold || 0).toLocaleString()} u.
          </div>
          <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '2px', fontWeight: 600 }}>
            {kpiSummary.totalProductsSold || 0} productos con salida en la semana
          </div>
        </div>

        {!isAlmacen && (
          <>
            <div style={{
              background: 'rgba(255, 140, 0, 0.08)',
              border: '1px solid rgba(255, 140, 0, 0.3)',
              padding: '14px 18px',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Ventas Semana (Bs)
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--cyan-primary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                Bs {formatBs(financialReport.totalFacturado)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {financialReport.notesCount} notas de venta emitidas
              </div>
            </div>

            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '14px 18px',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Cobrado (Efectivo + QR)
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                Bs {formatBs(financialReport.totalCobrado)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Ingresos reales cobrados en la semana
              </div>
            </div>

            <div style={{
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              padding: '14px 18px',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Saldo por Cobrar (Semana)
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fb7185', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                Bs {formatBs(financialReport.totalPorCobrar)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Pendiente de cobro de notas de esta semana
              </div>
            </div>
          </>
        )}
      </div>

      {/* Selector de Sub-Reporte (4 Pestañas) */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '18px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '12px'
      }}>
        <button
          type="button"
          onClick={() => setReportTab('PRODUCTS')}
          className="btn"
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '0.8rem',
            fontWeight: 800,
            background: reportTab === 'PRODUCTS' ? 'var(--cyan-primary)' : 'rgba(255,255,255,0.05)',
            color: reportTab === 'PRODUCTS' ? '#ffffff' : 'var(--text-muted)',
            border: '1px solid var(--border-glass)'
          }}
        >
          <PackageCheck size={15} />
          <span>1. Salidas de Productos (L-S)</span>
        </button>

        {!isAlmacen && (
          <>
            <button
              type="button"
              onClick={() => setReportTab('SELLERS')}
              className="btn"
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 800,
                background: reportTab === 'SELLERS' ? 'var(--cyan-primary)' : 'rgba(255,255,255,0.05)',
                color: reportTab === 'SELLERS' ? '#ffffff' : 'var(--text-muted)',
                border: '1px solid var(--border-glass)'
              }}
            >
              <Award size={15} />
              <span>2. Ventas por Vendedor & Clientes</span>
            </button>

            <button
              type="button"
              onClick={() => setReportTab('DAILY')}
              className="btn"
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 800,
                background: reportTab === 'DAILY' ? 'var(--cyan-primary)' : 'rgba(255,255,255,0.05)',
                color: reportTab === 'DAILY' ? '#ffffff' : 'var(--text-muted)',
                border: '1px solid var(--border-glass)'
              }}
            >
              <CalendarDays size={15} />
              <span>3. Resumen Diario de Ventas</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setReportTab('AUDIT')}
          className="btn"
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '0.8rem',
            fontWeight: 800,
            background: reportTab === 'AUDIT' ? 'var(--cyan-primary)' : 'rgba(255,255,255,0.05)',
            color: reportTab === 'AUDIT' ? '#ffffff' : 'var(--text-muted)',
            border: '1px solid var(--border-glass)'
          }}
        >
          <ShieldCheck size={15} />
          <span>4. Actividad & Auditoría de Usuarios ({enrichedAuditLogs.length})</span>
        </button>
      </div>

      {/* Modal Detalle de Notas de Venta del Producto */}
      {selectedNoteDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}
          onClick={() => setSelectedNoteDetail(null)}
        >
          <div
            className="glass-panel"
            style={{ maxWidth: '520px', width: '100%', padding: '24px', borderRadius: '16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="var(--cyan-primary)" />
                <h4 style={{ fontWeight: 800, margin: 0, fontSize: '1.05rem', color: '#f8fafc' }}>
                  Notas que Despacharon este Producto
                </h4>
              </div>
              <button
                onClick={() => setSelectedNoteDetail(null)}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              >
                ✕ Cerrar
              </button>
            </div>

            <div style={{ marginBottom: '14px', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {selectedNoteDetail.sku}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                {selectedNoteDetail.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '12px' }}>
                <span>Total Vendido: <strong style={{ color: '#38bdf8' }}>{selectedNoteDetail.auto_total_sold} u.</strong></span>
                <span>Facturado: <strong style={{ color: '#34d399' }}>Bs {formatBs(selectedNoteDetail.auto_total_revenue)}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {selectedNoteDetail.notes_summary ? (
                selectedNoteDetail.notes_summary.split(' | ').map((noteItem, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(255, 140, 0, 0.08)',
                      border: '1px solid rgba(255, 140, 0, 0.25)',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      color: '#f8fafc',
                      fontFamily: 'var(--font-mono)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FileText size={14} color="var(--cyan-primary)" />
                    <span>{noteItem}</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Sin detalles de notas disponibles.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VISTA 1: SALIDAS DE PRODUCTOS (L-S) — 100% SOLO LECTURA (SIN INPUTS)
         ===================================================================== */}
      {reportTab === 'PRODUCTS' && (
        <>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '16px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              gap: '4px',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid var(--border-glass)'
            }}>
              <button
                type="button"
                onClick={() => { setOnlyDispatched(true); setCurrentPage(1); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: onlyDispatched ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                  color: onlyDispatched ? '#34d399' : 'var(--text-muted)',
                  border: onlyDispatched ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid transparent'
                }}
              >
                <Zap size={14} />
                <span>Solo Productos con Movimiento ({kpiSummary.totalProductsSold || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => { setOnlyDispatched(false); setCurrentPage(1); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: !onlyDispatched ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: !onlyDispatched ? '#ffffff' : 'var(--text-muted)',
                  border: !onlyDispatched ? '1px solid var(--border-glass)' : '1px solid transparent'
                }}
              >
                <Layers size={14} />
                <span>Ver Catálogo Completo</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', flex: '1 1 300px', maxWidth: '520px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Buscar por SKU, producto, marca o bodega..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  style={{ paddingLeft: '34px', fontSize: '0.8rem', height: '36px' }}
                />
              </div>

              {brands.length > 2 && (
                <div style={{ minWidth: '150px' }}>
                  <select
                    className="form-select"
                    value={selectedBrand}
                    onChange={(e) => { setSelectedBrand(e.target.value); setCurrentPage(1); }}
                    style={{ fontSize: '0.8rem', height: '36px', fontWeight: 600, color: 'var(--cyan-primary)' }}
                  >
                    {brands.map(b => (
                      <option key={b} value={b}>Marca: {b}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="data-table-container" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '95px' }}>SKU</th>
                  <th style={{ minWidth: '240px' }}>Producto & Bodega</th>
                  <th style={{ textAlign: 'center', minWidth: '95px' }}>Stock Actual</th>
                  {dayCols.map(col => {
                    const isToday = col.dateIso === todayIso;
                    return (
                      <th
                        key={col.key}
                        style={{
                          textAlign: 'center',
                          minWidth: '62px',
                          background: isToday ? 'rgba(255, 140, 0, 0.16)' : undefined
                        }}
                      >
                        <div style={{ fontWeight: 800, color: isToday ? 'var(--cyan-primary)' : undefined }}>
                          {col.label}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                          {col.dateShort}
                        </div>
                      </th>
                    );
                  })}
                  <th style={{ textAlign: 'center', minWidth: '95px' }}>Total Semana</th>
                  {!isAlmacen && <th style={{ textAlign: 'center', minWidth: '100px' }}>Precio Real</th>}
                  {!isAlmacen && <th style={{ textAlign: 'right', minWidth: '115px' }}>Total Venta (Bs)</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isAlmacen ? 10 : 12} style={{ textAlign: 'center', padding: '45px', color: 'var(--text-muted)' }}>
                      Cargando reporte automático de la semana...
                    </td>
                  </tr>
                ) : productsData.length === 0 ? (
                  <tr>
                    <td colSpan={isAlmacen ? 10 : 12} style={{ textAlign: 'center', padding: '45px', color: 'var(--text-muted)' }}>
                      No hay salidas registradas para esta semana con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  productsData.map(p => {
                    const l = Number(p.auto_qty_l || p.qty_l || 0);
                    const m = Number(p.auto_qty_m || p.qty_m || 0);
                    const mi = Number(p.auto_qty_mi || p.qty_mi || 0);
                    const j = Number(p.auto_qty_j || p.qty_j || 0);
                    const v = Number(p.auto_qty_v || p.qty_v || 0);
                    const s = Number(p.auto_qty_s || p.qty_s || 0);
                    const totalOut = Number(p.auto_total_sold || l + m + mi + j + v + s);
                    const realSoldPrice = Number(p.auto_avg_price || p.wholesale_price || p.sale_price || 0);
                    const realRevenue = Number(p.auto_total_revenue || totalOut * realSoldPrice);

                    const dayValues = [l, m, mi, j, v, s];

                    return (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--cyan-primary)' }}>
                          {p.sku}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>{p.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                            <span>🏷️ {p.brand || 'GENERAL'}</span>
                            <span>📍 {p.warehouse || 'CASA CUBANO'}</span>
                            {p.notes_summary && (
                              <button
                                type="button"
                                onClick={() => setSelectedNoteDetail(p)}
                                style={{
                                  background: 'rgba(255, 140, 0, 0.14)',
                                  border: '1px solid rgba(255, 140, 0, 0.35)',
                                  borderRadius: '4px',
                                  padding: '1px 6px',
                                  fontSize: '0.68rem',
                                  color: 'var(--cyan-primary)',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 700
                                }}
                              >
                                <FileText size={10} />
                                Ver Notas
                              </button>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                          {formatNumber(p.current_stock)} {p.unit || 'u.'}
                        </td>

                        {dayCols.map((col, idx) => {
                          const val = dayValues[idx] || 0;
                          const isToday = col.dateIso === todayIso;
                          return (
                            <td
                              key={col.key}
                              style={{
                                textAlign: 'center',
                                fontFamily: 'var(--font-mono)',
                                background: isToday ? 'rgba(255, 140, 0, 0.06)' : undefined
                              }}
                            >
                              {val > 0 ? (
                                <span style={{
                                  display: 'inline-block',
                                  minWidth: '34px',
                                  padding: '3px 7px',
                                  borderRadius: '6px',
                                  background: 'rgba(16, 185, 129, 0.16)',
                                  border: '1px solid rgba(16, 185, 129, 0.4)',
                                  color: '#10b981',
                                  fontWeight: 800,
                                  fontSize: '0.78rem'
                                }}>
                                  {val}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-faint)' }}>-</span>
                              )}
                            </td>
                          );
                        })}

                        <td style={{ textAlign: 'center', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                          {totalOut > 0 ? (
                            <span style={{
                              background: 'rgba(255, 140, 0, 0.15)',
                              color: 'var(--cyan-primary)',
                              padding: '3px 9px',
                              borderRadius: '6px',
                              border: '1px solid rgba(255, 140, 0, 0.35)'
                            }}>
                              {totalOut} u.
                            </span>
                          ) : '-'}
                        </td>

                        {!isAlmacen && (
                          <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                            Bs {formatBs(realSoldPrice)}
                          </td>
                        )}

                        {!isAlmacen && (
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#10b981' }}>
                            {realRevenue > 0 ? `Bs ${formatBs(realRevenue)}` : '-'}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* =====================================================================
          VISTA 2: RENDIMIENTO POR VENDEDOR & TOP CLIENTES DE LA SEMANA
         ===================================================================== */}
      {reportTab === 'SELLERS' && !isAlmacen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Tabla Vendedores */}
          <div className="data-table-container">
            <h4 className="font-heading" style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="var(--cyan-primary)" />
              <span>Ventas por Vendedor ({weekLabel})</span>
            </h4>
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Vendedor</th>
                  <th style={{ textAlign: 'center' }}>Notas</th>
                  <th style={{ textAlign: 'right' }}>Total Vendido</th>
                  <th style={{ textAlign: 'right' }}>Cobrado</th>
                  <th style={{ textAlign: 'right' }}>Por Cobrar</th>
                </tr>
              </thead>
              <tbody>
                {financialReport.sellers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No hay notas de venta registradas en esta semana.
                    </td>
                  </tr>
                ) : (
                  financialReport.sellers.map(s => (
                    <tr key={s.seller}>
                      <td style={{ fontWeight: 800 }}>{s.seller}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{s.notesCount}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                        Bs {formatBs(s.totalSales)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#10b981', fontWeight: 700 }}>
                        Bs {formatBs(s.totalPaid)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: s.totalBalance > 0 ? '#f43f5e' : 'var(--text-muted)', fontWeight: 700 }}>
                        Bs {formatBs(s.totalBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Tabla Top Clientes */}
          <div className="data-table-container">
            <h4 className="font-heading" style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="var(--cyan-primary)" />
              <span>Principales Clientes de la Semana</span>
            </h4>
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Cliente & Destino</th>
                  <th style={{ textAlign: 'center' }}>Notas</th>
                  <th style={{ textAlign: 'right' }}>Comprado</th>
                  <th style={{ textAlign: 'right' }}>Saldo Deuda</th>
                </tr>
              </thead>
              <tbody>
                {financialReport.topCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      Sin compras registradas en esta semana.
                    </td>
                  </tr>
                ) : (
                  financialReport.topCustomers.map(c => (
                    <tr key={c.customer}>
                      <td>
                        <div style={{ fontWeight: 800 }}>{c.customer}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.destination}</div>
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{c.notesCount}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                        Bs {formatBs(c.totalSales)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: c.totalBalance > 0 ? '#f43f5e' : '#10b981' }}>
                        Bs {formatBs(c.totalBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          VISTA 3: RESUMEN DIARIO DE VENTAS Y COBROS (LUNES A SÁBADO)
         ===================================================================== */}
      {reportTab === 'DAILY' && !isAlmacen && (
        <div className="data-table-container">
          <table className="data-table" style={{ fontSize: '0.82rem' }}>
            <thead>
              <tr>
                <th>Día de la Semana</th>
                <th>Fecha</th>
                <th style={{ textAlign: 'center' }}>Notas Emitidas</th>
                <th style={{ textAlign: 'center' }}>Cajas Vendidas</th>
                <th style={{ textAlign: 'right' }}>Total Facturado (Bs)</th>
                <th style={{ textAlign: 'right' }}>Total Cobrado (Bs)</th>
                <th style={{ textAlign: 'right' }}>Saldo Pendiente (Bs)</th>
              </tr>
            </thead>
            <tbody>
              {dayCols.map(col => {
                const info = financialReport.byDay.get(col.dateIso) || {
                  notesCount: 0,
                  boxesCount: 0,
                  totalSales: 0,
                  totalPaid: 0,
                  totalBalance: 0
                };
                const isToday = col.dateIso === todayIso;
                return (
                  <tr key={col.dateIso}>
                    <td style={{ fontWeight: 800 }}>
                      {col.fullLabel} {isToday && <span className="badge badge-amber" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>HOY</span>}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{col.dateIso}</td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{info.notesCount}</td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{info.boxesCount} cj</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                      Bs {formatBs(info.totalSales)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#10b981' }}>
                      Bs {formatBs(info.totalPaid)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: info.totalBalance > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                      Bs {formatBs(info.totalBalance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* =====================================================================
          VISTA 4: HISTORIAL DE ACTIVIDAD, VALIDACIONES Y CAMBIOS POR USUARIO
         ===================================================================== */}
      {reportTab === 'AUDIT' && (
        <div>
          {/* Barra de Filtros de Auditoría por Usuario y Tipo de Acción */}
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'Todas las Acciones' },
                { id: 'MODIFICATIONS', label: '✏️ Modificaciones de Notas' },
                { id: 'CONFIRMATIONS', label: '✅ Confirmaciones (Entrega/Tienda)' },
                { id: 'NOTES', label: '📋 Nuevas Notas / Reposiciones' },
                { id: 'PAYMENTS', label: '💵 Cobros & Caja' },
                { id: 'INVENTORY', label: '📦 Cambios de Stock / Precios' },
                { id: 'CANCELLATIONS', label: '❌ Anulaciones' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setAuditCategoryFilter(cat.id)}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: auditCategoryFilter === cat.id ? 'var(--cyan-primary)' : 'rgba(255,255,255,0.05)',
                    color: auditCategoryFilter === cat.id ? '#ffffff' : 'var(--text-muted)',
                    border: '1px solid var(--border-glass)'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Filtro por Usuario / Trabajador */}
              <select
                className="form-select"
                value={auditUserFilter}
                onChange={(e) => setAuditUserFilter(e.target.value)}
                style={{ width: 'auto', minWidth: '165px', fontSize: '0.78rem', fontWeight: 700 }}
              >
                {auditUsersList.map(u => (
                  <option key={u} value={u}>
                    {u === 'ALL' ? '👤 Todos los Usuarios' : `👤 Usuario: ${u}`}
                  </option>
                ))}
              </select>

              {/* Buscador */}
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Buscar nota (IR101A), cliente o usuario..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  style={{ paddingLeft: '32px', fontSize: '0.78rem', height: '35px' }}
                />
              </div>
            </div>
          </div>

          {/* Tabla de Bitácora de Actividad & Validaciones */}
          <div className="data-table-container">
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '145px' }}>Fecha y Hora</th>
                  <th style={{ minWidth: '140px' }}>Usuario Responsable</th>
                  <th style={{ minWidth: '160px' }}>Tipo de Validación / Acción</th>
                  <th style={{ minWidth: '100px' }}>Documento / SKU</th>
                  <th style={{ minWidth: '320px' }}>Detalle de la Acción y Cambios (Antes → Después)</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '45px', color: 'var(--text-muted)' }}>
                      No se encontraron registros de actividad con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map(log => {
                    const m = log.meta;
                    return (
                      <tr key={log.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: 'var(--text-main)' }}>
                            <Clock size={12} color="var(--cyan-primary)" />
                            <span>{log.created_at}</span>
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                            <UserCheck size={14} color="var(--cyan-primary)" />
                            <span>{log.actor_name}</span>
                          </div>
                          {log.actor_role && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              Rol: {log.actor_role}
                            </div>
                          )}
                        </td>

                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            color: m.badgeColor,
                            background: m.badgeBg,
                            border: `1px solid ${m.badgeColor}44`
                          }}>
                            {m.badgeLabel}
                          </span>
                        </td>

                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--cyan-primary)' }}>
                          {log.target}
                        </td>

                        <td>
                          <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                            {m.title}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {m.subtitle}
                          </div>
                          {Array.isArray(m.changes) && m.changes.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                              {m.changes.map((chg, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: '0.72rem',
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(255, 140, 0, 0.12)',
                                    border: '1px solid rgba(255, 140, 0, 0.3)',
                                    color: 'var(--cyan-primary)'
                                  }}
                                >
                                  {chg}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
