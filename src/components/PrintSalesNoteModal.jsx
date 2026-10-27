import React, { useState } from 'react';
import { 
  Printer, 
  Share2, 
  X, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Calendar,
  Building2,
  Sliders,
  FileText
} from 'lucide-react';

export default function PrintSalesNoteModal({ 
  isOpen, 
  onClose, 
  note 
}) {
  const [paperSize, setPaperSize] = useState('carta'); // 'carta' (Letter) or 'media-carta' (Half Letter)
  const [marginSize, setMarginSize] = useState('normal'); // 'normal', 'estrecho', 'compacto'
  const [scale, setScale] = useState(100); // 100, 90, 80

  if (!isOpen || !note) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const phone = (note.customer_phone || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('591') ? phone : `591${phone}`;

    let itemsText = (note.items || []).map((it, idx) => {
      const modeText = it.sale_mode === 'CAJA' ? `${it.boxes_count} cjs (${it.units_per_box} u/cj)` : `${it.quantity} unid`;
      const alistar = it.warehouse_source ? ` [📍 Alistar: ${it.warehouse_source}]` : '';
      return `${idx + 1}. *${it.description}* (${it.sku}): ${modeText} x Bs ${Number(it.unit_price).toFixed(2)} = Bs ${Number(it.subtotal).toFixed(2)}${alistar}`;
    }).join('\n');

    let deliveryText = note.delivery_type ? `${note.delivery_type} - ` : '';
    deliveryText += (note.delivery_destination || note.customer_address || 'Cochabamba');

    const message = `*IMPORTADORA RIVERO*
*NOTA DE VENTA: ${note.note_code}*
---------------------------------------
👤 *Cliente:* ${note.customer_name}
🚚 *Lugar de Entrega:* ${deliveryText}
${note.delivery_location_url ? `📍 *Ubicación Maps:* ${note.delivery_location_url}\n` : ''}📅 *Fecha:* ${note.date}
⏰ *Fecha Límite:* ${note.due_date || note.date}
👨‍💼 *Encargado:* ${note.seller_name || 'DANIEL'}

📦 *DETALLE DE MERCADERÍA:*
${itemsText}

---------------------------------------
💰 *TOTAL NOTA:* Bs ${Number(note.total_amount).toFixed(2)}
💵 *A CUENTA (A/C):* Bs ${Number(note.paid_amount).toFixed(2)}
⚠️ *SALDO PENDIENTE:* Bs ${Number(note.balance_amount).toFixed(2)}
📌 *ESTADO:* ${note.status}

_¡Gracias por su preferencia! Importadora Rivero - Simplificamos tu esfuerzo._`;

    const encoded = encodeURIComponent(message);
    const url = phone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Format currency
  const formatBs = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Determine scale styles
  const getContainerStyle = () => {
    let padding = '24px';
    if (marginSize === 'estrecho') padding = '14px';
    if (marginSize === 'compacto') padding = '8px';

    return {
      padding,
      transform: `scale(${scale / 100})`,
      transformOrigin: 'top center',
      width: paperSize === 'media-carta' ? '100%' : '100%',
      maxWidth: paperSize === 'media-carta' ? '820px' : '920px',
      margin: '0 auto',
      background: '#ffffff',
      color: '#0f172a',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    };
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, overflowY: 'auto', padding: '16px' }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '1050px', 
          width: '100%',
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-glass)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Controls Toolbar (Hidden when printing) */}
        <div className="no-print" style={{
          padding: '16px 24px',
          background: 'var(--bg-modal-header, rgba(10, 16, 30, 0.95))',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(99, 102, 241, 0.25))',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cyan-primary)'
            }}>
              <Printer size={20} />
            </div>
            <div>
              <h3 className="font-heading" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)', margin: 0 }}>
                Impresión & Despacho: <span style={{ color: 'var(--cyan-primary)' }}>{note.note_code}</span>
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Ajusta tamaño de hoja, márgenes y envía por WhatsApp al cliente
              </p>
            </div>
          </div>

          {/* Quick Settings */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Paper Size */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '6px' }}>Hoja:</span>
              <button 
                type="button" 
                onClick={() => setPaperSize('carta')}
                className="btn"
                style={{
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: paperSize === 'carta' ? 'var(--cyan-primary)' : 'transparent',
                  color: paperSize === 'carta' ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                Carta (A4)
              </button>
              <button 
                type="button" 
                onClick={() => setPaperSize('media-carta')}
                className="btn"
                style={{
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: paperSize === 'media-carta' ? 'var(--cyan-primary)' : 'transparent',
                  color: paperSize === 'media-carta' ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                Media Carta
              </button>
            </div>

            {/* Margins */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '6px' }}>Margen:</span>
              <select 
                value={marginSize} 
                onChange={(e) => setMarginSize(e.target.value)}
                className="form-select"
                style={{ padding: '3px 8px', fontSize: '0.75rem', width: 'auto', background: 'transparent', border: 'none', color: '#f8fafc' }}
              >
                <option value="normal" style={{ background: '#0f172a' }}>Normal</option>
                <option value="estrecho" style={{ background: '#0f172a' }}>Estrecho</option>
                <option value="compacto" style={{ background: '#0f172a' }}>Compacto</option>
              </select>
            </div>

            {/* Scale */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '6px' }}>Escala:</span>
              <select 
                value={scale} 
                onChange={(e) => setScale(Number(e.target.value))}
                className="form-select"
                style={{ padding: '3px 8px', fontSize: '0.75rem', width: 'auto', background: 'transparent', border: 'none', color: '#f8fafc' }}
              >
                <option value={100} style={{ background: '#0f172a' }}>100%</option>
                <option value={90} style={{ background: '#0f172a' }}>90%</option>
                <option value={80} style={{ background: '#0f172a' }}>80%</option>
              </select>
            </div>

            {/* Action Buttons */}
            <button 
              onClick={handleWhatsApp}
              className="btn btn-emerald"
              style={{ fontSize: '0.8rem', padding: '7px 14px', gap: '6px' }}
              title="Compartir por WhatsApp"
            >
              <Share2 size={15} />
              <span>WhatsApp</span>
            </button>

            <button 
              onClick={handlePrint}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '7px 16px', gap: '6px', fontWeight: 700 }}
            >
              <Printer size={15} />
              <span>Imprimir</span>
            </button>

            <button 
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '7px', border: 'none' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Sheet Viewport */}
        <div style={{ 
          padding: '24px', 
          background: 'rgba(0, 0, 0, 0.4)', 
          overflowY: 'auto', 
          maxHeight: 'calc(90vh - 80px)',
          display: 'flex',
          justifyContent: 'center'
        }}>
          {/* THE PHYSICAL SHEET (Exact replica of Importadora Rivero sheet) */}
          <div 
            id="printable-sale-note" 
            className="printable-document"
            style={getContainerStyle()}
          >
            {/* Header Banner */}
            <div style={{
              background: '#1e293b',
              color: '#ffffff',
              padding: '12px 18px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              border: '2px solid #0f172a'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Stylized Logo Icon */}
                <div style={{
                  width: '42px',
                  height: '42px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.6rem',
                  color: '#ffffff',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}>
                  R
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fbbf24' }}>
                    IMPORTADORA RIVERO
                  </h1>
                  <span style={{ fontSize: '0.74rem', color: '#cbd5e1', letterSpacing: '0.05em' }}>
                    simplificamos tu esfuerzo • Ventas por Mayor y Menor
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', display: 'block' }}>
                  NOTA DE DESPACHO
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'monospace' }}>
                  {note.note_code}
                </span>
              </div>
            </div>

            {/* Customer & Order Metadata Grid */}
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '12px',
              fontSize: '0.82rem',
              border: '1.5px solid #0f172a'
            }}>
              <tbody>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '6px 10px', fontWeight: 700, width: '13%', background: '#e2e8f0', color: '#0f172a' }}>
                    CLIENTE:
                  </td>
                  <td style={{ padding: '6px 10px', fontWeight: 800, fontSize: '0.92rem', width: '47%', color: '#0f172a' }}>
                    {note.customer_name}
                  </td>
                  <td style={{ padding: '6px 10px', fontWeight: 700, width: '14%', background: '#e2e8f0', color: '#0f172a' }}>
                    FECHA:
                  </td>
                  <td style={{ padding: '6px 10px', fontWeight: 800, width: '26%', color: '#0f172a' }}>
                    {note.date}
                  </td>
                </tr>
                <tr style={{ background: '#ffffff', borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '6px 10px', fontWeight: 700, background: '#e2e8f0', color: '#0f172a' }}>
                    DIRECCION:
                  </td>
                  <td style={{ padding: '6px 10px', fontWeight: 600, color: '#334155' }}>
                    {note.customer_address || 'Cochabamba'}
                  </td>
                  <td style={{ padding: '6px 10px', fontWeight: 700, background: '#e2e8f0', color: '#0f172a' }}>
                    F. LÍMITE PAGO:
                  </td>
                  <td style={{ padding: '6px 10px', fontWeight: 800, color: '#0f172a' }}>
                    {note.due_date || note.date}
                  </td>
                </tr>
                <tr style={{ background: '#f8fafc' }}>
                  <td style={{ padding: '6px 10px', fontWeight: 700, background: '#e2e8f0', color: '#0f172a' }}>
                    DESTINO / ENTREGA:
                  </td>
                  <td style={{ padding: '6px 10px', fontWeight: 700, color: '#0369a1' }}>
                    <span>{note.delivery_type ? `${note.delivery_type}: ` : ''}{note.delivery_destination || note.customer_address || 'ENTREGA EN TIENDA / ALMACÉN'}</span>
                    {note.delivery_location_url && (
                      <a href={note.delivery_location_url} target="_blank" rel="noreferrer" style={{ marginLeft: '8px', color: '#0284c7', textDecoration: 'none', fontWeight: 800, fontSize: '0.72rem' }}>
                        📍 [Ver Mapa]
                      </a>
                    )}
                  </td>
                  <td style={{ padding: '6px 10px', fontWeight: 700, background: '#e2e8f0', color: '#0f172a' }}>
                    TELÉFONO:
                  </td>
                  <td style={{ padding: '6px 10px', fontWeight: 700, color: '#0f172a' }}>
                    {note.customer_phone || '-'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Merchandise Items Table */}
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '12px',
              fontSize: '0.78rem',
              border: '1.5px solid #0f172a'
            }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'center' }}>
                  <th style={{ padding: '6px 4px', width: '6%', borderRight: '1px solid #334155' }}>CANT. CAJAS</th>
                  <th style={{ padding: '6px 4px', width: '6%', borderRight: '1px solid #334155' }}>CANT. UNI.</th>
                  <th style={{ padding: '6px 4px', width: '6%', borderRight: '1px solid #334155' }}>UN/ MED</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #334155' }}>DETALLE DEL PRODUCTO</th>
                  <th style={{ padding: '6px 6px', width: '13%', borderRight: '1px solid #334155' }}>CODIGO</th>
                  <th style={{ padding: '6px 6px', width: '10%', textAlign: 'right', borderRight: '1px solid #334155' }}>PRECIO (Bs)</th>
                  <th style={{ padding: '6px 6px', width: '12%', textAlign: 'right', borderRight: '1px solid #334155' }}>SUBTOTAL (Bs)</th>
                  <th style={{ padding: '6px 6px', width: '11%' }}>ALISTAR EN</th>
                </tr>
              </thead>
              <tbody>
                {(note.items || []).map((it, idx) => {
                  const isBox = it.sale_mode === 'CAJA';
                  const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                  return (
                    <tr key={it.id || idx} style={{ background: bg, borderBottom: '1px solid #cbd5e1' }}>
                      <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #e2e8f0' }}>
                        {isBox ? it.boxes_count : '-'}
                      </td>
                      <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 700, borderRight: '1px solid #e2e8f0' }}>
                        {isBox ? it.units_per_box : it.quantity}
                      </td>
                      <td style={{ padding: '5px 4px', textAlign: 'center', fontSize: '0.72rem', color: '#64748b', borderRight: '1px solid #e2e8f0' }}>
                        {it.unit_med || 'UNI'}
                      </td>
                      <td style={{ padding: '5px 8px', fontWeight: 600, color: '#0f172a', borderRight: '1px solid #e2e8f0' }}>
                        {it.description}
                      </td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: '#0369a1', borderRight: '1px solid #e2e8f0' }}>
                        {it.sku}
                      </td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600, borderRight: '1px solid #e2e8f0' }}>
                        {formatBs(it.unit_price)}
                      </td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 800, color: '#0f172a', borderRight: '1px solid #e2e8f0' }}>
                        {formatBs(it.subtotal)}
                      </td>
                      <td style={{ 
                        padding: '5px 4px', 
                        textAlign: 'center', 
                        fontSize: '0.68rem', 
                        fontWeight: 800, 
                        color: it.warehouse_source === 'TIENDA' ? '#92400e' : it.warehouse_source === 'CASA CUBANO' ? '#6b21a8' : '#065f46',
                        background: it.warehouse_source === 'TIENDA' ? '#fef3c7' : it.warehouse_source === 'CASA CUBANO' ? '#f3e8ff' : '#d1fae5'
                      }}>
                        {it.warehouse_source === 'TIENDA' ? '🏬 TIENDA' : it.warehouse_source === 'CASA CUBANO' ? '🏠 CUBANO' : '📦 ALMACÉN'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                {/* Total Boxes Sum Row */}
                <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f172a', fontWeight: 800 }}>
                  <td style={{ padding: '6px 4px', textAlign: 'center', fontSize: '0.9rem', color: '#0f172a', borderRight: '1px solid #cbd5e1' }}>
                    {note.total_boxes || (note.items || []).reduce((acc, c) => acc + (c.sale_mode === 'CAJA' ? Number(c.boxes_count || 0) : 0), 0)}
                  </td>
                  <td colSpan="5" style={{ padding: '6px 10px', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155' }}>
                    TOTAL CAJAS / TOTAL PEDIDO:
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', borderRight: '1px solid #cbd5e1' }}>
                    Bs {formatBs(note.total_amount)}
                  </td>
                  <td style={{ background: '#e2e8f0' }}></td>
                </tr>
              </tfoot>
            </table>

            {/* Bottom Section: Payments Breakdown + Totals + Signatures */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              gap: '12px',
              border: '1.5px solid #0f172a',
              padding: '10px 14px',
              background: '#f8fafc'
            }}>
              {/* Left Column: Payments History / A Cuenta */}
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                  REGISTRO DE ABONOS Y PAGOS A CUENTA (A/C):
                </span>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', marginBottom: '8px' }}>
                  <thead>
                    <tr style={{ background: '#e2e8f0', color: '#0f172a', textAlign: 'left' }}>
                      <th style={{ padding: '4px 6px' }}>VENDEDOR</th>
                      <th style={{ padding: '4px 6px' }}>FORMA DE PAGO</th>
                      <th style={{ padding: '4px 6px' }}>FECHA</th>
                      <th style={{ padding: '4px 6px', textAlign: 'right' }}>ABONO (A/C)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(note.payments && note.payments.length > 0) ? (
                      note.payments.map((p, idx) => (
                        <tr key={p.id || idx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                          <td style={{ padding: '4px 6px', fontWeight: 700 }}>{p.registered_by || note.seller_name || 'DANIEL'}</td>
                          <td style={{ padding: '4px 6px' }}>{p.payment_method} {p.account_info ? `(${p.account_info})` : ''}</td>
                          <td style={{ padding: '4px 6px' }}>{p.payment_date}</td>
                          <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                            Bs {formatBs(p.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ padding: '8px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                          Sin abonos iniciales registrados (Venta a crédito total).
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Observations & Destino */}
                <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '6px' }}>
                  <div><strong>RESPONSABLE:</strong> {note.seller_name || 'DANIEL'}</div>
                  {note.notes && <div><strong>OBSERVACIONES:</strong> {note.notes}</div>}
                </div>
              </div>

              {/* Right Column: Financial Liquidation Card */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #0f172a',
                padding: '10px 14px',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 700, color: '#334155' }}>TOTAL NOTA:</span>
                    <span style={{ fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>
                      Bs {formatBs(note.total_amount)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 700, color: '#059669' }}>A CUENTA (A/C):</span>
                    <span style={{ fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
                      Bs {formatBs(note.paid_amount)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '1rem', borderBottom: '2px solid #0f172a' }}>
                    <span style={{ fontWeight: 900, color: '#dc2626' }}>SALDO PENDIENTE:</span>
                    <span style={{ fontWeight: 900, color: '#dc2626', fontFamily: 'monospace' }}>
                      Bs {formatBs(note.balance_amount)}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div style={{
                  marginTop: '10px',
                  padding: '6px',
                  textAlign: 'center',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  letterSpacing: '0.08em',
                  borderRadius: '4px',
                  border: '1.5px solid',
                  background: note.status === 'PAGADO' ? '#dcfce7' : '#fef3c7',
                  color: note.status === 'PAGADO' ? '#15803d' : '#b45309',
                  borderColor: note.status === 'PAGADO' ? '#86efac' : '#fde68a'
                }}>
                  ESTADO: {note.status}
                </div>
              </div>
            </div>

            {/* Signature footer for reception */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '20px',
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px dashed #cbd5e1',
              textAlign: 'center',
              fontSize: '0.72rem',
              color: '#475569'
            }}>
              <div>
                <div style={{ borderBottom: '1px solid #64748b', marginBottom: '4px', height: '24px' }}></div>
                <span>DESPACHADO POR (ALMACÉN)</span>
              </div>
              <div>
                <div style={{ borderBottom: '1px solid #64748b', marginBottom: '4px', height: '24px' }}></div>
                <span>VENDEDOR / CAJA ({note.seller_name || 'DANIEL'})</span>
              </div>
              <div>
                <div style={{ borderBottom: '1px solid #64748b', marginBottom: '4px', height: '24px' }}></div>
                <span>CONFORME CLIENTE (FIRMA / SELLO)</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.65rem', color: '#94a3b8' }}>
              SISCONTROL IMPORTADORA RIVERO • Documento de Control Interno y Remisión • {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
