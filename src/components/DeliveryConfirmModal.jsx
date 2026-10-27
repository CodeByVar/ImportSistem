import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  X, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  Truck, 
  AlertCircle,
  FileText
} from 'lucide-react';

export default function DeliveryConfirmModal({
  isOpen,
  onClose,
  row,
  onDeliverySuccess
}) {
  const [paymentType, setPaymentType] = useState('COMPLETO'); // 'COMPLETO', 'PARCIAL', 'CREDITO'
  const [partialAmount, setPartialAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [accountInfo, setAccountInfo] = useState('');
  const [registeredBy, setRegisteredBy] = useState('ENTREGA');
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
      if (isAlreadyZero) {
        setPaymentType('COMPLETO');
      } else {
        setPaymentType('COMPLETO');
      }
      setPartialAmount('');
      setPaymentMethod('Efectivo');
      setAccountInfo('');
      setNotes('Entregado conforme en tienda');
      setErrorMsg('');

      // Default due date to 15 days ahead for credit or partial
      const d = new Date();
      d.setDate(d.getDate() + 15);
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [isOpen, row, isAlreadyZero]);

  if (!isOpen || !row) return null;

  const formatBs = (v) => Number(v || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const cleanCustomerName = (row.activity_or_customer || '').replace(/\s*\([A-Za-z0-9_-]+\)\s*$/, '') || 'Cliente';

  const calculatedPartial = parseFloat(partialAmount) || 0;
  const remainingAfterPartial = Math.max(0, noteBalance - calculatedPartial);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (paymentType === 'PARCIAL') {
      if (calculatedPartial <= 0) {
        setErrorMsg('El monto del abono parcial debe ser mayor a 0.');
        return;
      }
      if (calculatedPartial > noteBalance) {
        setErrorMsg(`El abono parcial no puede ser mayor al saldo pendiente (Bs ${formatBs(noteBalance)}).`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        payment_type: isAlreadyZero ? 'COMPLETO' : paymentType,
        amount_paid: paymentType === 'PARCIAL' ? calculatedPartial : (paymentType === 'COMPLETO' ? noteBalance : 0),
        payment_method: paymentMethod,
        account_info: accountInfo,
        registered_by: registeredBy,
        due_date: (paymentType === 'CREDITO' || paymentType === 'PARCIAL') ? dueDate : undefined,
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

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1100,
      background: 'rgba(5, 10, 24, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-dark-surface, #0f172a)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 30px rgba(16, 185, 129, 0.2)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(16, 185, 129, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)'
            }}>
              <Truck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Confirmar Entrega & Cobranza
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Nota: <strong style={{ color: '#38bdf8' }}>{row.sales_note_code}</strong> • Cliente: <strong>{cleanCustomerName}</strong>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px', border: 'none' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {errorMsg && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '18px',
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

          {/* Financial Summary Card */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid var(--border-glass)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Nota
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px', fontFamily: 'monospace' }}>
                Bs {formatBs(noteTotal)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Abonado
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', marginTop: '2px', fontFamily: 'monospace' }}>
                Bs {formatBs(notePaid)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Saldo Pendiente
              </div>
              <div style={{
                fontSize: '1.15rem',
                fontWeight: 900,
                color: isAlreadyZero ? '#34d399' : '#fbbf24',
                marginTop: '2px',
                fontFamily: 'monospace'
              }}>
                Bs {formatBs(noteBalance)}
              </div>
            </div>
          </div>

          {/* Payment Type Selection (if has balance) */}
          {!isAlreadyZero ? (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                ¿Cómo liquida o paga el cliente en esta entrega?
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {/* 1. Completo */}
                <button
                  type="button"
                  onClick={() => setPaymentType('COMPLETO')}
                  style={{
                    background: paymentType === 'COMPLETO' ? 'rgba(16, 185, 129, 0.22)' : 'rgba(0, 0, 0, 0.25)',
                    border: `1.5px solid ${paymentType === 'COMPLETO' ? '#10b981' : 'var(--border-glass)'}`,
                    borderRadius: '12px',
                    padding: '12px 10px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>💵</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: paymentType === 'COMPLETO' ? '#34d399' : '#f8fafc' }}>
                    PAGÓ COMPLETO
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Saldo 0 (Cancelado)
                  </div>
                </button>

                {/* 2. Parcial */}
                <button
                  type="button"
                  onClick={() => setPaymentType('PARCIAL')}
                  style={{
                    background: paymentType === 'PARCIAL' ? 'rgba(245, 158, 11, 0.22)' : 'rgba(0, 0, 0, 0.25)',
                    border: `1.5px solid ${paymentType === 'PARCIAL' ? '#f59e0b' : 'var(--border-glass)'}`,
                    borderRadius: '12px',
                    padding: '12px 10px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🪙</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: paymentType === 'PARCIAL' ? '#fbbf24' : '#f8fafc' }}>
                    ABONO PARCIAL
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Paga parte, resto deuda
                  </div>
                </button>

                {/* 3. Crédito */}
                <button
                  type="button"
                  onClick={() => setPaymentType('CREDITO')}
                  style={{
                    background: paymentType === 'CREDITO' ? 'rgba(99, 102, 241, 0.22)' : 'rgba(0, 0, 0, 0.25)',
                    border: `1.5px solid ${paymentType === 'CREDITO' ? '#818cf8' : 'var(--border-glass)'}`,
                    borderRadius: '12px',
                    padding: '12px 10px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>📝</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: paymentType === 'CREDITO' ? '#a5b4fc' : '#f8fafc' }}>
                    A CRÉDITO
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Todo a deuda acordada
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '0.84rem',
              color: '#34d399',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={18} />
              <span>Esta nota ya se encuentra totalmente cancelada (Saldo Bs 0.00).</span>
            </div>
          )}

          {/* Details for Partial Payment */}
          {paymentType === 'PARCIAL' && !isAlreadyZero && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '18px'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ color: '#fbbf24' }}>Monto que paga ahora el cliente (Bs) *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    placeholder={`Máximo Bs ${formatBs(noteBalance)}`}
                    value={partialAmount}
                    onChange={e => setPartialAmount(e.target.value)}
                    required
                    style={{ fontSize: '1.1rem', fontWeight: 800, paddingLeft: '36px' }}
                    autoFocus
                  />
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#fbbf24' }}>
                    Bs
                  </span>
                </div>
              </div>

              {calculatedPartial > 0 && (
                <div style={{ fontSize: '0.8rem', color: '#f8fafc', display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>Saldo que quedará como deuda pendiente:</span>
                  <strong style={{ color: '#fb7185', fontFamily: 'monospace' }}>Bs {formatBs(remainingAfterPartial)}</strong>
                </div>
              )}
            </div>
          )}

          {/* Payment Method (for Completo or Parcial) */}
          {(paymentType === 'COMPLETO' || paymentType === 'PARCIAL') && !isAlreadyZero && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div>
                <label className="form-label">Forma de Pago</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="Efectivo">💵 Efectivo Chofer/Tienda</option>
                  <option value="Transferencia QR Jaime">📱 QR Cuenta Jaime</option>
                  <option value="Transferencia QR Daniel">📱 QR Cuenta Daniel</option>
                  <option value="Depósito Banco">🏦 Depósito / Banco</option>
                </select>
              </div>

              <div>
                <label className="form-label">Cobrado / Recibido por</label>
                <select
                  className="form-select"
                  value={registeredBy}
                  onChange={e => setRegisteredBy(e.target.value)}
                >
                  <option value="ENTREGA">ENTREGA (Chofer)</option>
                  <option value="DANIEL">DANIEL</option>
                  <option value="TITO">TITO</option>
                  <option value="JAIME">JAIME</option>
                </select>
              </div>

              <div>
                <label className="form-label">N° Comprobante / Detalle</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. N° transacción"
                  value={accountInfo}
                  onChange={e => setAccountInfo(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Due date for credit or partial */}
          {(paymentType === 'CREDITO' || paymentType === 'PARCIAL') && !isAlreadyZero && (
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ color: '#818cf8' }}>
                Fecha Límite de Cobro para el Saldo Pendiente
              </label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Se registrará en la Cartera de Clientes como fecha de cobro acordada.
              </span>
            </div>
          )}

          {/* Delivery Note / Comment */}
          <div style={{ marginBottom: '22px' }}>
            <label className="form-label">Observación de Entrega</label>
            <input
              type="text"
              className="form-input"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej. Recibido por el encargado en tienda"
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-emerald"
              style={{
                padding: '10px 22px',
                fontSize: '0.9rem',
                fontWeight: 800,
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
                gap: '8px'
              }}
            >
              <Truck size={17} />
              <span>{isSubmitting ? 'Guardando...' : 'Confirmar Entrega & Liquidar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
