import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Search, 
  Users, 
  ArrowRight, 
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  Phone,
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import { formatNumber, formatCurrency } from '../../utils/formatters';

export default function SalesDashboard({ 
  products = [], 
  onOpenNewNote, 
  onOpenCustomers,
  onSelectTab,
  currentUser 
}) {
  const [salesData, setSalesData] = useState({
    notes: [],
    kpis: {
      total_sales: 0,
      total_collected: 0,
      total_receivable: 0,
      pending_notes_count: 0,
      total_notes: 0
    }
  });
  const [loading, setLoading] = useState(true);

  // Fetch sales notes and commercial KPIs
  useEffect(() => {
    let isMounted = true;
    async function loadSales() {
      try {
        const res = await fetch('/api/sales-notes?limit=15').then(r => r.json());
        if (res.success && isMounted) {
          setSalesData({
            notes: res.data || [],
            kpis: res.kpis || {
              total_sales: 0,
              total_collected: 0,
              total_receivable: 0,
              pending_notes_count: 0,
              total_notes: 0
            }
          });
        }
      } catch (err) {
        console.error('Error cargando datos de ventas:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSales();
    return () => { isMounted = false; };
  }, []);

  // Top products with available stock for immediate sales
  const availableTopProducts = products
    .filter(p => (Number(p.current_stock) || 0) > 0)
    .slice(0, 6);

  const kpis = salesData.kpis;
  const collectionRate = kpis.total_sales > 0 
    ? Math.round((kpis.total_collected / kpis.total_sales) * 100) 
    : 0;

  // Format today's date in Spanish
  const todayLabel = new Date().toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Header con Saludo y Acción Rápida */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-orange-500/20">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span>Portal Comercial & Despachos</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hola, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Vendedor'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 capitalize">
            {todayLabel} • Listo para atender pedidos y cobros
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab('weekly')}
            className="btn btn-secondary flex-1 sm:flex-none px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold cursor-pointer border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 shadow-sm"
            title="Ver la planilla de despachos semanal automática"
          >
            <CalendarDays size={16} />
            <span>Planilla Semanal</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewNote}
            className="btn btn-primary flex-1 sm:flex-none px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold cursor-pointer"
          >
            <Plus size={16} />
            <span>+ Nueva Nota</span>
          </button>
        </div>
      </div>

      {/* 2. KPIs Comerciales del Vendedor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Facturado */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Ventas Totales
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              Bs {formatNumber(kpis.total_sales)}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {kpis.total_notes} notas emitidas
            </span>
          </div>
        </div>

        {/* Cobrado / Recaudado */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Cobrado / Efectivo
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              Bs {formatNumber(kpis.total_collected)}
            </div>
            <span className="text-[11px] text-emerald-600/80 font-bold">
              {collectionRate}% recaudado
            </span>
          </div>
        </div>

        {/* Por Cobrar / Crédito */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Saldo por Cobrar
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              Bs {formatNumber(kpis.total_receivable)}
            </div>
            <span className="text-[11px] text-amber-600 font-semibold">
              {kpis.pending_notes_count} notas pendientes
            </span>
          </div>
        </div>

        {/* Cartera Activa */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Cartera de Clientes
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              Activa
            </div>
            <button
              type="button"
              onClick={onOpenCustomers}
              className="text-[11px] text-blue-600 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Ver cartera</span>
              <ArrowRight size={11} />
            </button>
          </div>
        </div>

      </div>

      {/* 3. Accesos Rápidos para el Vendedor */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={onOpenNewNote}
          className="p-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-left flex items-center justify-between transition-all shadow-md shadow-orange-500/20 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus size={20} />
            </div>
            <div>
              <div className="text-sm font-black">Emitir Nota de Venta</div>
              <div className="text-[11px] text-white/80">Crear pedido con precios mayorista</div>
            </div>
          </div>
          <ArrowRight size={18} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('inventory')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left flex items-center justify-between transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Search size={18} />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-white">Consultar Precios & Stock</div>
              <div className="text-[11px] text-slate-500">Buscar por código SKU o nombre</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400" />
        </button>

        <button
          type="button"
          onClick={onOpenCustomers}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left flex items-center justify-between transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-white">Saldos & Deudores</div>
              <div className="text-[11px] text-slate-500">Historial y abonos por cliente</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400" />
        </button>
      </div>

      {/* 4. Cuerpo Principal: Notas Recientes + Productos Disponibles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Notas de Venta Recientes (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-orange-500" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Últimas Notas de Venta Emitidas
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('notes')}
              className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todas</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Cargando notas de venta...
            </div>
          ) : salesData.notes.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileText size={32} className="mx-auto opacity-30" />
              <p className="text-xs">No hay notas registradas aún hoy.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-2.5 font-bold">Nota</th>
                    <th className="py-2.5 font-bold">Cliente</th>
                    <th className="py-2.5 font-bold text-right">Total (Bs)</th>
                    <th className="py-2.5 font-bold text-right">Saldo (Bs)</th>
                    <th className="py-2.5 font-bold text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {salesData.notes.slice(0, 7).map((note) => {
                    const isPaid = (note.balance_due || 0) <= 0;
                    return (
                      <tr 
                        key={note.id}
                        onClick={() => onSelectTab('notes')}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 font-mono font-bold text-orange-600">
                          {note.note_code || `NV-${note.id}`}
                        </td>
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                          <div className="truncate max-w-[180px]">{note.customer_name}</div>
                          {note.customer_phone && (
                            <span className="text-[10px] text-slate-400 font-normal block">
                              📞 {note.customer_phone}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                          Bs {formatNumber(note.total_amount)}
                        </td>
                        <td className="py-3 text-right font-mono font-bold">
                          {isPaid ? (
                            <span className="text-emerald-600">Bs 0.00</span>
                          ) : (
                            <span className="text-amber-600">Bs {formatNumber(note.balance_due)}</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            isPaid 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'
                          }`}>
                            {isPaid ? 'PAGADO' : 'PENDIENTE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Columna Derecha: Productos con Stock para Vender (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-indigo-500" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Stock Listo para Venta
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('inventory')}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver catálogo</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-3">
            {availableTopProducts.map((p) => {
              const mayorPrice = p.wholesale_price || p.sale_price;
              return (
                <div 
                  key={p.id}
                  onClick={() => onSelectTab('inventory')}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-[10px] font-bold text-indigo-600 uppercase">
                      {p.sku}
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {p.name}
                    </p>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-bold text-emerald-600">
                        {formatNumber(p.current_stock)} u disp.
                      </span>
                      {p.boxes_count > 0 && (
                        <span>({p.boxes_count} cjs)</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-slate-900 dark:text-white font-mono">
                      Bs {Number(mayorPrice || 0).toFixed(2)}
                    </div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">
                      P. Mayor
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenNewNote}
            className="w-full py-2.5 rounded-xl border border-dashed border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-orange-100 transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Crear pedido con estos productos</span>
          </button>
        </div>

      </div>

    </div>
  );
}

