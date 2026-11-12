import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  Search, 
  Plus, 
  FileText, 
  DollarSign, 
  Phone, 
  MapPin, 
  ArrowLeft,
  X,
  Printer,
  Pencil,
  AlertCircle
} from 'lucide-react';

export default function CustomersModal({ 
  isOpen, 
  onClose, 
  onSelectCustomerForNewNote,
  onOpenEditNote,
  onOpenPrintNote,
  onOpenAddPayment,
  refreshTrigger
}) {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'DEBT'
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
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
          setCustomers(res.data || []);
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
    } else {
      setMobileShowDetail(false);
    }
  }, [isOpen, searchTerm, refreshTrigger]);

  // Fetch statement when customer is selected
  useEffect(() => {
    if (isOpen && selectedCustomerId) {
      fetch(`/api/customers/${selectedCustomerId}/statement`)
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            setCustomerStatement(res.data);
          }
        });
    }
  }, [isOpen, selectedCustomerId, refreshTrigger]);

  const filteredCustomers = useMemo(() => {
    if (filterMode === 'DEBT') {
      return customers.filter(c => Number(c.total_debt) > 0);
    }
    return customers;
  }, [customers, filterMode]);

  const handleSelectCustomer = (id) => {
    setSelectedCustomerId(id);
    setMobileShowDetail(true);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustName.trim().toUpperCase(),
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
        setMobileShowDetail(true);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

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
      console.error('Error al cargar la nota:', err);
    }
  };

  if (!isOpen) return null;

  const formatBs = (v) => Number(v || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[9998] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5 overflow-hidden"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col h-[92vh] sm:h-[88vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Users size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white m-0 truncate">
                Cartera de Clientes & Resumen de Notas
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 m-0 truncate">
                Toca un cliente para ver sus notas, registrar cobros/abonos o editar su pedido
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white flex items-center justify-center cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Responsive Master-Detail Body */}
        <div className="flex-1 flex flex-col md:grid md:grid-cols-12 overflow-hidden min-h-0">
          
          {/* LEFT COLUMN: Customer Directory (Visible on desktop always, on mobile when !mobileShowDetail) */}
          <div className={`md:col-span-4 lg:col-span-4 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex flex-col overflow-hidden min-h-0 ${
            mobileShowDetail ? 'hidden md:flex' : 'flex flex-1'
          }`}>
            {/* Search, Filter & New Customer Button */}
            <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  className="form-input text-xs font-semibold h-10 w-full" 
                  placeholder="Buscar cliente, código o teléfono..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '34px' }}
                />
              </div>

              {/* Filter Tabs: Todos vs Con Deuda */}
              <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFilterMode('ALL')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                    filterMode === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Todos ({customers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('DEBT')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                    filterMode === 'DEBT'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  Con Deuda ({customers.filter(c => Number(c.total_debt) > 0).length})
                </button>
              </div>

              <button 
                type="button"
                onClick={() => setIsAddingCustomer(!isAddingCustomer)}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus size={15} />
                <span>{isAddingCustomer ? 'Cancelar Registro' : 'Nuevo Cliente'}</span>
              </button>

              {/* Inline Form to add Customer */}
              {isAddingCustomer && (
                <form onSubmit={handleCreateCustomer} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <input 
                    type="text" 
                    className="form-input text-xs h-9" 
                    placeholder="Nombre completo *"
                    value={newCustName}
                    onChange={e => setNewCustName(e.target.value)}
                    required
                  />
                  <input 
                    type="text" 
                    className="form-input text-xs h-9" 
                    placeholder="Teléfono / Celular"
                    value={newCustPhone}
                    onChange={e => setNewCustPhone(e.target.value)}
                  />
                  <input 
                    type="text" 
                    className="form-input text-xs h-9" 
                    placeholder="Dirección / Mercado"
                    value={newCustAddress}
                    onChange={e => setNewCustAddress(e.target.value)}
                  />
                  <input 
                    type="text" 
                    className="form-input text-xs h-9" 
                    placeholder="Link Ubicación Google Maps (Opcional)"
                    value={newCustLocationUrl}
                    onChange={e => setNewCustLocationUrl(e.target.value)}
                  />
                  <button type="submit" className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer">
                    Guardar Cliente
                  </button>
                </form>
              )}
            </div>

            {/* Customers Scrollable List */}
            <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2">
              {isLoading ? (
                <div className="py-10 text-center text-xs text-slate-400 font-bold">
                  Cargando cartera de clientes...
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No se encontraron clientes con ese filtro.
                </div>
              ) : (
                filteredCustomers.map(c => {
                  const isSelected = c.id === selectedCustomerId;
                  const hasDebt = Number(c.total_debt) > 0;
                  return (
                    <div 
                      key={c.id}
                      onClick={() => handleSelectCustomer(c.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/90 dark:bg-indigo-500/20 border-indigo-500 shadow-xs'
                          : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 hover:border-indigo-400'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {c.name}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400 shrink-0">
                          {c.code}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                        <MapPin size={12} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span className="truncate">{c.address || 'Cochabamba'}</span>
                        {c.store_location_url && (
                          <span className="text-cyan-600 dark:text-cyan-400 text-[10px] font-bold shrink-0">[GPS]</span>
                        )}
                      </div>

                      <div className="mt-2 flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">
                          {c.total_notes || 0} notas
                        </span>
                        {hasDebt ? (
                          <span className="text-rose-600 dark:text-rose-400 font-black font-mono">
                            Debe: Bs {formatBs(c.total_debt)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            Al día
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Statement & Past Notes for Selected Customer */}
          <div className={`md:col-span-8 lg:col-span-8 p-3.5 sm:p-6 overflow-y-auto flex-col min-h-0 bg-white dark:bg-slate-900 ${
            mobileShowDetail ? 'flex flex-1' : 'hidden md:flex'
          }`}>
            {/* Mobile Back Button to Customer List */}
            <button
              type="button"
              onClick={() => setMobileShowDetail(false)}
              className="md:hidden mb-3 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-extrabold inline-flex items-center gap-2 self-start cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Volver a la lista de clientes</span>
            </button>

            {customerStatement ? (
              <div className="space-y-4">
                {/* Customer Profile Banner */}
                <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white m-0">
                        {customerStatement.customer.name}
                      </h2>
                      <span className="badge badge-cyan text-xs">
                        {customerStatement.customer.code}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400 items-center">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={13} className="text-cyan-600 dark:text-cyan-400" />
                        {customerStatement.customer.address || 'Mercado La Pampa'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Phone size={13} />
                        {customerStatement.customer.phone || 'Sin teléfono'}
                      </span>
                      {customerStatement.customer.store_location_url && (
                        <a 
                          href={customerStatement.customer.store_location_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs font-bold text-cyan-600 dark:text-cyan-400 underline inline-flex items-center gap-1"
                        >
                          <MapPin size={12} />
                          <span>Ver en Maps</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => {
                      onSelectCustomerForNewNote && onSelectCustomerForNewNote(customerStatement.customer);
                      onClose();
                    }}
                    className="btn btn-primary text-xs py-2.5 px-4 gap-1.5 font-extrabold shrink-0 justify-center"
                  >
                    <Plus size={15} />
                    <span>Nueva Nota</span>
                  </button>
                </div>

                {/* 3 KPIs of Customer */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
                  <div className="bg-cyan-50/70 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 p-3.5 rounded-xl">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase">Total Compras</div>
                    <div className="text-base sm:text-xl font-black text-cyan-700 dark:text-cyan-400 mt-0.5 font-mono">
                      Bs {formatBs(customerStatement.summary?.total_invoiced)}
                    </div>
                  </div>

                  <div className="bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-3.5 rounded-xl">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase">Total Abonado / Pagado</div>
                    <div className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                      Bs {formatBs(customerStatement.summary?.total_paid)}
                    </div>
                  </div>

                  <div className="bg-rose-50/70 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3.5 rounded-xl">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase">Saldo Pendiente (Deuda)</div>
                    <div className="text-base sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 font-mono">
                      Bs {formatBs(customerStatement.summary?.total_balance_due)}
                    </div>
                  </div>
                </div>

                {/* Customer Notes List (Responsive Cards with Cobrar / Editar / Ver) */}
                <div>
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2.5">
                    Notas de Venta del Cliente ({customerStatement.notes?.length || 0})
                  </h4>

                  {customerStatement.notes && customerStatement.notes.length > 0 ? (
                    <div className="space-y-2.5">
                      {customerStatement.notes.map(n => {
                        const hasDebt = Number(n.balance_amount) > 0 && n.status !== 'ANULADO';
                        return (
                          <div
                            key={n.id}
                            className={`p-3 sm:p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              hasDebt
                                ? 'bg-amber-50/40 dark:bg-slate-800/80 border-amber-300 dark:border-amber-500/40'
                                : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-black text-cyan-600 dark:text-cyan-400">
                                  {n.note_code}
                                </span>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                  Fecha: {n.date}
                                </span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  n.status === 'PAGADO'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                    : n.status === 'ANULADO'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                                }`}>
                                  {n.status}
                                </span>
                              </div>

                              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                                <span>Total: <strong className="text-slate-900 dark:text-white font-mono">Bs {formatBs(n.total_amount)}</strong></span>
                                <span>A/C: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">Bs {formatBs(n.paid_amount)}</strong></span>
                                <span>Saldo: <strong className={`font-mono ${hasDebt ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>Bs {formatBs(n.balance_amount)}</strong></span>
                              </div>
                            </div>

                            {/* Action Buttons: Cobrar / A Cuenta, Editar, Ver */}
                            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap justify-end shrink-0">
                              {hasDebt && onOpenAddPayment && (
                                <button
                                  type="button"
                                  onClick={() => onOpenAddPayment({ ...n, customer_name: customerStatement.customer.name })}
                                  className="flex-1 sm:flex-none py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                                  title="Registrar pago o abono a cuenta"
                                >
                                  <DollarSign size={13} />
                                  <span>Cobrar / A Cuenta</span>
                                </button>
                              )}

                              {n.status !== 'ANULADO' && onOpenEditNote && (
                                <button
                                  type="button"
                                  onClick={() => handleInspectNote(n.id, 'edit')}
                                  className="py-1.5 px-2.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-500/15 dark:hover:bg-cyan-500/25 border border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer"
                                  title="Editar productos o precios de esta nota"
                                >
                                  <Pencil size={13} />
                                  <span>Editar</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleInspectNote(n.id, 'print')}
                                className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer"
                                title="Ver / Imprimir comprobante"
                              >
                                <Printer size={13} />
                                <span>Ver</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                      Este cliente no tiene notas de venta registradas todavía.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-400">
                Selecciona un cliente de la lista para ver sus notas y saldos.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
