import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Search, 
  Users, 
  ArrowRight, 
  Package,
  Phone,
  AlertCircle,
  CalendarDays,
  Pencil,
  Printer,
  MapPin,
  User
} from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

export default function SalesDashboard({ 
  products = [], 
  onOpenNewNote, 
  onOpenEditNote,
  onOpenPrintNote,
  onOpenAddPayment,
  onOpenCustomers,
  onSelectTab,
  refreshTrigger,
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
  const [notesViewMode, setNotesViewMode] = useState('DEBT'); // 'DEBT' (Notas con Deuda) | 'ALL' (Todas las Notas de Clientes)
  const [noteSearch, setNoteSearch] = useState('');
  const notesSectionRef = useRef(null);

  // Fetch all sales notes and commercial KPIs
  useEffect(() => {
    let isMounted = true;
    async function loadSales() {
      setLoading(true);
      try {
        const res = await fetch('/api/sales-notes?limit=200').then(r => r.json());
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
  }, [refreshTrigger]);

  // All notes with active debt (balance_amount > 0 and not cancelled)
  const debtNotes = useMemo(() => {
    return (salesData.notes || []).filter(
      n => Number(n.balance_amount) > 0 && n.status !== 'ANULADO'
    );
  }, [salesData.notes]);

  // Filtered notes according to active tab ('DEBT' vs 'ALL') and search query
  const displayedNotes = useMemo(() => {
    const baseList = notesViewMode === 'DEBT'
      ? debtNotes
      : (salesData.notes || []).filter(n => n.status !== 'ANULADO');

    const q = noteSearch.trim().toLowerCase();
    if (!q) return baseList;
    return baseList.filter(n =>
      (n.note_code || '').toLowerCase().includes(q) ||
      (n.customer_name || '').toLowerCase().includes(q) ||
      (n.customer_phone || '').toLowerCase().includes(q) ||
      (n.seller_name || '').toLowerCase().includes(q) ||
      (n.delivery_destination || '').toLowerCase().includes(q)
    );
  }, [notesViewMode, debtNotes, salesData.notes, noteSearch]);

  // Helper to fetch full note details and open Edit or Print modal
  const handleInspectNote = async (noteId, mode = 'print') => {
    try {
      const res = await fetch(`/api/sales-notes/${noteId}`).then(r => r.json());
      if (res.success && res.data) {
        if (mode === 'edit' && onOpenEditNote) {
          onOpenEditNote(res.data);
        } else if (onOpenPrintNote) {
          onOpenPrintNote(res.data);
        }
      }
    } catch (err) {
      console.error('Error al cargar detalle de la nota:', err);
    }
  };

  // Top products with available stock for immediate sales
  const availableTopProducts = products
    .filter(p => (Number(p.current_stock) || 0) > 0)
    .slice(0, 6);

  const kpis = salesData.kpis;
  const collectionRate = kpis.total_sales > 0 
    ? Math.round((kpis.total_collected / kpis.total_sales) * 100) 
    : 0;

  const formatBs = (v) => Number(v || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Format today's date in Spanish
  const todayLabel = new Date().toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const scrollToNotesSection = (mode) => {
    setNotesViewMode(mode);
    setTimeout(() => {
      notesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in">
      
      {/* 1. Header con Saludo y Acción Rápida */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-orange-500/20">
        <div>
          <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span>Portal Comercial de Tienda & Ventas</span>
          </div>
          <h1 className="text-lg sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hola, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Vendedor'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
            {todayLabel} • Emisión de notas, cobros en tienda y cuentas de clientes
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab('weekly')}
            className="btn btn-secondary flex-1 sm:flex-none px-3 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold cursor-pointer border border-cyan-500/30 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-500/10 shadow-xs"
            title="Ver la planilla de despachos semanal"
          >
            <CalendarDays size={15} />
            <span>Planilla Semanal</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewNote}
            className="btn btn-primary flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold cursor-pointer"
          >
            <Plus size={16} />
            <span>Nueva Nota</span>
          </button>
        </div>
      </div>

      {/* 2. KPIs Comerciales del Vendedor (2x2 en móvil para máxima claridad) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Total Facturado */}
        <div 
          onClick={() => scrollToNotesSection('ALL')}
          className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3 cursor-pointer hover:border-orange-400 transition-colors"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
            <DollarSign size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block truncate">
              Ventas Totales
            </span>
            <div className="text-sm sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 font-mono truncate">
              Bs {formatNumber(kpis.total_sales)}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium block truncate">
              {kpis.total_notes} notas emitidas
            </span>
          </div>
        </div>

        {/* Cobrado / Recaudado */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block truncate">
              Cobrado Real
            </span>
            <div className="text-sm sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono truncate">
              Bs {formatNumber(kpis.total_collected)}
            </div>
            <span className="text-[10px] sm:text-[11px] text-emerald-600/80 font-bold block truncate">
              {collectionRate}% recaudado
            </span>
          </div>
        </div>

        {/* Por Cobrar / Crédito (Clic lleva directo a Notas con Deuda) */}
        <div 
          onClick={() => scrollToNotesSection('DEBT')}
          className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs flex items-center gap-3 cursor-pointer hover:border-rose-500 transition-colors"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block truncate">
              Notas con Deuda
            </span>
            <div className="text-sm sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5 font-mono truncate">
              Bs {formatNumber(kpis.total_receivable)}
            </div>
            <span className="text-[10px] sm:text-[11px] text-rose-600 font-bold block truncate">
              {debtNotes.length} notas por cobrar
            </span>
          </div>
        </div>

        {/* Cartera Activa */}
        <div 
          onClick={onOpenCustomers}
          className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3 cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block truncate">
              Clientes & Notas
            </span>
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 truncate">
              Cartera Activa
            </div>
            <span className="text-[10px] sm:text-[11px] text-indigo-600 dark:text-indigo-400 font-bold inline-flex items-center gap-1">
              <span>Abrir cartera</span>
              <ArrowRight size={11} />
            </span>
          </div>
        </div>

      </div>

      {/* 3. Accesos Rápidos para Tienda / Ventas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={onOpenNewNote}
          className="p-3.5 sm:p-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-left flex items-center justify-between transition-all shadow-md shadow-orange-500/20 cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Plus size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black truncate">Emitir Nota de Venta</div>
              <div className="text-[11px] text-white/85 truncate">Crear pedido por caja o unidad</div>
            </div>
          </div>
          <ArrowRight size={17} className="shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => scrollToNotesSection('DEBT')}
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-rose-50/40 dark:hover:bg-slate-800 border-2 border-rose-200 dark:border-rose-500/30 text-left flex items-center justify-between transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <DollarSign size={19} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                Cobrar Notas con Deuda ({debtNotes.length})
              </div>
              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold truncate">
                Registrar pago o abono en tienda
              </div>
            </div>
          </div>
          <ArrowRight size={16} className="text-rose-500 shrink-0" />
        </button>

        <button
          type="button"
          onClick={onOpenCustomers}
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left flex items-center justify-between transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                Cartera de Clientes & Notas
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                Ver notas por cliente, editar y abonar
              </div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('inventory')}
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left flex items-center justify-between transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <Search size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black text-slate-900 dark:text-white truncate">Consultar Precios & Stock</div>
              <div className="text-[11px] text-slate-500 truncate">Buscar por código SKU o nombre</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400 shrink-0" />
        </button>
      </div>

      {/* 4. Cuerpo Principal: Centro de Notas con Deuda + Todas las Notas de Clientes */}
      <div ref={notesSectionRef} className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Columna Izquierda: Gestión de Notas con Deuda y Todas las Notas (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          
          {/* Header & Mode Switcher Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileText size={19} className="text-orange-500 shrink-0" />
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base m-0">
                  {notesViewMode === 'DEBT' 
                    ? `Notas con Deuda Pendiente (${debtNotes.length})` 
                    : `Todas las Notas de Clientes (${salesData.notes.length})`}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                  Registra pagos/abonos en tienda, edita pedidos o revisa el comprobante
                </p>
              </div>
            </div>

            {/* Selector Pestañas: Notas con Deuda vs Todas las Notas */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setNotesViewMode('DEBT')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  notesViewMode === 'DEBT'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <AlertCircle size={13} />
                <span>Notas con Deuda ({debtNotes.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setNotesViewMode('ALL')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  notesViewMode === 'ALL'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText size={13} />
                <span>Todas las Notas ({salesData.notes.length})</span>
              </button>
            </div>
          </div>

          {/* Search Input for Notes & Customers */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={noteSearch}
                onChange={e => setNoteSearch(e.target.value)}
                placeholder="Buscar por cliente (ej. ABEL VARGAS), código (IR15AV), teléfono o destino..."
                className="form-input text-xs font-semibold h-10 w-full"
                style={{ paddingLeft: '34px' }}
              />
            </div>
            <button
              type="button"
              onClick={onOpenCustomers}
              className="py-2 px-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 hover:bg-indigo-100"
            >
              <Users size={15} />
              <span>Buscar por Cartera de Clientes</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-bold">
              Cargando notas de clientes...
            </div>
          ) : displayedNotes.length === 0 ? (
            <div className="py-10 text-center text-slate-400 space-y-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
              <FileText size={30} className="mx-auto opacity-40 text-slate-400" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {notesViewMode === 'DEBT' 
                  ? 'No se encontraron notas con deuda pendiente para esta búsqueda.' 
                  : 'No se encontraron notas registradas con ese criterio.'}
              </p>
              {notesViewMode === 'DEBT' && (
                <button
                  type="button"
                  onClick={() => setNotesViewMode('ALL')}
                  className="text-xs font-extrabold text-cyan-600 dark:text-cyan-400 underline cursor-pointer"
                >
                  Ver todas las notas emitidas
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-0.5">
              {displayedNotes.map((note) => {
                const balance = Number(note.balance_amount ?? 0);
                const paid = Number(note.paid_amount ?? 0);
                const total = Number(note.total_amount ?? 0);
                const isPaid = balance <= 0 || note.status === 'PAGADO';

                return (
                  <div
                    key={note.id}
                    className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                      !isPaid
                        ? 'bg-amber-50/40 dark:bg-slate-800/80 border-amber-300/80 dark:border-amber-500/40'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80'
                    }`}
                  >
                    {/* Top Row: Code + Customer Name + Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30">
                            {note.note_code || `NV-${note.id}`}
                          </span>
                          <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                            {note.customer_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          <span>Fecha: <strong className="text-slate-700 dark:text-slate-200">{note.date}</strong></span>
                          {note.due_date && note.due_date !== note.date && !isPaid && (
                            <span className="text-rose-600 dark:text-rose-400 font-bold">
                              • Vence: {note.due_date}
                            </span>
                          )}
                          {note.customer_phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone size={11} /> {note.customer_phone}
                            </span>
                          )}
                          {note.delivery_destination && (
                            <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
                              <MapPin size={11} /> {note.delivery_destination}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <User size={11} /> {note.seller_name || 'General'}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                        isPaid 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                          : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40'
                      }`}>
                        {isPaid ? 'PAGADO' : 'DEUDA PENDIENTE'}
                      </span>
                    </div>

                    {/* Middle Row: Financial Breakdown (Total | A Cuenta | Saldo) + Direct Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700/70">
                      <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700/70">
                        <div>
                          <span className="text-[9px] font-bold uppercase text-slate-400 block">Total Nota</span>
                          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono">
                            Bs {formatBs(total)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold uppercase text-slate-400 block">A Cuenta</span>
                          <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            Bs {formatBs(paid)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold uppercase text-slate-400 block">Saldo Deuda</span>
                          <span className={`text-xs sm:text-sm font-black font-mono ${
                            !isPaid ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                          }`}>
                            Bs {formatBs(balance)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons: Cobrar / A Cuenta, Editar Nota, Ver Nota */}
                      <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap justify-end">
                        {!isPaid && onOpenAddPayment && (
                          <button
                            type="button"
                            onClick={() => onOpenAddPayment(note)}
                            className="flex-1 sm:flex-none py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all"
                            title="Registrar pago o abono a cuenta en tienda"
                          >
                            <DollarSign size={14} />
                            <span>Cobrar / A Cuenta</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleInspectNote(note.id, 'edit')}
                          className="py-2 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-500/15 dark:hover:bg-cyan-500/25 border border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                          title="Editar productos, precios o abonos de esta nota"
                        >
                          <Pencil size={13} />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInspectNote(note.id, 'print')}
                          className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                          title="Ver comprobante o enviar por WhatsApp"
                        >
                          <Printer size={13} />
                          <span>Ver Nota</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha: Productos con Stock para Vender (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-indigo-500" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base m-0">
                Stock Listo para Venta
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('inventory')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver catálogo</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-2.5">
            {availableTopProducts.map((p) => {
              const mayorPrice = p.wholesale_price || p.sale_price;
              return (
                <div 
                  key={p.id}
                  onClick={() => onSelectTab('inventory')}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                      {p.sku}
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {p.name}
                    </p>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
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
