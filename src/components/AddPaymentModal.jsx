import React, { useState } from 'react';
import { DollarSign, X, Check, AlertCircle } from 'lucide-react';

export default function AddPaymentModal({ 
  isOpen, 
  onClose, 
  note, 
  onPaymentSuccess 
}) {
  const [amount, setAmount] = useState('');
  const [amountCash, setAmountCash] = useState('');
  const [amountQr, setAmountQr] = useState('');
  const [qrAccount, setQrAccount] = useState('CUENTA JAIME');
  const [paymentMethod, setPaymentMethod] = useState('POR EFECTIVO');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [registeredBy, setRegisteredBy] = useState('DANIEL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !note) return null;

  const isMixed = paymentMethod === 'POR EFECTIVO Y TRANSFERENCIA';
  const cashVal = parseFloat(amountCash) || 0;
  const qrVal = parseFloat(amountQr) || 0;
  const totalVal = isMixed ? (cashVal + qrVal) : (parseFloat(amount) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (totalVal <= 0) {
      setError('El monto del abono debe ser mayor a cero.');
      return;
    }

    if (totalVal > note.balance_amount) {
      if (!window.confirm(`El monto ingresado (Bs ${totalVal.toFixed(2)}) es mayor al saldo pendiente (Bs ${Number(note.balance_amount).toFixed(2)}). ¿Deseas continuar?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isMixed) {
        if (cashVal > 0) {
          const resCash = await fetch(`/api/sales-notes/${note.id}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: cashVal,
              payment_method: 'POR EFECTIVO',
              account_info: `Parte Efectivo (Pago Mixto)`,
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
              account_info: `Parte QR ${qrAccount} (Pago Mixto)`,
              payment_date: paymentDate,
              registered_by: registeredBy
            })
          }).then(r => r.json());
          if (!resQr.success) throw new Error(resQr.error || 'Error al registrar parte QR');
        }
      } else {
        const res = await fetch(`/api/sales-notes/${note.id}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalVal,
            payment_method: paymentMethod,
            account_info: '',
            payment_date: paymentDate,
            registered_by: registeredBy
          })
        }).then(r => r.json());

        if (!res.success) {
          throw new Error(res.error || 'Error al registrar abono.');
        }
      }

      onPaymentSuccess && onPaymentSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1150 }}>
      <div className="modal-content" style={{ maxWidth: '490px' }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--emerald-success)'
            }}>
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="font-heading" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Registrar Abono a Nota {note.note_code}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Cliente: {note.customer_name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px', border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '22px' }}>
          {/* Current Debt Card */}
          <div style={{
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Saldo Pendiente Actual:
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--rose-danger, #fb7185)', fontFamily: 'var(--font-mono, monospace)' }}>
                Bs {Number(note.balance_amount).toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Nota:</span>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Bs {Number(note.total_amount).toFixed(2)}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', marginBottom: '16px' }}>
            {/* Modalidad de Pago */}
            <div>
              <label className="form-label">Modalidad de Pago</label>
              <select 
                className="form-select"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                style={{ fontWeight: 700, color: isMixed ? 'var(--cyan-primary)' : 'inherit' }}
              >
                <option value="POR EFECTIVO">💵 POR EFECTIVO</option>
                <option value="POR TRANSFERENCIA QR CUENTA JAIME">📱 POR TR. QR CUENTA JAIME</option>
                <option value="POR DEPOSITO BANCARIO CUENTA JAIME">🏦 POR DEP. BANCARIO CUENTA JAIME</option>
                <option value="POR TRANSFERENCIA QR CUENTA CELSO">📱 POR TR. QR CUENTA CELSO</option>
                <option value="POR DEPOSITO BANCARIO CUENTA CELSO">🏦 POR DEP. BANCARIO CUENTA CELSO</option>
                <option value="POR TRANSFERENCIA QR CUENTA BETO">📱 POR TR. QR CUENTA BETO</option>
                <option value="POR DEPOSITO BANCARIO CUENTA BETO">🏦 POR DEP. BANCARIO CUENTA BETO</option>
                <option value="POR EFECTIVO Y TRANSFERENCIA">⚡ POR EFECTIVO Y TRANSFERENCIA (MIXTO)</option>
              </select>
            </div>

            {/* Si es MIXTO: Cuenta QR y dos campos */}
            {isMixed ? (
              <div style={{
                background: 'rgba(6, 182, 212, 0.06)',
                border: '1px dashed rgba(6, 182, 212, 0.35)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div>
                  <label className="form-label" style={{ color: 'var(--cyan-primary)', fontWeight: 700 }}>
                    📱 ¿De quién es la Cuenta QR?
                  </label>
                  <select 
                    className="form-select"
                    value={qrAccount}
                    onChange={e => setQrAccount(e.target.value)}
                    style={{ fontWeight: 700 }}
                  >
                    <option value="CUENTA JAIME">CUENTA JAIME</option>
                    <option value="CUENTA BETO">CUENTA BETO / BETHO</option>
                    <option value="CUENTA CELSO">CUENTA CELSO</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label" style={{ color: 'var(--amber-warning, #f59e0b)', fontSize: '0.78rem' }}>
                      💵 Monto Efectivo (Bs)
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      className="form-input" 
                      placeholder="0.00"
                      value={amountCash}
                      onChange={e => setAmountCash(e.target.value)}
                      style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--amber-warning, #f59e0b)' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ color: 'var(--cyan-primary)', fontSize: '0.78rem' }}>
                      📱 Monto QR ({qrAccount}) (Bs)
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      className="form-input" 
                      placeholder="0.00"
                      value={amountQr}
                      onChange={e => setAmountQr(e.target.value)}
                      style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--cyan-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid rgba(6, 182, 212, 0.2)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Abono Mixto:</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--emerald-success)', fontFamily: 'var(--font-mono, monospace)' }}>
                    Bs {totalVal.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <label className="form-label">Monto del Abono (Bs) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  className="form-input" 
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--emerald-success)' }}
                  required 
                  autoFocus
                />
              </div>
            )}

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
                <label className="form-label">Cobrado por / A quién pagó</label>
                <select 
                  className="form-select"
                  value={registeredBy}
                  onChange={e => setRegisteredBy(e.target.value)}
                  style={{ fontWeight: 600 }}
                >
                  <option value="DANIEL">DANIEL</option>
                  <option value="JAIME">JAIME</option>
                  <option value="TITO">TITO</option>
                  <option value="ENTREGA">ENTREGA</option>
                  <option value="MOSTRADOR TIENDA">MOSTRADOR TIENDA</option>
                </select>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-emerald" disabled={isSubmitting} style={{ padding: '9px 20px', fontWeight: 700 }}>
              {isSubmitting ? 'Guardando Abono...' : 'Confirmar Abono'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
