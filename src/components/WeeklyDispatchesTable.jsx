import React, { useState, useEffect, useCallback } from 'react';
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
  Sparkles
} from 'lucide-react';
import { formatNumber, formatCurrency } from '../utils/formatters';

// Helper to get week code like '2026-W40' and date range
function getWeekInfo(offsetWeeks = 0) {
  const d = new Date();
  d.setDate(d.getDate() + (offsetWeeks * 7));
  
  // Find Monday
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  
  const saturday = new Date(monday);
  saturday.setDate(saturday.getDate() + 5);

  // ISO Week number
  const startOfYear = new Date(monday.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((monday - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
  const weekCode = `${monday.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;

  const formatD = (date) => `${date.getDate()} ${date.toLocaleString('es-ES', { month: 'short' })}`;
  const label = `Semana ${weekNumber} (${formatD(monday)} - ${formatD(saturday)} ${monday.getFullYear()})`;
  const mondayIso = monday.toISOString().split('T')[0];

  return { weekCode, label, mondayIso };
}

export default function WeeklyDispatchesTable({ onStockUpdated }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const { weekCode, label: weekLabel, mondayIso } = getWeekInfo(weekOffset);

  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [brands, setBrands] = useState(['Todas']);
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  // In-memory edit tracking: { [productId]: { qty_l, qty_m, qty_mi, qty_j, qty_v, qty_s, qty_reservas } }
  const [edits, setEdits] = useState({});

  // Fetch data for current week
  const fetchWeekData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const url = `/api/weekly-dispatches?weekCode=${weekCode}&brand=${encodeURIComponent(selectedBrand)}&search=${encodeURIComponent(searchTerm)}&limit=${itemsPerPage}&offset=${offset}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        setProductsData(json.data);
        setTotalCount(json.total || 0);

        // Pre-fill edits map with current values from db
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
  }, [weekCode, selectedBrand, searchTerm, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchWeekData();
  }, [fetchWeekData]);

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

  // Save all dispatches to SQLite
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
          items: itemsToSave
        })
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Error al guardar la planilla');

      setToast(json.message);
      setTimeout(() => setToast(''), 4500);

      // Refresh data
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
    if (!window.confirm('¿Deseas reiniciar a 0 las casillas de L-M-M-J-V-S para esta semana en pantalla? (Los datos guardados anteriormente se reajustarán al guardar)')) return;
    const cleared = {};
    productsData.forEach(p => {
      cleared[p.id] = { qty_l: 0, qty_m: 0, qty_mi: 0, qty_j: 0, qty_v: 0, qty_s: 0, qty_reservas: 0 };
    });
    setEdits(cleared);
  };

  // Calculate global summary for the visible products
  const sumUnitsDispatched = Object.keys(edits).reduce((acc, pId) => {
    const e = edits[pId] || {};
    return acc + (e.qty_l || 0) + (e.qty_m || 0) + (e.qty_mi || 0) + (e.qty_j || 0) + (e.qty_v || 0) + (e.qty_s || 0);
  }, 0);

  const sumReserves = Object.keys(edits).reduce((acc, pId) => acc + (edits[pId]?.qty_reservas || 0), 0);

  const sumRevenueBs = productsData.reduce((acc, p) => {
    const totalOut = getRowTotal(p.id);
    const price = p.wholesale_price || p.sale_price || 0;
    return acc + (totalOut * price);
  }, 0);

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          background: 'rgba(16, 185, 129, 0.95)',
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
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(99, 102, 241, 0.25))',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cyan-primary)'
          }}>
            <CalendarDays size={24} />
          </div>
          <div>
            <h3 className="font-heading" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Planilla de Despachos Semanales (L - M - M - J - V - S)
              <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                Enlace Directo a Bodega
              </span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Registra las salidas por día de la semana y reservas; el sistema descuenta automáticamente el stock en bodega
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

          <button
            onClick={handleClearWeek}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '8px 14px', gap: '6px' }}
            title="Poner a 0 casillas en pantalla"
          >
            <RotateCcw size={14} />
            <span>Limpiar</span>
          </button>

          <button
            onClick={handleSavePlanilla}
            disabled={saving}
            className="btn btn-emerald"
            style={{
              fontSize: '0.85rem',
              padding: '9px 20px',
              gap: '8px',
              fontWeight: 700,
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Save size={16} />
            <span>{saving ? 'Guardando en Base de Datos...' : 'Guardar y Descontar Stock'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards for the current week */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          padding: '14px 18px',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Unidades Despachadas (L-S)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cyan-primary)', marginTop: '2px' }}>
            {sumUnitsDispatched.toLocaleString()} u.
          </div>
        </div>

        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          padding: '14px 18px',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Reservas Pendientes</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
            {sumReserves.toLocaleString()} u.
          </div>
        </div>

        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '14px 18px',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Venta Despachada (Bs)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
            Bs {sumRevenueBs.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '18px',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por código SKU, detalle o bodega..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Brand Selector */}
        {brands.length > 2 && (
          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select"
              value={selectedBrand}
              onChange={(e) => { setSelectedBrand(e.target.value); setCurrentPage(1); }}
              style={{ fontWeight: 600, color: 'var(--cyan-primary)' }}
            >
              {brands.map(b => (
                <option key={b} value={b}>Marca: {b}</option>
              ))}
            </select>
          </div>
        )}
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

      {/* Interactive Matrix Table */}
      <div className="data-table-container" style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ fontSize: '0.78rem' }}>
          <thead>
            <tr>
              <th style={{ minWidth: '100px' }}>SKU</th>
              <th style={{ minWidth: '240px' }}>Producto & Bodega</th>
              <th style={{ textAlign: 'center', minWidth: '90px' }}>Stock Disponible</th>
              <th style={{ textAlign: 'center', background: 'rgba(6, 182, 212, 0.08)', minWidth: '55px' }}>L</th>
              <th style={{ textAlign: 'center', background: 'rgba(6, 182, 212, 0.08)', minWidth: '55px' }}>M</th>
              <th style={{ textAlign: 'center', background: 'rgba(6, 182, 212, 0.08)', minWidth: '55px' }}>M</th>
              <th style={{ textAlign: 'center', background: 'rgba(6, 182, 212, 0.08)', minWidth: '55px' }}>J</th>
              <th style={{ textAlign: 'center', background: 'rgba(6, 182, 212, 0.08)', minWidth: '55px' }}>V</th>
              <th style={{ textAlign: 'center', background: 'rgba(6, 182, 212, 0.08)', minWidth: '55px' }}>S</th>
              <th style={{ textAlign: 'center', background: 'rgba(245, 158, 11, 0.08)', minWidth: '65px' }}>Reservas</th>
              <th style={{ textAlign: 'center', minWidth: '95px' }}>Total Salidas</th>
              <th style={{ textAlign: 'center', minWidth: '90px' }}>Stock Final</th>
              <th style={{ textAlign: 'right', minWidth: '100px' }}>Venta (Bs)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="13" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                  Cargando productos de la planilla...
                </td>
              </tr>
            ) : productsData.length === 0 ? (
              <tr>
                <td colSpan="13" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                  No se encontraron productos coincidentes.
                </td>
              </tr>
            ) : (
              productsData.map((p) => {
                const totalOut = getRowTotal(p.id);
                const estimatedStock = p.current_stock - (totalOut - (p.total_week || 0));
                const price = p.wholesale_price || p.sale_price || 0;
                const totalRowRevenue = totalOut * price;
                const isNegative = estimatedStock < 0;

                const inputStyle = {
                  width: '46px',
                  padding: '4px',
                  textAlign: 'center',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600
                };

                return (
                  <tr key={p.id}>
                    {/* SKU */}
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyan-primary)' }}>
                      {p.sku}
                    </td>

                    {/* Name, Brand & Warehouse */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{p.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                        <span>🏷️ {p.brand}</span>
                        <span>📍 {p.warehouse || 'CASA CUBANO'}</span>
                        <span>Bs {Number(price).toFixed(2)}</span>
                      </div>
                    </td>

                    {/* Available Stock */}
                    <td style={{ textAlign: 'center', fontWeight: 800, color: p.current_stock <= 0 ? '#f43f5e' : 'var(--text-main)' }}>
                      {formatNumber(p.current_stock)} {p.unit || 'u.'}
                    </td>

                    {/* Lunes */}
                    <td style={{ textAlign: 'center', background: 'rgba(6, 182, 212, 0.03)' }}>
                      <input
                        type="number"
                        min="0"
                        style={inputStyle}
                        value={getVal(p.id, 'qty_l') || ''}
                        placeholder="0"
                        onChange={(e) => handleCellChange(p.id, 'qty_l', e.target.value)}
                      />
                    </td>

                    {/* Martes */}
                    <td style={{ textAlign: 'center', background: 'rgba(6, 182, 212, 0.03)' }}>
                      <input
                        type="number"
                        min="0"
                        style={inputStyle}
                        value={getVal(p.id, 'qty_m') || ''}
                        placeholder="0"
                        onChange={(e) => handleCellChange(p.id, 'qty_m', e.target.value)}
                      />
                    </td>

                    {/* Miercoles */}
                    <td style={{ textAlign: 'center', background: 'rgba(6, 182, 212, 0.03)' }}>
                      <input
                        type="number"
                        min="0"
                        style={inputStyle}
                        value={getVal(p.id, 'qty_mi') || ''}
                        placeholder="0"
                        onChange={(e) => handleCellChange(p.id, 'qty_mi', e.target.value)}
                      />
                    </td>

                    {/* Jueves */}
                    <td style={{ textAlign: 'center', background: 'rgba(6, 182, 212, 0.03)' }}>
                      <input
                        type="number"
                        min="0"
                        style={inputStyle}
                        value={getVal(p.id, 'qty_j') || ''}
                        placeholder="0"
                        onChange={(e) => handleCellChange(p.id, 'qty_j', e.target.value)}
                      />
                    </td>

                    {/* Viernes */}
                    <td style={{ textAlign: 'center', background: 'rgba(6, 182, 212, 0.03)' }}>
                      <input
                        type="number"
                        min="0"
                        style={inputStyle}
                        value={getVal(p.id, 'qty_v') || ''}
                        placeholder="0"
                        onChange={(e) => handleCellChange(p.id, 'qty_v', e.target.value)}
                      />
                    </td>

                    {/* Sabado */}
                    <td style={{ textAlign: 'center', background: 'rgba(6, 182, 212, 0.03)' }}>
                      <input
                        type="number"
                        min="0"
                        style={inputStyle}
                        value={getVal(p.id, 'qty_s') || ''}
                        placeholder="0"
                        onChange={(e) => handleCellChange(p.id, 'qty_s', e.target.value)}
                      />
                    </td>

                    {/* Reservas */}
                    <td style={{ textAlign: 'center', background: 'rgba(245, 158, 11, 0.04)' }}>
                      <input
                        type="number"
                        min="0"
                        style={{ ...inputStyle, borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
                        value={getVal(p.id, 'qty_reservas') || ''}
                        placeholder="0"
                        onChange={(e) => handleCellChange(p.id, 'qty_reservas', e.target.value)}
                      />
                    </td>

                    {/* Total Salidas Semana */}
                    <td style={{ textAlign: 'center', fontWeight: 800, color: totalOut > 0 ? '#38bdf8' : 'var(--text-muted)' }}>
                      {totalOut > 0 ? `${totalOut} u.` : '-'}
                    </td>

                    {/* Stock Final Estimado */}
                    <td style={{
                      textAlign: 'center',
                      fontWeight: 800,
                      color: isNegative ? '#f43f5e' : estimatedStock <= p.min_stock ? '#fbbf24' : '#10b981'
                    }}>
                      {formatNumber(estimatedStock)} {p.unit || 'u.'}
                    </td>

                    {/* Venta Estimada (Bs) */}
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: totalRowRevenue > 0 ? '#10b981' : 'var(--text-muted)' }}>
                      {totalRowRevenue > 0 ? `Bs ${totalRowRevenue.toFixed(2)}` : '-'}
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
