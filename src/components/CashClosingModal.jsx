import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Wallet,
  Banknote,
  QrCode,
  TrendingDown,
  Calculator,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Check,
  Share2,
  RefreshCw,
  Receipt,
  AlertCircle
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  'Flete / Transporte',
  'Carguío / Almacén',
  'Combustible',
  'Alimentación / Refrigerio',
  'Material / Embalaje',
  'Servicios / Varios'
];

function getLocalTodayIso() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
}

function shiftDateIso(dateStr, deltaDays) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + deltaDays);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export default function CashClosingModal({ isOpen, onClose, currentUser, onDataChanged }) {
  const [selectedDate, setSelectedDate] = useState(getLocalTodayIso);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'payments'
  const [copied, setCopied] = useState(false);

  // New expense form
  const [expCategory, setExpCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [isSavingExp, setIsSavingExp] = useState(false);

  const formatBs = (val) =>
    Number(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fetchClosing = useCallback(async (dateToLoad) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/cash-closing?date=${encodeURIComponent(dateToLoad)}`).then(r => r.json());
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setErrorMsg(res.error || 'No se pudo cargar el cierre de caja');
      }
    } catch (err) {
      setErrorMsg('Error de conexión: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchClosing(selectedDate);
    }
  }, [isOpen, selectedDate, fetchClosing]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const amt = parseFloat(expAmount);
    if (!expDescription.trim()) {
      setErrorMsg('Ingresa una descripción para el gasto.');
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setErrorMsg('Ingresa un monto válido mayor a 0.');
      return;
    }

    setIsSavingExp(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: expCategory,
          description: expDescription.trim(),
          amount: amt,
          date: selectedDate
        })
      }).then(r => r.json());

      if (!res.success) {
        setErrorMsg(res.error || 'No se pudo registrar el gasto');
      } else {
        setExpDescription('');
        setExpAmount('');
        await fetchClosing(selectedDate);
        onDataChanged && onDataChanged();
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSavingExp(false);
    }
  };

  const handleDeleteExpense = async (expense) => {
    if (!window.confirm(`¿Eliminar el gasto "${expense.description}" de Bs ${formatBs(expense.amount)}?`)) return;
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        await fetchClosing(selectedDate);
        onDataChanged && onDataChanged();
      } else {
        setErrorMsg(res.error || 'No se pudo eliminar el gasto');
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const buildWhatsappReport = () => {
    const s = data?.summary || {};
    const exps = data?.expenses || [];
    const lines = [
      `*CIERRE DE CAJA DIARIO - SISCONTROL*`,
      `Fecha: ${selectedDate}`,
      `Responsable: ${currentUser?.name || 'USUARIO'}`,
      `--------------------------------`,
      `Cobrado Efectivo: Bs ${formatBs(s.total_cash)}`,
      `Cobrado QR Total: Bs ${formatBs(s.total_qr)}`,
      `   - Cuenta Jaime: Bs ${formatBs(s.qr_jaime)}`,
      `   - Cuenta Betho: Bs ${formatBs(s.qr_betho)}`,
      `Total Recaudado: Bs ${formatBs(s.total_collected)}`,
      s.total_discount > 0 ? `Rebajas/Descuentos: Bs ${formatBs(s.total_discount)}` : null,
      `--------------------------------`,
      `Gastos / Caja Chica: Bs ${formatBs(s.total_expenses)}`,
      ...exps.map(e => `   • ${e.category}: ${e.description} (Bs ${formatBs(e.amount)})`),
      `--------------------------------`,
      `*EFECTIVO NETO A ENTREGAR: Bs ${formatBs(s.net_cash_in_hand)}*`
    ].filter(Boolean);
    return lines.join('\n');
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(buildWhatsappReport());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setErrorMsg('No se pudo copiar al portapapeles');
    }
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(buildWhatsappReport());
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  const summary = data?.summary || {
    total_cash: 0,
    total_qr: 0,
    qr_jaime: 0,
    qr_betho: 0,
    total_discount: 0,
    total_collected: 0,
    total_expenses: 0,
    net_cash_in_hand: 0,
    payments_count: 0,
    expenses_count: 0
  };
  const payments = data?.payments || [];
  const expenses = data?.expenses || [];

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[94dvh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/25">
              <Wallet size={19} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white m-0 truncate">
                Cierre de Caja Diario & Gastos
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 m-0 truncate">
                Efectivo, QR (Jaime / Betho), caja chica y cuadre neto del día
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Date Selector Bar */}
        <div className="px-4 py-2.5 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedDate(prev => shiftDateIso(prev, -1))}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Día anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="relative flex items-center">
              <Calendar size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="form-input h-9 pl-8 pr-2.5 text-xs font-bold rounded-xl w-38"
              />
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(prev => shiftDateIso(prev, 1))}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Día siguiente"
            >
              <ChevronRight size={16} />
            </button>
            {selectedDate !== getLocalTodayIso() && (
              <button
                type="button"
                onClick={() => setSelectedDate(getLocalTodayIso())}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-[11px] font-extrabold cursor-pointer"
              >
                Hoy
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => fetchClosing(selectedDate)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Efectivo */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-500/30">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                <span className="flex items-center gap-1.5"><Banknote size={15} /> Cobrado en Efectivo</span>
                <span className="text-[11px] opacity-80">{summary.payments_count} cobro(s)</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                Bs {formatBs(summary.total_cash)}
              </div>
            </div>

            {/* 2. QR Breakdown */}
            <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/25 border border-cyan-200/80 dark:border-cyan-500/30">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-700 dark:text-cyan-300 mb-1">
                <span className="flex items-center gap-1.5"><QrCode size={15} /> Cobrado por QR</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-cyan-700 dark:text-cyan-300">
                Bs {formatBs(summary.total_qr)}
              </div>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[11px] font-bold">
                <span className="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-cyan-200/60 dark:border-slate-700">
                  Jaime: Bs {formatBs(summary.qr_jaime)}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-cyan-200/60 dark:border-slate-700">
                  Betho: Bs {formatBs(summary.qr_betho)}
                </span>
              </div>
            </div>

            {/* 3. Gastos del Día */}
            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200/80 dark:border-rose-500/30">
              <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300 mb-1">
                <span className="flex items-center gap-1.5"><TrendingDown size={15} /> Gastos / Caja Chica</span>
                <span className="text-[11px] opacity-80">{summary.expenses_count} gasto(s)</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                - Bs {formatBs(summary.total_expenses)}
              </div>
            </div>

            {/* 4. Efectivo Neto a Entregar */}
            <div className="p-3.5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white border border-slate-800 dark:border-slate-700 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
                <span className="flex items-center gap-1.5"><Calculator size={15} /> Efectivo Neto a Entregar</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white">
                Bs {formatBs(summary.net_cash_in_hand)}
              </div>
              <div className="mt-1 text-[11px] text-slate-300 flex items-center justify-between gap-2 flex-wrap">
                <span>Total Recaudado (Efec + QR): <strong className="font-mono text-emerald-400">Bs {formatBs(summary.total_collected)}</strong></span>
                {summary.total_discount > 0 && (
                  <span className="text-amber-300">Rebajas: Bs {formatBs(summary.total_discount)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Sub-Tabs */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                activeTab === 'expenses'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <TrendingDown size={14} />
              <span>Gastos / Caja Chica ({expenses.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                activeTab === 'payments'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Receipt size={14} />
              <span>Cobros del Día ({payments.length})</span>
            </button>
          </div>

          {/* TAB 1: EXPENSES */}
          {activeTab === 'expenses' && (
            <div className="space-y-3.5">
              {/* Quick Add Expense Form */}
              <form
                onSubmit={handleAddExpense}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3"
              >
                <div className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                  Registrar Gasto del Día ({selectedDate})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-4">
                    <select
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value)}
                      className="form-select text-xs font-bold h-10 w-full"
                    >
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      value={expDescription}
                      onChange={(e) => setExpDescription(e.target.value)}
                      placeholder="Ej. Flete camión / Pasajes / Almuerzo"
                      className="form-input text-xs h-10 w-full"
                      required
                    />
                  </div>
                  <div className="sm:col-span-3 flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      placeholder="Monto Bs"
                      className="form-input text-xs font-mono font-bold h-10 w-full"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSavingExp}
                      className="px-3.5 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                      title="Agregar gasto"
                    >
                      <Plus size={15} />
                      <span className="sm:hidden">Guardar</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Expenses List */}
              {expenses.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                  No hay gastos registrados en esta fecha.
                </div>
              ) : (
                <div className="space-y-2">
                  {expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold uppercase">
                            {exp.category}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {exp.description}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Registrado por: <strong className="text-slate-600 dark:text-slate-300">{exp.registered_by || 'Sistema'}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-mono font-black text-sm text-rose-600 dark:text-rose-400">
                          - Bs {formatBs(exp.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/15 cursor-pointer"
                          title="Eliminar gasto"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DAILY PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-2">
              {payments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                  No se registraron cobros en notas durante {selectedDate}.
                </div>
              ) : (
                payments.map((p) => {
                  let cashVal = Number(p.amount_cash || 0);
                  let qrVal = Number(p.amount_qr || 0);
                  if (cashVal === 0 && qrVal === 0 && Number(p.amount || 0) > 0) {
                    if (String(p.payment_method || '').toUpperCase().includes('QR') || String(p.payment_method || '').toUpperCase().includes('TRANSFER')) {
                      qrVal = Number(p.amount);
                    } else {
                      cashVal = Number(p.amount);
                    }
                  }
                  const discVal = Number(p.amount_discount || 0);

                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200/70 dark:border-cyan-500/30">
                            {p.note_code}
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                            {p.customer_name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Cobrado por: <strong className="text-slate-700 dark:text-slate-200">{p.registered_by || 'Encargado'}</strong>
                          {p.notes ? ` • ${p.notes}` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        {cashVal > 0 && (
                          <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono font-black text-xs">
                            Efec: Bs {formatBs(cashVal)}
                          </span>
                        )}
                        {qrVal > 0 && (
                          <span className="px-2 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-mono font-black text-xs">
                            QR {String(p.qr_account || '').toUpperCase().includes('BETHO') ? 'Betho' : 'Jaime'}: Bs {formatBs(qrVal)}
                          </span>
                        )}
                        {discVal > 0 && (
                          <span className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs">
                            Rebaja: Bs {formatBs(discVal)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer Actions: Copy & WhatsApp */}
        <div className="px-4 py-3 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyReport}
            className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-extrabold inline-flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
            <span>{copied ? 'Resumen Copiado' : 'Copiar Resumen'}</span>
          </button>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black inline-flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 cursor-pointer"
          >
            <Share2 size={15} />
            <span>Enviar Cierre por WhatsApp</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

