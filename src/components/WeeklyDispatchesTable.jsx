import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  CalendarDays, 
  Save, 
  Search, 
  Filter, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  PackageCheck,
  Building2,
  Sparkles,
  RefreshCw,
  Zap,
  Tag,
  DollarSign,
  FileText,
  Clock,
  Layers
} from 'lucide-react';
import { formatNumber, formatCurrency } from '../utils/formatters';

// Helper para calcular código de semana e inicio de semana (Lunes)
function getWeekInfo(offsetWeeks = 0) {
  const d = new Date();
  d.setDate(d.getDate() + (offsetWeeks * 7));
  
  // Encontrar el lunes
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  
  const saturday = new Date(monday);
  saturday.setDate(saturday.getDate() + 5);

  // Número de semana ISO
  const startOfYear = new Date(monday.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((monday - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
  const weekCode = `${monday.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;

  const formatD = (date) => `${date.getDate()} ${date.toLocaleString('es-ES', { month: 'short' })}`;
  const label = `Semana ${weekNumber} (${formatD(monday)} - ${formatD(saturday)} ${monday.getFullYear()})`;
  
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const dStr = String(monday.getDate()).padStart(2, '0');
  const mondayIso = `${y}-${m}-${dStr}`;

  return { weekCode, label, mondayIso };
}

export default function WeeklyDispatchesTable({ onStockUpdated, userRole = 'SUPER_ADMIN' }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const { weekCode, label: weekLabel, mondayIso } = getWeekInfo(weekOffset);

  const [productsData, setProductsData] = useState([]);
  const [kpiSummary, setKpiSummary] = useState({ totalProductsSold: 0, totalUnitsSold: 0, totalRevenueSold: 0 });
  const [weekRange, setWeekRange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [brands, setBrands] = useState(['Todas']);
  const [onlyDispatched, setOnlyDispatched] = useState(true); // Por defecto: mostrar lo despachado automáticamente
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedNoteDetail, setSelectedNoteDetail] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  // In-memory edit tracking: { [productId]: { qty_l, qty_m, qty_mi, qty_j, qty_v, qty_s, qty_reservas } }
  const [edits, setEdits] = useState({});

  // Identificar fecha de hoy
  const todayIso = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Fetch data for current week
  const fetchWeekData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const url = `/api/weekly-dispatches?weekCode=${weekCode}&mondayDate=${mondayIso}&onlyDispatched=${onlyDispatched}&brand=${encodeURIComponent(selectedBrand)}&search=${encodeURIComponent(searchTerm)}&limit=${itemsPerPage}&offset=${offset}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        setProductsData(json.data);
        setTotalCount(json.total || 0);
        if (json.kpiSummary) setKpiSummary(json.kpiSummary);
        if (json.weekRange) setWeekRange(json.weekRange);

        // Pre-fill edits map with current values from db/sales
        const initialEdits = {};
        json.data.forEach(p => {
          initialEdits[p.id] = {
            qty_l: p.qty_l || 0,
            qty_m: p.qty_m || 0,
            qty_mi: p.qty_mi || 0,
            qty_j: p.qty_j || 0,
            qty_v: p.qty_v || 0,
            qty_s: p.qty_s || 0,
            qty_reservas: p.qty_reservas || 0
          };
        });
        setEdits(initialEdits);

        // Extract brands once if not populated
        if (brands.length <= 1) {
          const brandsRes = await fetch('/api/products').then(r => r.json());
          if (brandsRes.success) {
            const uniqueBrands = ['Todas', ...new Set(brandsRes.data.map(p => p.brand).filter(Boolean))];
            setBrands(uniqueBrands);
          }
        }
      } else {
        throw new Error(json.error || 'Error al cargar los datos');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [weekCode, mondayIso, onlyDispatched, selectedBrand, searchTerm, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchWeekData();
  }, [fetchWeekData]);

  // Sincronización automática directa con las notas de venta reales
  const handleSyncFromSales = async () => {
    setSyncing(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/weekly-dispatches/sync-from-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekCode, mondayDate: mondayIso })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Error al sincronizar con ventas');

      setToast(json.message);
      setTimeout(() => setToast(''), 4500);

      await fetchWeekData();
      if (onStockUpdated) onStockUpdated();
    } catch (err) {
      setErrorMsg(`Error al sincronizar: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // Handle cell value change for a day
  const handleCellChange = (productId, dayField, value) => {
    const val = value === '' ? 0 : Math.max(0, parseInt(value, 10) || 0);
    setEdits(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [dayField]: val
      }
    }));
  };

  // Get current edit or fallback to 0
  const getVal = (productId, dayField) => {
    return edits[productId]?.[dayField] ?? 0;
  };

  // Compute total for this product row
  const getRowTotal = (productId) => {
    const e = edits[productId] || {};
    return (e.qty_l || 0) + (e.qty_m || 0) + (e.qty_mi || 0) + (e.qty_j || 0) + (e.qty_v || 0) + (e.qty_s || 0) + (e.qty_reservas || 0);
  };

  // Save dispatches / reserves to SQLite
  const handleSavePlanilla = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      const itemsToSave = Object.keys(edits).map(pId => ({
        product_id: Number(pId),
        qty_l: edits[pId].qty_l || 0,
        qty_m: edits[pId].qty_m || 0,
        qty_mi: edits[pId].qty_mi || 0,
        qty_j: edits[pId].qty_j || 0,
        qty_v: edits[pId].qty_v || 0,
        qty_s: edits[pId].qty_s || 0,
        qty_reservas: edits[pId].qty_reservas || 0
      }));

      const res = await fetch('/api/weekly-dispatches/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekCode,
          mondayDate: mondayIso,
          items: itemsToSave,
          deductStock: false // Las notas de venta ya descontaron el inventario automáticamente
        })
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Error al guardar la planilla');

      setToast(json.message);
      setTimeout(() => setToast(''), 4500);

      await fetchWeekData();
      if (onStockUpdated) onStockUpdated();
    } catch (err) {
      setErrorMsg(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Clear inputs for this week (reset to 0)
  const handleClearWeek = () => {
    if (!window.confirm('¿Deseas reiniciar las casillas en pantalla a 0? (Puedes volver a sincronizarlas con el botón Sincronizar Ventas)')) return;
    const cleared = {};
    productsData.forEach(p => {
      cleared[p.id] = { qty_l: 0, qty_m: 0, qty_mi: 0, qty_j: 0, qty_v: 0, qty_s: 0, qty_reservas: 0 };
    });
    setEdits(cleared);
  };

  // Sum reserves from memory
  const sumReserves = Object.keys(edits).reduce((acc, pId) => acc + (edits[pId]?.qty_reservas || 0), 0);

  // Column definitions for Monday to Saturday
  const dayCols = [
    { key: 'qty_l', autoKey: 'auto_qty_l', label: 'LUN', dateIso: weekRange?.daysList?.[0], dateShort: weekRange?.daysInfo?.[0]?.dateShort || 'L' },
    { key: 'qty_m', autoKey: 'auto_qty_m', label: 'MAR', dateIso: weekRange?.daysList?.[1], dateShort: weekRange?.daysInfo?.[1]?.dateShort || 'M' },
    { key: 'qty_mi', autoKey: 'auto_qty_mi', label: 'MIÉ', dateIso: weekRange?.daysList?.[2], dateShort: weekRange?.daysInfo?.[2]?.dateShort || 'M' },
    { key: 'qty_j', autoKey: 'auto_qty_j', label: 'JUE', dateIso: weekRange?.daysList?.[3], dateShort: weekRange?.daysInfo?.[3]?.dateShort || 'J' },
    { key: 'qty_v', autoKey: 'auto_qty_v', label: 'VIE', dateIso: weekRange?.daysList?.[4], dateShort: weekRange?.daysInfo?.[4]?.dateShort || 'V' },
    { key: 'qty_s', autoKey: 'auto_qty_s', label: 'SÁB', dateIso: weekRange?.daysList?.[5], dateShort: weekRange?.daysInfo?.[5]?.dateShort || 'S' },
  ];

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          background: 'rgba(16, 185, 129, 0.98)',
          color: '#ffffff',
          padding: '14px 22px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 700,
          fontSize: '0.9rem'
        }}>
          <CheckCircle2 size={20} />
          <span>{toast}</span>
        </div>
      )}

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
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(99, 102, 241, 0.25))',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cyan-primary)'
          }}>
            <CalendarDays size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 className="font-heading" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Plantilla de Despachos Semanal (L - M - M - J - V - S)
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
                Auto-Sincronizado de Ventas
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Registra automáticamente las salidas por día según las notas de venta con <strong>entrega confirmada</strong> y su precio de venta real
            </p>
          </div>
        </div>

        {/* Week Switcher & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Week Selector */}
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
                Hoy
              </button>
            )}
          </div>

          {/* Sync Button */}
          <button
            onClick={handleSyncFromSales}
            disabled={syncing || loading}
            className="btn btn-secondary"
            style={{
              fontSize: '0.82rem',
              padding: '8px 14px',
              gap: '6px',
              color: 'var(--cyan-primary)',
              borderColor: 'rgba(6, 182, 212, 0.4)'
            }}
            title="Recalcular y actualizar salidas con las entregas confirmadas más recientes"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Sincronizando...' : 'Sincronizar Entregas'}</span>
          </button>

          {/* Clear Button */}
          <button
            onClick={handleClearWeek}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '8px 12px', gap: '6px' }}
            title="Poner a 0 casillas en pantalla"
          >
            <RotateCcw size={14} />
            <span>Limpiar</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSavePlanilla}
            disabled={saving}
            className="btn btn-emerald"
            style={{
              fontSize: '0.85rem',
              padding: '8px 18px',
              gap: '8px',
              fontWeight: 700,
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.35)'
            }}
          >
            <Save size={16} />
            <span>{saving ? 'Guardando...' : 'Guardar / Reservas'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards for the current week */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        {/* Unidades Despachadas / Entregadas */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '14px 18px',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Unidades Entregadas (L-S)
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
            {(kpiSummary.totalUnitsSold || 0).toLocaleString()} u.
          </div>
          <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '2px', fontWeight: 600 }}>
            ✓ Entregas confirmadas por bodega
          </div>
        </div>

        {/* Unidades en Preparación */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          padding: '14px 18px',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            En Preparación / Por Entregar
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
            {(kpiSummary.totalUnitsPending || 0).toLocaleString()} u.
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Suben al confirmar entrega en Orden del Día
          </div>
        </div>

        {/* Total Venta Entregada Real */}
        <div style={{
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          padding: '14px 18px',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Venta Entregada (Bs)
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--cyan-primary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            Bs {(kpiSummary.totalRevenueSold || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Calculado con precio real de entrega
          </div>
        </div>

        {/* Reservas Pendientes */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          padding: '14px 18px',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Reservas en Planilla
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#a5b4fc', marginTop: '4px' }}>
            {sumReserves.toLocaleString()} u.
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Unidades apartadas en matriz
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '18px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Toggle Pills: Solo Despachados vs Catálogo Completo */}
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
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: onlyDispatched ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
              color: onlyDispatched ? '#34d399' : 'var(--text-muted)',
              border: onlyDispatched ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid transparent'
            }}
          >
            <Zap size={14} />
            <span>Entregas Confirmadas ({kpiSummary.totalProductsSold || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => { setOnlyDispatched(false); setCurrentPage(1); }}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: !onlyDispatched ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: !onlyDispatched ? '#ffffff' : 'var(--text-muted)',
              border: !onlyDispatched ? '1px solid var(--border-glass)' : '1px solid transparent'
            }}
          >
            <Layers size={14} />
            <span>Catálogo Completo</span>
          </button>
        </div>

        {/* Search & Brand Filter */}
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

      {/* Error message */}
      {errorMsg && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.84rem',
          color: '#fb7185'
        }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Modal/Popover Detalle de Notas de Venta del Producto */}
      {selectedNoteDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }} onClick={() => setSelectedNoteDetail(null)}>
          <div 
            className="glass-panel" 
            style={{ maxWidth: '520px', width: '100%', padding: '24px', borderRadius: '16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="var(--cyan-primary)" />
                <h4 style={{ fontWeight: 800, margin: 0, fontSize: '1.05rem', color: '#f8fafc' }}>
                  Desglose de Notas de Venta
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
                <span>Facturado: <strong style={{ color: '#34d399' }}>Bs {Number(selectedNoteDetail.auto_total_revenue || 0).toFixed(2)}</strong></span>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
              NOTAS REGISTRADAS EN ESTA SEMANA:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {selectedNoteDetail.notes_summary ? (
                selectedNoteDetail.notes_summary.split(' | ').map((noteItem, idx) => (
                  <div key={idx} style={{
                    padding: '8px 12px',
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    color: '#f8fafc',
                    fontFamily: 'var(--font-mono)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
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

      {/* Interactive Matrix Table */}
      <div className="data-table-container" style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ fontSize: '0.78rem' }}>
          <thead>
            <tr>
              <th style={{ minWidth: '95px' }}>SKU</th>
              <th style={{ minWidth: '220px' }}>Producto & Bodega</th>
              <th style={{ textAlign: 'center', minWidth: '85px' }}>Stock Bodega</th>

              {/* Días Lunes a Sábado con Fechas y resaltado de HOY */}
              {dayCols.map((col) => {
                const isToday = col.dateIso === todayIso;
                return (
                  <th 
                    key={col.key} 
                    style={{ 
                      textAlign: 'center', 
                      background: isToday ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.06)', 
                      minWidth: '58px',
                      borderBottom: isToday ? '2px solid var(--cyan-primary)' : 'inherit'
                    }}
                  >
                    <div style={{ fontWeight: 800, color: isToday ? 'var(--cyan-primary)' : '#f8fafc' }}>
                      {col.label}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: isToday ? '#38bdf8' : 'var(--text-muted)', fontWeight: 600 }}>
                      {col.dateShort}
                    </div>
                    {isToday && (
                      <span style={{
                        fontSize: '0.58rem',
                        background: 'var(--cyan-primary)',
                        color: '#04111d',
                        padding: '1px 4px',
                        borderRadius: '4px',
                        fontWeight: 800,
                        marginTop: '2px',
                        display: 'inline-block'
                      }}>
                        HOY
                      </span>
                    )}
                  </th>
                );
              })}

              <th style={{ textAlign: 'center', background: 'rgba(245, 158, 11, 0.08)', minWidth: '65px' }}>Reservas</th>
              <th style={{ textAlign: 'center', minWidth: '90px' }}>Total Salidas</th>
              <th style={{ textAlign: 'center', minWidth: '95px' }}>Precio Venta Real</th>
              <th style={{ textAlign: 'right', minWidth: '105px' }}>Total Venta (Bs)</th>
              <th style={{ textAlign: 'center', minWidth: '90px' }}>Stock Final</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="14" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px auto', display: 'block', color: 'var(--cyan-primary)' }} />
                  Cargando planilla de despachos automáticos...
                </td>
              </tr>
            ) : productsData.length === 0 ? (
              <tr>
                <td colSpan="14" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                  {onlyDispatched ? (
                    <div>
                      <p style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                        No hay productos con salidas registradas para {weekLabel}.
                      </p>
                      <button 
                        onClick={() => setOnlyDispatched(false)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', margin: '0 auto' }}
                      >
                        Ver Todo el Catálogo de Productos
                      </button>
                    </div>
                  ) : (
                    'No se encontraron productos coincidentes.'
                  )}
                </td>
              </tr>
            ) : (
              productsData.map((p) => {
                const totalOut = getRowTotal(p.id);
                const estimatedStock = p.current_stock - (totalOut - (p.total_week || 0));
                const isNegative = estimatedStock < 0;

                // Precio de venta real de la nota de venta o precio mayorista por defecto
                const hasRealSales = (p.auto_total_sold || 0) > 0;
                const realSoldPrice = p.auto_avg_price || p.wholesale_price || p.sale_price || 0;
                const realRevenue = hasRealSales ? p.auto_total_revenue : (totalOut * realSoldPrice);

                return (
                  <tr key={p.id}>
                    {/* SKU */}
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyan-primary)' }}>
                      {p.sku}
                    </td>

                    {/* Name, Brand & Warehouse */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{p.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                        <span>🏷️ {p.brand}</span>
                        <span>📍 {p.warehouse || 'CASA CUBANO'}</span>
                        {p.notes_summary && (
                          <button
                            type="button"
                            onClick={() => setSelectedNoteDetail(p)}
                            style={{
                              background: 'rgba(6, 182, 212, 0.15)',
                              border: '1px solid rgba(6, 182, 212, 0.35)',
                              borderRadius: '4px',
                              padding: '1px 6px',
                              fontSize: '0.66rem',
                              color: 'var(--cyan-primary)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="Ver desglose de notas de venta que despacharon este ítem"
                          >
                            <FileText size={10} />
                            Ver Notas ({p.auto_total_sold}u)
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Available Stock */}
                    <td style={{ textAlign: 'center', fontWeight: 800, color: p.current_stock <= 0 ? '#f43f5e' : 'var(--text-main)' }}>
                      {formatNumber(p.current_stock)} {p.unit || 'u.'}
                    </td>

                    {/* Días Lunes a Sábado con inputs pre-poblados automáticamente */}
                    {dayCols.map((col) => {
                      const autoVal = p[col.autoKey] || 0;
                      const currentVal = getVal(p.id, col.key);
                      const isToday = col.dateIso === todayIso;
                      const hasSale = autoVal > 0;

                      return (
                        <td 
                          key={col.key} 
                          style={{ 
                            textAlign: 'center', 
                            background: isToday ? 'rgba(6, 182, 212, 0.08)' : (hasSale ? 'rgba(6, 182, 212, 0.04)' : 'transparent')
                          }}
                        >
                          <input
                            type="number"
                            min="0"
                            style={{
                              width: '46px',
                              padding: '4px',
                              textAlign: 'center',
                              background: hasSale ? 'rgba(6, 182, 212, 0.2)' : 'rgba(0, 0, 0, 0.5)',
                              border: hasSale ? '1px solid rgba(6, 182, 212, 0.6)' : '1px solid var(--border-glass)',
                              borderRadius: '6px',
                              color: hasSale ? '#38bdf8' : '#f8fafc',
                              fontSize: '0.8rem',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: hasSale ? 800 : 600
                            }}
                            value={currentVal || ''}
                            placeholder="0"
                            onChange={(e) => handleCellChange(p.id, col.key, e.target.value)}
                            title={hasSale ? `Auto-despachado: ${autoVal} u. desde notas de venta` : '0 salidas'}
                          />
                        </td>
                      );
                    })}

                    {/* Reservas */}
                    <td style={{ textAlign: 'center', background: 'rgba(245, 158, 11, 0.04)' }}>
                      <input
                        type="number"
                        min="0"
                        style={{
                          width: '46px',
                          padding: '4px',
                          textAlign: 'center',
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          borderRadius: '6px',
                          color: '#fbbf24',
                          fontSize: '0.8rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700
                        }}
                        value={getVal(p.id, 'qty_reservas') || ''}
                        placeholder="0"
                        onChange={(e) => handleCellChange(p.id, 'qty_reservas', e.target.value)}
                        title="Unidades apartadas o en reserva"
                      />
                    </td>

                    {/* Total Salidas Semana */}
                    <td style={{ textAlign: 'center', fontWeight: 800, color: totalOut > 0 ? '#38bdf8' : 'var(--text-muted)' }}>
                      {totalOut > 0 ? (
                        <span style={{
                          background: 'rgba(6, 182, 212, 0.15)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(6, 182, 212, 0.3)'
                        }}>
                          {totalOut} u.
                        </span>
                      ) : '-'}
                    </td>

                    {/* Precio de Venta Real (con el que se vendió en nota) */}
                    <td style={{ textAlign: 'center' }}>
                      {hasRealSales ? (
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#34d399', fontSize: '0.82rem' }}>
                            Bs {p.auto_min_price === p.auto_max_price 
                              ? Number(p.auto_avg_price).toFixed(2) 
                              : `${Number(p.auto_min_price).toFixed(2)} - ${Number(p.auto_max_price).toFixed(2)}`}
                          </div>
                          <span style={{
                            fontSize: '0.63rem',
                            color: '#34d399',
                            background: 'rgba(16, 185, 129, 0.12)',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontWeight: 700
                          }}>
                            ⚡ Venta Nota
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            Bs {Number(p.wholesale_price || p.sale_price || 0).toFixed(2)}
                          </div>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Mayorista</span>
                        </div>
                      )}
                    </td>

                    {/* Total Venta Real (Bs) */}
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: realRevenue > 0 ? '#10b981' : 'var(--text-muted)' }}>
                      {realRevenue > 0 ? `Bs ${Number(realRevenue).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                    </td>

                    {/* Stock Final Estimado */}
                    <td style={{
                      textAlign: 'center',
                      fontWeight: 800,
                      color: isNegative ? '#f43f5e' : estimatedStock <= p.min_stock ? '#fbbf24' : '#10b981'
                    }}>
                      {formatNumber(estimatedStock)} {p.unit || 'u.'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalCount > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginTop: '18px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-glass)',
          fontSize: '0.82rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            Mostrando <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> a <strong>{Math.min(currentPage * itemsPerPage, totalCount)}</strong> de <strong>{totalCount.toLocaleString()}</strong> productos
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Por página:</span>
              <select
                className="form-select"
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{ padding: '4px 8px', fontSize: '0.78rem', width: 'auto' }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                className="btn btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
              >
                ««
              </button>
              <button
                className="btn btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
              >
                Anterior
              </button>
              <span style={{ padding: '0 6px', fontWeight: 600, color: 'var(--text-main)' }}>
                Página {currentPage} de {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
              >
                Siguiente
              </button>
              <button
                className="btn btn-secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
              >
                »»
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
