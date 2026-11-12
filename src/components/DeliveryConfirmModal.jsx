import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckCircle2, 
  X, 
  DollarSign, 
  Calendar, 
  Truck, 
  AlertCircle,
  UserCheck,
  Banknote,
  FileText,
  QrCode,
  Tag
} from 'lucide-react';

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
    // ignore storage parse error
  }
  return 'ENCARGADO EN TURNO';
}

export default function DeliveryConfirmModal({
  isOpen,
  onClose,
  row,
  onDeliverySuccess
}) {
  const [paymentType, setPaymentType] = useState('PAGO'); // 'PAGO' | 'CREDITO'
  const [amountCash, setAmountCash] = useState('');
  const [amountQr, setAmountQr] = useState('');
  const [amountDiscount, setAmountDiscount] = useState('');
  const [qrAccount, setQrAccount] = useState('CUENTA JAIME');
  const [accountInfo, setAccountInfo] = useState('');
  const [registeredBy, setRegisteredBy] = useState(() => getActiveSessionUserName());
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('Entregado conforme en tienda');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const noteTotal = Number(row?.note_total ?? 0);
  const notePaid = Number(row?.note_paid ?? 0);
  const noteBalance = Number(row?.note_balance ?? (noteTotal - notePaid));
  const isAlreadyZero = noteBalance <= 0;

  useEffect(() => {
    if (isOpen && row) {
      const sessionUser = getActiveSessionUserName();
      setRegisteredBy(sessionUser);
      setPaymentType('PAGO');
      setAmountCash('');
      setAmountQr('');
      setAmountDiscount('');
      setQrAccount('CUENTA JAIME');
      setAccountInfo('');
      setNotes('Entregado conforme en tienda');
      setErrorMsg('');

      // Default due date to 15 days ahead for credit or partial balance
      const d = new Date();
      d.setDate(d.getDate() + 15);
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [isOpen, row, noteBalance]);

  if (!isOpen || !row) return null;

  const formatBs = (v) => Number(v || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const cleanCustomerName = (row.activity_or_customer || '').replace(/\s*\([A-Za-z0-9_-]+\)\s*$/, '') || 'Cliente';

  const cashVal = parseFloat(amountCash) || 0;
  const qrVal = parseFloat(amountQr) || 0;
  const discountVal = parseFloat(amountDiscount) || 0;
  const totalPaidAndDiscount = cashVal + qrVal + discountVal;
  const remainingAfterPayment = Math.max(0, noteBalance - totalPaidAndDiscount);
  const leavesPendingBalance = !isAlreadyZero && (paymentType === 'CREDITO' || (paymentType === 'PAGO' && remainingAfterPayment > 0.01));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isAlreadyZero && paymentType === 'PAGO') {
      if (totalPaidAndDiscount <= 0) {
        setErrorMsg('Ingresa un monto en Efectivo, QR o Rebaja mayor a Bs 0.00 (o selecciona "A CRÉDITO").');
        return;
      }
      if (totalPaidAndDiscount > noteBalance + 0.01) {
        setErrorMsg(`La suma de Pago + Rebaja (Bs ${formatBs(totalPaidAndDiscount)}) no puede superar el saldo pendiente (Bs ${formatBs(noteBalance)}).`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        payment_type: isAlreadyZero ? 'COMPLETO' : (paymentType === 'CREDITO' ? 'CREDITO' : 'PAGO'),
        amount_paid: paymentType === 'PAGO' ? totalPaidAndDiscount : 0,
        payment_method: 'POR EFECTIVO Y TRANSFERENCIA',
        is_mixed: true,
        amount_cash: cashVal,
        amount_qr: qrVal,
        amount_discount: discountVal,
        qr_account: qrAccount,
        account_info: accountInfo,
        registered_by: registeredBy || getActiveSessionUserName(),
        payment_date: row?.date,
        due_date: leavesPendingBalance ? dueDate : undefined,
        notes
      };

      const res = await fetch(`/api/sales-notes/${row.sales_note_id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (!res.success) {
        throw new Error(res.error || 'Error al confirmar la entrega');
      }

      onDeliverySuccess && onDeliverySuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-500/40 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-emerald-50/80 dark:bg-emerald-500/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 shrink-0">
              <Truck size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white m-0 truncate">
                Confirmar Entrega & Cobranza
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0 truncate">
                Nota: <strong className="text-cyan-600 dark:text-cyan-400">{row.sales_note_code}</strong> • Cliente: <strong className="text-slate-800 dark:text-slate-200">{cleanCustomerName}</strong>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border-none cursor-pointer shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl p-3 mb-3.5 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-bold">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Financial Summary Card */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 sm:p-3 mb-3.5 text-center">
            <div>
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">
                Total Nota
              </div>
              <div className="text-xs sm:text-base font-black text-slate-900 dark:text-white mt-0.5 font-mono">
                Bs {formatBs(noteTotal)}
              </div>
            </div>

            <div>
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">
                Abonado
              </div>
              <div className="text-xs sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                Bs {formatBs(notePaid)}
              </div>
            </div>

            <div>
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">
                Saldo
              </div>
              <div className={`text-xs sm:text-base font-black mt-0.5 font-mono ${isAlreadyZero ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                Bs {formatBs(noteBalance)}
              </div>
            </div>
          </div>

          {/* Payment Type Selection: ONLY 2 OPTIONS (PAGO vs A CRÉDITO) */}
          {!isAlreadyZero ? (
            <div className="mb-3.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-white mb-2">
                ¿Cómo liquida o paga el cliente en esta entrega?
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Registrar Pago */}
                <button
                  type="button"
                  onClick={() => setPaymentType('PAGO')}
                  className={`p-2.5 sm:p-3 rounded-xl text-center cursor-pointer transition-all border-2 flex flex-col items-center justify-center ${
                    paymentType === 'PAGO'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-black shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Banknote size={20} className={`mb-1 ${paymentType === 'PAGO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <div className="text-xs sm:text-sm font-black">
                    REGISTRAR PAGO
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Efectivo, QR o rebaja
                  </div>
                </button>

                {/* 2. A Crédito */}
                <button
                  type="button"
                  onClick={() => setPaymentType('CREDITO')}
                  className={`p-2.5 sm:p-3 rounded-xl text-center cursor-pointer transition-all border-2 flex flex-col items-center justify-center ${
                    paymentType === 'CREDITO'
                      ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-500 text-indigo-800 dark:text-indigo-300 font-black shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <FileText size={20} className={`mb-1 ${paymentType === 'CREDITO' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <div className="text-xs sm:text-sm font-black">
                    A CRÉDITO
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Todo queda a deuda
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/35 rounded-xl p-3 mb-3.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>Esta nota ya se encuentra totalmente cancelada (Saldo Bs 0.00).</span>
            </div>
          )}

          {/* Payment Registration Block: Direct Efectivo + QR/Transferencia (Mixto) */}
          {paymentType === 'PAGO' && !isAlreadyZero && (
            <div className="space-y-3 mb-3.5">
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
                      const target = Math.max(0, noteBalance - discountVal);
                      setAmountCash(target.toString());
                      setAmountQr('');
                    }}
                    className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:text-emerald-300 text-[11px] font-black border border-emerald-300 dark:border-emerald-500/40 transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                  >
                    <Banknote size={12} />
                    <span>Todo Efectivo (Bs {formatBs(Math.max(0, noteBalance - discountVal))})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = Math.max(0, noteBalance - discountVal);
                      setAmountQr(target.toString());
                      setAmountCash('');
                    }}
                    className="px-2 py-1 rounded-lg bg-cyan-100 hover:bg-cyan-200 text-cyan-800 dark:bg-cyan-500/20 dark:hover:bg-cyan-500/30 dark:text-cyan-300 text-[11px] font-black border border-cyan-300 dark:border-cyan-500/40 transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                  >
                    <QrCode size={12} />
                    <span>Todo QR (Bs {formatBs(Math.max(0, noteBalance - discountVal))})</span>
                  </button>
                  {(cashVal + qrVal) > 0 && (noteBalance - (cashVal + qrVal)) > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmountDiscount((noteBalance - (cashVal + qrVal)).toFixed(2))}
                      className="px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 dark:text-purple-300 text-[11px] font-black border border-purple-300 dark:border-purple-500/40 transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                    >
                      <Tag size={12} />
                      <span>Rebajar resto (Bs {formatBs(noteBalance - (cashVal + qrVal))})</span>
                    </button>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-cyan-200/70 dark:border-cyan-500/20">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Total Liquidado {discountVal > 0 ? `(Pago + Rebaja)` : '(Efectivo + QR)'}:
                  </span>
                  <span className="text-sm sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    Bs {formatBs(totalPaidAndDiscount)}
                  </span>
                </div>
              </div>

              {/* Saldo restante si es pago parcial */}
              {totalPaidAndDiscount > 0 && remainingAfterPayment > 0.01 && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-2.5 flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-800 dark:text-amber-300">Saldo que quedará pendiente:</span>
                  <strong className="text-rose-600 dark:text-rose-400 font-mono text-sm">Bs {formatBs(remainingAfterPayment)}</strong>
                </div>
              )}
            </div>
          )}

          {/* Cobrado / Entregado Por (Auto-completado con la sesión activa) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3.5">
            <div>
              <label className="form-label text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1 mb-1">
                <span>Cobrado / Entregado por</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">(Sesión)</span>
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black text-xs sm:text-sm h-[38px]">
                <UserCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">{registeredBy}</span>
              </div>
            </div>

            <div>
              <label className="form-label text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                N° Comprobante / Detalle
              </label>
              <input
                type="text"
                className="form-input text-xs py-2 px-3 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl w-full h-[38px]"
                placeholder="Ej. N° transacción (opcional)"
                value={accountInfo}
                onChange={e => setAccountInfo(e.target.value)}
              />
            </div>
          </div>

          {/* Due date for credit or when leaving a partial balance */}
          {leavesPendingBalance && (
            <div className="mb-3.5">
              <label className="form-label text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase block mb-1">
                Fecha Límite de Cobro para el Saldo Pendiente
              </label>
              <input
                type="date"
                className="form-input text-xs py-2 px-3 bg-slate-50 dark:bg-slate-900 border-indigo-300 dark:border-indigo-500/40 text-slate-900 dark:text-white rounded-xl w-full font-bold"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                Se registrará en la Cartera de Clientes como fecha de cobro acordada.
              </span>
            </div>
          )}

          {/* Delivery Note / Comment */}
          <div className="mb-3.5">
            <label className="form-label text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">Observación de Entrega</label>
            <input
              type="text"
              className="form-input text-xs py-2 px-3 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl w-full"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej. Entregado conforme en tienda"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary py-2.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 justify-center rounded-xl"
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-emerald py-3 sm:py-2.5 px-6 text-sm font-black shadow-lg shadow-emerald-950/20 gap-2 justify-center rounded-xl"
            >
              <Truck size={17} />
              <span>{isSubmitting ? 'Guardando...' : 'Confirmar Entrega & Cobrar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
