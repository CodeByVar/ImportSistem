import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  FileText, 
  DollarSign, 
  Phone, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  X,
  CreditCard,
  Printer
} from 'lucide-react';

export default function CustomersModal({ 
  isOpen, 
  onClose, 
  onSelectCustomerForNewNote,
  onOpenPrintNote 
}) {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerStatement, setCustomerStatement] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // New customer form toggle
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustLocationUrl, setNewCustLocationUrl] = useState('');

  const fetchCustomers = () => {
    setIsLoading(true);
    fetch(`/api/customers?search=${encodeURIComponent(searchTerm)}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setCustomers(res.data);
          if (res.data.length > 0 && !selectedCustomerId) {
            setSelectedCustomerId(res.data[0].id);
          }
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen, searchTerm]);

  // Fetch statement when customer is selected
  useEffect(() => {
    if (selectedCustomerId) {
      fetch(`/api/customers/${selectedCustomerId}/statement`)
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            setCustomerStatement(res.data);
          }
        });
    }
  }, [selectedCustomerId]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustName.trim(),
          phone: newCustPhone.trim(),
          address: newCustAddress.trim(),
          store_location_url: newCustLocationUrl.trim(),
          city: 'Cochabamba'
        })
      }).then(r => r.json());

      if (res.success) {
        setIsAddingCustomer(false);
        setNewCustName('');
        setNewCustPhone('');
        setNewCustAddress('');
        setNewCustLocationUrl('');
        fetchCustomers();
        setSelectedCustomerId(res.data.id);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (!isOpen) return null;

  const formatBs = (v) => Number(v || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="modal-overlay" style={{ zIndex: 1060 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '1200px', 
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-modal-header, rgba(10, 16, 30, 0.95))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Users size={22} />
            </div>
            <div>
              <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)', margin: 0 }}>
                Cartera de Clientes & Resumen de Notas
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Equivalente al Libro Resumen: Historial de compras, pedidos y deudas por cobrar
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px', border: 'none' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content Body: Left Master List, Right Customer Detail */}
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', flex: 1, overflow: 'hidden' }}>
          {/* Left Column: Customer Directory */}
          <div style={{
            borderRight: '1px solid var(--border-glass)',
            background: 'rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Search and Add Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Buscar cliente, teléfono..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '34px', fontSize: '0.8rem' }}
                />
              </div>

              <button 
                onClick={() => setIsAddingCustomer(!isAddingCustomer)}
                className="btn btn-indigo"
                style={{ width: '100%', fontSize: '0.78rem', padding: '7px', justifyContent: 'center' }}
              >
                <Plus size={15} />
                <span>{isAddingCustomer ? 'Cancelar Registro' : '+ Nuevo Cliente'}</span>
              </button>

              {/* Inline Form to add Customer */}
              {isAddingCustomer && (
                <form onSubmit={handleCreateCustomer} style={{ marginTop: '12px', background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Nombre completo *"
                    value={newCustName}
                    onChange={e => setNewCustName(e.target.value)}
                    style={{ fontSize: '0.78rem', marginBottom: '8px' }}
                    required
                  />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Teléfono / Celular"
                    value={newCustPhone}
                    onChange={e => setNewCustPhone(e.target.value)}
                    style={{ fontSize: '0.78rem', marginBottom: '8px' }}
                  />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Dirección / Mercado"
                    value={newCustAddress}
                    onChange={e => setNewCustAddress(e.target.value)}
                    style={{ fontSize: '0.78rem', marginBottom: '8px' }}
                  />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="📍 Link Ubicación Google Maps (Opcional)"
                    value={newCustLocationUrl}
                    onChange={e => setNewCustLocationUrl(e.target.value)}
                    style={{ fontSize: '0.78rem', marginBottom: '8px' }}
                  />
                  <button type="submit" className="btn btn-emerald" style={{ width: '100%', fontSize: '0.75rem', padding: '6px' }}>
                    Guardar Cliente
                  </button>
                </form>
              )}
            </div>

            {/* Customers Scrollable List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {customers.map(c => {
                const isSelected = c.id === selectedCustomerId;
                const hasDebt = Number(c.total_debt) > 0;
                return (
                  <div 
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.4)',
                      border: `1px solid ${isSelected ? 'var(--indigo-brand)' : 'var(--border-subtle)'}`,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#f8fafc' }}>
                        {c.name}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--cyan-primary)' }}>
                        {c.code}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={12} color={c.store_location_url ? 'var(--cyan-primary)' : 'var(--text-muted)'} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.address || 'Cochabamba'}
                      </span>
                      {c.store_location_url && (
                        <span style={{ color: 'var(--cyan-primary)', fontSize: '0.68rem', fontWeight: 600 }}>[GPS]</span>
                      )}
                    </div>

                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {c.total_notes || 0} notas
                      </span>
                      {hasDebt ? (
                        <span style={{ color: '#fb7185', fontWeight: 800 }}>
                          Debe: Bs {formatBs(c.total_debt)}
                        </span>
                      ) : (
                        <span style={{ color: '#34d399', fontWeight: 600 }}>
                          Al día
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Statement & Past Notes for Selected Customer (Like RESUMEN 2026) */}
          <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {customerStatement ? (
              <>
                {/* Customer Profile Banner */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '14px',
                  padding: '20px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                        {customerStatement.customer.name}
                      </h2>
                      <span className="badge badge-cyan" style={{ fontSize: '0.74rem' }}>
                        {customerStatement.customer.code}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                      <span>📍 {customerStatement.customer.address || 'Mercado La Pampa'}</span>
                      <span>📞 {customerStatement.customer.phone || 'Sin teléfono'}</span>
                      {customerStatement.customer.store_location_url && (
                        <a 
                          href={customerStatement.customer.store_location_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ 
                            fontSize: '0.72rem', 
                            padding: '3px 8px', 
                            color: 'var(--cyan-primary)', 
                            border: '1px solid rgba(6, 182, 212, 0.4)', 
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <MapPin size={12} />
                          <span>Ver Ubicación en Maps</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      onSelectCustomerForNewNote && onSelectCustomerForNewNote(customerStatement.customer);
                      onClose();
                    }}
                    className="btn btn-primary"
                    style={{ fontSize: '0.85rem', padding: '9px 18px', gap: '8px' }}
                  >
                    <Plus size={16} />
                    <span>+ Nueva Nota para este Cliente</span>
                  </button>
                </div>

                {/* 3 KPIs (Equivalent to C5 = SUM(C6:C7) from RESUMEN 2026) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
                  <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '14px 18px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL COMPRAS ACUMULADAS</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cyan-primary)', marginTop: '4px', fontFamily: 'monospace' }}>
                      Bs {formatBs(customerStatement.summary?.total_invoiced)}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '14px 18px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL ABONADO / PAGADO</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--emerald-success)', marginTop: '4px', fontFamily: 'monospace' }}>
                      Bs {formatBs(customerStatement.summary?.total_paid)}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', padding: '14px 18px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>SALDO PENDIENTE DE COBRO</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fb7185', marginTop: '4px', fontFamily: 'monospace' }}>
                      Bs {formatBs(customerStatement.summary?.total_balance_due)}
                    </div>
                  </div>
                </div>

                {/* History Table (Like the Hoja 1, Hoja 2... Hoja 42 entries) */}
                <h4 className="font-heading" style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
                  Historial de Notas de Despacho del Cliente
                </h4>

                <div className="data-table-container" style={{ flex: 1 }}>
                  <table className="data-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>N° Nota</th>
                        <th>Fecha</th>
                        <th>Destino</th>
                        <th style={{ textAlign: 'right' }}>Total (Bs)</th>
                        <th style={{ textAlign: 'right' }}>A Cuenta (Bs)</th>
                        <th style={{ textAlign: 'right' }}>Saldo (Bs)</th>
                        <th style={{ textAlign: 'center' }}>Estado</th>
                        <th style={{ textAlign: 'center' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerStatement.notes && customerStatement.notes.length > 0 ? (
                        customerStatement.notes.map(n => (
                          <tr key={n.id}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--cyan-primary)' }}>
                              {n.note_code}
                            </td>
                            <td>{n.date}</td>
                            <td>{n.delivery_destination || '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>
                              Bs {formatBs(n.total_amount)}
                            </td>
                            <td style={{ textAlign: 'right', color: '#34d399', fontWeight: 600 }}>
                              Bs {formatBs(n.paid_amount)}
                            </td>
                            <td style={{ textAlign: 'right', color: Number(n.balance_amount) > 0 ? '#fb7185' : '#94a3b8', fontWeight: 800 }}>
                              Bs {formatBs(n.balance_amount)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={n.status === 'PAGADO' ? 'badge badge-emerald' : n.status === 'ANULADO' ? 'badge badge-rose' : 'badge badge-amber'}>
                                {n.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button 
                                onClick={async () => {
                                  const res = await fetch(`/api/sales-notes/${n.id}`).then(r => r.json());
                                  if (res.success) {
                                    onOpenPrintNote && onOpenPrintNote(res.data);
                                  }
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                title="Ver / Imprimir Nota"
                              >
                                <Printer size={13} />
                                <span>Ver</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '35px', color: 'var(--text-muted)' }}>
                            Este cliente no tiene notas de venta registradas todavía.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                Selecciona un cliente de la lista para ver su consolidado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
