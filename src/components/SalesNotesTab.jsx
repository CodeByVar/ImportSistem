import React, { useState, useEffect, useCallback } from 'react';
import DailyOrdersSection from './DailyOrdersSection';
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  DollarSign, 
  Trash2, 
  Users,
  Edit,
  AlertCircle,
  MapPin
} from 'lucide-react';

export default function SalesNotesTab({
  onOpenNewNote,
  onOpenEditNote,
  onOpenPrintNote,
  onOpenCustomers,
  onOpenAddPayment,
  onNavigateToContainers,
  refreshTrigger
}) {
  const [notes, setNotes] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODAS');
  const [error, setError] = useState('');

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      let url = `/api/sales-notes?status=${statusFilter}&search=${encodeURIComponent(searchTerm)}`;
      const res = await fetch(url).then(r => r.json());
      if (res.success) {
        setNotes(res.data);
        setKpis(res.kpis);
      } else {
        throw new Error(res.error || 'Error al cargar notas de venta.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes, refreshTrigger]);

  const handleCancelNote = async (note) => {
    if (!window.confirm(`¿Estás seguro de anular la nota ${note.note_code}? El stock de sus productos será devuelto inmediatamente al inventario.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/sales-notes/${note.id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        fetchNotes();
      } else {
        alert('Error: ' + res.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const formatBs = (v) => Number(v || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div>
      {/* 1. ORDEN DEL DÍA / CONTROL DIARIO L-M-M-J-V-S */}
      <DailyOrdersSection 
        onOpenPrintNote={onOpenPrintNote} 
        onOpenEditNote={onOpenEditNote}
        onOpenNewNote={onOpenNewNote} 
        onOpenAddPayment={onOpenAddPayment}
        onNavigateToContainers={onNavigateToContainers}
        refreshTrigger={refreshTrigger}
      />

      {/* 2. RESUMEN FINANCIERO DE NOTAS (BAJADO ABAJO DE LA ORDEN DEL DÍA) */}
      {kpis && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Total Facturado */}
          <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '14px', borderLeft: '4px solid var(--cyan-primary)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Ventas en Notas
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--cyan-primary)', marginTop: '4px', fontFamily: 'monospace' }}>
              Bs {formatBs(kpis.total_sales)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {kpis.total_notes} notas emitidas
            </div>
          </div>

          {/* Total Cobrado / Abonos */}
          <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '14px', borderLeft: '4px solid var(--emerald-success)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Cobrado en Efectivo/QR
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--emerald-success)', marginTop: '4px', fontFamily: 'monospace' }}>
              Bs {formatBs(kpis.total_collected)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Ingresos reales en caja y cuentas
            </div>
          </div>

          {/* Saldo Pendiente por Cobrar */}
          <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '14px', borderLeft: '4px solid #fb7185' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Saldos por Cobrar (Clientes)
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fb7185', marginTop: '4px', fontFamily: 'monospace' }}>
              Bs {formatBs(kpis.total_receivable)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {kpis.pending_notes_count} notas pendientes de pago
            </div>
          </div>
        </div>
      )}

      {/* Main Panel */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        {/* Actions Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {/* Left: Search & Filter */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 300px' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Buscar por código (IR42EG), cliente, vendedor o destino..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>

            <div style={{ minWidth: '150px' }}>
              <select 
                className="form-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="TODAS">Todos los Estados</option>
                <option value="PENDIENTE">Sólo Pendientes</option>
                <option value="PAGADO">Sólo Pagadas</option>
                <option value="ANULADO">Sólo Anuladas</option>
              </select>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={onOpenCustomers}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '9px 16px', gap: '8px' }}
            >
              <Users size={16} color="var(--indigo-brand)" />
              <span>Cartera de Clientes</span>
            </button>
          </div>
        </div>

        {error && (
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
            <span>{error}</span>
          </div>
        )}

        {/* Data Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: '90px' }}>N° NOTA</th>
                <th style={{ minWidth: '100px' }}>FECHA</th>
                <th style={{ minWidth: '220px' }}>CLIENTE & DESTINO</th>
                <th style={{ minWidth: '100px' }}>VENDEDOR</th>
                <th style={{ textAlign: 'center', minWidth: '90px' }}>CAJAS / UNID</th>
                <th style={{ textAlign: 'right', minWidth: '110px' }}>TOTAL (Bs)</th>
                <th style={{ textAlign: 'right', minWidth: '100px' }}>A/C (Bs)</th>
                <th style={{ textAlign: 'right', minWidth: '110px' }}>SALDO (Bs)</th>
                <th style={{ textAlign: 'center', minWidth: '100px' }}>ESTADO</th>
                <th style={{ textAlign: 'center', minWidth: '150px' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                    Cargando notas de despacho...
                  </td>
                </tr>
              ) : notes.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📋</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>No se encontraron notas de venta</div>
                    <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Crea tu primera nota haciendo clic en "+ Nueva Nota de Venta"</div>
                  </td>
                </tr>
              ) : (
                notes.map(n => {
                  const isPaid = n.status === 'PAGADO';
                  const isCancelled = n.status === 'ANULADO';
                  const hasDebt = Number(n.balance_amount) > 0;

                  return (
                    <tr key={n.id}>
                      {/* Code */}
                      <td style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--cyan-primary)', fontSize: '0.86rem' }}>
                        {n.note_code}
                      </td>

                      {/* Date */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{n.date}</div>
                        {n.due_date && n.due_date !== n.date && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--amber-warning)', fontWeight: 600 }}>
                            Vence: {n.due_date}
                          </div>
                        )}
                      </td>

                      {/* Customer & Destination */}
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{n.customer_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                          <MapPin size={11} style={{ flexShrink: 0 }} />
                          <span>{n.delivery_type ? `${n.delivery_type} — ` : ''}{n.delivery_destination || n.customer_address || 'Cochabamba'}</span>
                          {n.delivery_location_url && (
                            <a 
                              href={n.delivery_location_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ color: 'var(--cyan-primary)', textDecoration: 'underline', marginLeft: '4px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                              title="Abrir ubicación en Google Maps"
                            >
                              📍 Maps
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Seller */}
                      <td>
                        <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>
                          {n.seller_name || 'DANIEL'}
                        </span>
                      </td>

                      {/* Units */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {n.total_boxes > 0 ? `${n.total_boxes} cj` : ''} {n.total_units} u.
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {n.items_count} productos
                        </div>
                      </td>

                      {/* Total */}
                      <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        Bs {formatBs(n.total_amount)}
                      </td>

                      {/* Paid */}
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--emerald-success)', fontFamily: 'monospace' }}>
                        Bs {formatBs(n.paid_amount)}
                      </td>

                      {/* Balance */}
                      <td style={{ textAlign: 'right', fontWeight: 900, color: hasDebt && !isCancelled ? 'var(--rose-danger)' : 'var(--text-faint)', fontFamily: 'monospace' }}>
                        Bs {formatBs(n.balance_amount)}
                      </td>

                      {/* Status */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={
                          isPaid ? 'badge badge-emerald' : 
                          isCancelled ? 'badge badge-rose' : 'badge badge-amber'
                        }>
                          {n.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {/* Edit Note */}
                          {!isCancelled && (
                            <button 
                              onClick={async () => {
                                const res = await fetch(`/api/sales-notes/${n.id}`).then(r => r.json());
                                if (res.success) {
                                  onOpenEditNote && onOpenEditNote(res.data);
                                }
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '6px 8px', color: 'var(--cyan-primary)' }}
                              title="Modificar Nota (Productos, precios, cajas)"
                            >
                              <Edit size={15} />
                            </button>
                          )}

                          {/* Print / View */}
                          <button 
                            onClick={async () => {
                              const res = await fetch(`/api/sales-notes/${n.id}`).then(r => r.json());
                              if (res.success) {
                                onOpenPrintNote && onOpenPrintNote(res.data);
                              }
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '6px 8px' }}
                            title="Imprimir / Ver Nota"
                          >
                            <Printer size={15} />
                          </button>

                          {/* Add Payment (if pending) */}
                          {hasDebt && !isCancelled && (
                            <button 
                              onClick={() => onOpenAddPayment && onOpenAddPayment(n)}
                              className="btn btn-emerald"
                              style={{ padding: '6px 8px' }}
                              title="Registrar Abono / Cobro"
                            >
                              <DollarSign size={15} />
                            </button>
                          )}

                          {/* Cancel / Anular (if not cancelled) */}
                          {!isCancelled && (
                            <button 
                              onClick={() => handleCancelNote(n)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 8px', color: '#fb7185' }}
                              title="Anular Nota y Reponer Stock"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
