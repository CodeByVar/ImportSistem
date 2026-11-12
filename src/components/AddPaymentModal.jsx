import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DollarSign, X, Check, AlertCircle, UserCheck, Banknote, QrCode, Tag } from 'lucide-react';

function getActiveSessionUserName() {
  try {
    const savedAuth = localStorage.getItem('siscontrol_auth_session');
    if (savedAuth) {
      const parsed = JSON.parse(savedAuth);
      if (parsed?.user?.name) return parsed.user.name.toUpperCase();
    }
    const savedActive = localStorage.getItem('siscontrol_active_user');
    if (savedActive) {
      const parsed = JSON.parse(savedActive);
      if (parsed?.name) return parsed.name.toUpperCase();
    }
  } catch (e) {
    // ignore
  }
  return 'ENCARGADO EN TURNO';
}

export default function AddPaymentModal({ 
  isOpen, 
  onClose, 
  note, 
  onPaymentSuccess 
}) {
  const [amountCash, setAmountCash] = useState('');
  const [amountQr, setAmountQr] = useState('');
  const [amountDiscount, setAmountDiscount] = useState('');
  const [qrAccount, setQrAccount] = useState('CUENTA JAIME');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [registeredBy, setRegisteredBy] = useState(() => getActiveSessionUserName());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && note) {
      setRegisteredBy(getActiveSessionUserName());
      setAmountCash('');
      setAmountQr('');
      setAmountDiscount('');
      setQrAccount('CUENTA JAIME');
      const localToday = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
      setPaymentDate(note.default_payment_date || localToday);
      setError('');
    }
  }, [isOpen, note]);

  if (!isOpen || !note) return null;

  const cashVal = parseFloat(amountCash) || 0;
  const qrVal = parseFloat(amountQr) || 0;
  const discountVal = parseFloat(amountDiscount) || 0;
  const totalVal = cashVal + qrVal + discountVal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (totalVal <= 0) {
      setError('Ingresa un monto en Efectivo, QR o Rebaja mayor a cero.');
      return;
    }

    if (totalVal > note.balance_amount) {
      if (!window.confirm(`El monto total con rebaja (Bs ${totalVal.toFixed(2)}) es mayor al saldo pendiente (Bs ${Number(note.balance_amount).toFixed(2)}). ¿Deseas continuar?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (cashVal > 0) {
        const resCash = await fetch(`/api/sales-notes/${note.id}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: cashVal,
            payment_method: 'POR EFECTIVO',
            account_info: qrVal > 0 ? 'Parte Efectivo (Pago Mixto)' : 'Pago en Efectivo',
            payment_date: paymentDate,
            registered_by: registeredBy
          })
        }).then(r => r.json());
        if (!resCash.success) throw new Error(resCash.error || 'Error al registrar parte efectivo');
      }

      if (qrVal > 0) {
        const resQr = await fetch(`/api/sales-notes/${note.id}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: qrVal,
            payment_method: `POR TRANSFERENCIA QR ${qrAccount}`,
            account_info: cashVal > 0 ? `Parte QR ${qrAccount} (Pago Mixto)` : `Transferencia QR ${qrAccount}`,
            payment_date: paymentDate,
            registered_by: registeredBy
          })
        }).then(r => r.json());
        if (!resQr.success) throw new Error(resQr.error || 'Error al registrar parte QR');
      }

      if (discountVal > 0) {
        const resDisc = await fetch(`/api/sales-notes/${note.id}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: discountVal,
            payment_method: 'REBAJA / DESCUENTO',
            account_info: 'Rebaja / Descuento aplicado',
            payment_date: paymentDate,
            registered_by: registeredBy
          })
        }).then(r => r.json());
        if (!resDisc.success) throw new Error(resDisc.error || 'Error al registrar la rebaja');
      }

      onPaymentSuccess && onPaymentSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(5, 10, 24, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px'
    }}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-4 py-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <DollarSign size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading text-sm sm:text-lg font-black text-slate-900 dark:text-white m-0 truncate">
                Registrar Abono a Nota {note.note_code}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0 truncate">
                Cliente: {note.customer_name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary p-1.5 border-none shrink-0">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3.5 sm:p-5 overflow-y-auto flex-1">
          {/* Current Debt Card */}
          <div style={{
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Saldo Pendiente Actual:
              </span>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--rose-danger, #fb7185)', fontFamily: 'var(--font-mono, monospace)' }}>
                Bs {Number(note.balance_amount).toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Total Nota:</span>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Bs {Number(note.total_amount).toFixed(2)}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '14px' }}>
            {/* Direct Mixed Payment Block: Efectivo + QR (CUENTA JAIME / CUENTA BETHO) */}
            <div className="bg-cyan-50/60 dark:bg-cyan-500/10 border border-dashed border-cyan-400/70 dark:border-cyan-500/40 rounded-xl p-3 flex flex-col gap-2.5">
              <div>
                <label className="form-label text-[11px] font-extrabold text-slate-700 dark:text-cyan-300 uppercase flex items-center gap-1.5 mb-1">
                  <QrCode size={13} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>¿De quién es la Cuenta QR?</span>
                </label>
                <select 
                  className="form-select text-xs sm:text-sm py-2 px-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl w-full font-extrabold"
                  value={qrAccount}
                  onChange={e => setQrAccount(e.target.value)}
                >
                  <option value="CUENTA JAIME">CUENTA JAIME</option>
                  <option value="CUENTA BETHO">CUENTA BETHO</option>
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <label className="form-label text-[10px] sm:text-[11px] font-extrabold text-slate-700 dark:text-amber-300 uppercase flex items-center gap-1 mb-1">
                    <Banknote size={12} className="text-emerald-600 dark:text-amber-400 shrink-0" />
                    <span className="truncate">Efectivo (Bs)</span>
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    inputMode="decimal"
                    className="form-input text-sm sm:text-base font-black py-2 px-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl w-full" 
                    placeholder="0.00"
                    value={amountCash}
                    onChange={e => setAmountCash(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label text-[10px] sm:text-[11px] font-extrabold text-slate-700 dark:text-cyan-300 uppercase flex items-center gap-1 mb-1">
                    <QrCode size={12} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span className="truncate">QR (Bs)</span>
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    inputMode="decimal"
                    className="form-input text-sm sm:text-base font-black py-2 px-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl w-full" 
                    placeholder="0.00"
                    value={amountQr}
                    onChange={e => setAmountQr(e.target.value)}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="form-label text-[10px] sm:text-[11px] font-extrabold text-purple-700 dark:text-purple-300 uppercase flex items-center gap-1 mb-1">
                    <Tag size={12} className="text-purple-600 dark:text-purple-400 shrink-0" />
                    <span className="truncate">Rebaja / Descuento (Bs)</span>
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    inputMode="decimal"
                    className="form-input text-sm sm:text-base font-black py-2 px-2.5 bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 rounded-xl w-full" 
                    placeholder="0.00"
                    value={amountDiscount}
                    onChange={e => setAmountDiscount(e.target.value)}
                  />
                </div>
              </div>

              {/* Botones Rápidos (Sin emoticones, solo vectores) */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-0.5">Rápido:</span>
                <button
                  type="button"
                  onClick={() => {
                    const target = Math.max(0, Number(note.balance_amount) - discountVal);
                    setAmountCash(target.toString());
                    setAmountQr('');
                  }}
                  className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:text-emerald-300 text-[11px] font-black border border-emerald-300 dark:border-emerald-500/40 transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                >
                  <Banknote size={12} />
                  <span>Todo Efectivo (Bs {Math.max(0, Number(note.balance_amount) - discountVal).toFixed(2)})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = Math.max(0, Number(note.balance_amount) - discountVal);
                    setAmountQr(target.toString());
                    setAmountCash('');
                  }}
                  className="px-2 py-1 rounded-lg bg-cyan-100 hover:bg-cyan-200 text-cyan-800 dark:bg-cyan-500/20 dark:hover:bg-cyan-500/30 dark:text-cyan-300 text-[11px] font-black border border-cyan-300 dark:border-cyan-500/40 transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                >
                  <QrCode size={12} />
                  <span>Todo QR (Bs {Math.max(0, Number(note.balance_amount) - discountVal).toFixed(2)})</span>
                </button>
                {(cashVal + qrVal) > 0 && (Number(note.balance_amount) - (cashVal + qrVal)) > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmountDiscount((Number(note.balance_amount) - (cashVal + qrVal)).toFixed(2))}
                    className="px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 dark:text-purple-300 text-[11px] font-black border border-purple-300 dark:border-purple-500/40 transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                  >
                    <Tag size={12} />
                    <span>Rebajar resto (Bs {(Number(note.balance_amount) - (cashVal + qrVal)).toFixed(2)})</span>
                  </button>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-cyan-200/70 dark:border-cyan-500/20">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Total Liquidado {discountVal > 0 ? `(Pago + Rebaja)` : '(Efectivo + QR)'}:
                </span>
                <span className="text-sm sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  Bs {totalVal.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="form-label">Fecha del Pago</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label flex items-center gap-1">
                  <span>Cobrado por</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">(Sesión)</span>
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black text-xs sm:text-sm h-[42px]">
                  <UserCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{registeredBy}</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '8px',
              padding: '10px',
              marginBottom: '14px',
              fontSize: '0.8rem',
              color: '#fb7185'
            }}>
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary py-2 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 justify-center rounded-xl" 
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-emerald py-2.5 px-5 font-black text-sm justify-center shadow-md shadow-emerald-600/20 rounded-xl" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando Abono...' : 'Confirmar Abono'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
