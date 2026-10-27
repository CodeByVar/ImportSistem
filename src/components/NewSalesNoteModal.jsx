import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Package, 
  User, 
  MapPin, 
  Phone, 
  Check, 
  AlertCircle, 
  X,
  Boxes,
  ExternalLink,
  Printer,
  DollarSign,
  Calendar,
  Clock
} from 'lucide-react';

// Searchable Combobox for selecting products from entire 5,400+ DB
function ProductSearchCombobox({ products, item, onSelectProduct, onClearProduct }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return products.slice(0, 30);
    }
    const words = term.split(/\s+/);
    return products.filter(p => {
      const matchSku = p.sku ? p.sku.toLowerCase() : '';
      const matchName = p.name ? p.name.toLowerCase() : '';
      const matchBrand = p.brand ? p.brand.toLowerCase() : '';
      const full = `${matchSku} ${matchName} ${matchBrand}`;
      return words.every(w => full.includes(w));
    }).slice(0, 50);
  }, [products, searchTerm]);

  if (item.product_id) {
    return (
      <div style={{
        background: 'rgba(6, 182, 212, 0.08)',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        borderRadius: '8px',
        padding: '5px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '6px',
        minHeight: '44px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <span style={{ 
              fontFamily: 'monospace', 
              fontWeight: 800, 
              color: 'var(--cyan-primary)', 
              fontSize: '0.74rem',
              background: 'rgba(6, 182, 212, 0.15)',
              padding: '1px 5px',
              borderRadius: '4px',
              flexShrink: 0
            }}>
              {item.sku}
            </span>
            <span style={{
              fontSize: '0.76rem',
              fontWeight: 600,
              color: '#f8fafc',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {item.description}
            </span>
          </div>
          <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: (item.stock_now || 0) > 0 ? '#34d399' : '#fb7185', fontWeight: 700 }}>
              Stock: {item.stock_now || 0}
            </span>
            <span>• {item.units_per_box || 1} u/cj</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onClearProduct();
            setSearchTerm('');
            setTimeout(() => setIsOpen(true), 50);
          }}
          className="btn btn-secondary"
          title="Cambiar producto / Buscar otro"
          style={{ padding: '4px 6px', fontSize: '0.68rem', height: '24px', border: 'none', color: '#fb7185' }}
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          type="text"
          className="form-input"
          placeholder="Buscar por código (SKU) o nombre..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={{ paddingLeft: '30px', fontSize: '0.78rem', height: '42px' }}
        />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 9999,
          background: '#090d16',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          boxShadow: '0 12px 35px rgba(0,0,0,0.9)',
          borderRadius: '8px',
          maxHeight: '270px',
          overflowY: 'auto',
          marginTop: '4px'
        }}>
          {filteredProducts.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              No se encontraron productos con "{searchTerm}"
            </div>
          ) : (
            filteredProducts.map(p => {
              const hasStock = (p.current_stock || 0) > 0;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProduct(p);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  style={{
                    padding: '8px 10px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        color: 'var(--cyan-primary)',
                        fontSize: '0.74rem',
                        background: 'rgba(6, 182, 212, 0.15)',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        whiteSpace: 'nowrap'
                      }}>
                        {p.sku}
                      </span>
                      <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.67rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: hasStock ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      color: hasStock ? '#34d399' : '#fb7185',
                      whiteSpace: 'nowrap'
                    }}>
                      Stock: {p.current_stock || 0}
                    </span>
                  </div>

                  <div style={{
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    flexWrap: 'wrap'
                  }}>
                    <span>📦 Cj: {p.units_per_box || 1} u</span>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>Mayor: Bs {p.wholesale_price || 0}</span>
                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>Caja: Bs {p.box_price || 0}</span>
                    <span style={{ color: '#c084fc', fontWeight: 600 }}>Esp: Bs {p.special_price || 0}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function NewSalesNoteModal({ 
  isOpen, 
  onClose, 
  onNoteCreated, 
  onNoteUpdated,
  onOpenPrintNote,
  noteToEdit = null,
  products = [] 
}) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerLocationUrl, setNewCustomerLocationUrl] = useState('');
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [sellerName, setSellerName] = useState('DANIEL');
  const [deliveryType, setDeliveryType] = useState('A su tienda');
  const [destination, setDestination] = useState('');
  const [deliveryLocationUrl, setDeliveryLocationUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Items in note
  const [items, setItems] = useState([
    {
      id: Date.now(),
      product_id: null,
      sku: '',
      description: '',
      unit_med: 'UNI',
      sale_mode: 'CAJA', // 'CAJA' or 'UNIDAD'
      boxes_count: 1,
      units_per_box: 1,
      quantity: 1,
      unit_price: '',
      price_type: 'caja', // 'mayor', 'caja', 'especial', 'manual'
      wholesale_price: 0,
      box_price: 0,
      special_price: 0,
      sale_price: 0,
      warehouse_source: 'ALMACEN', // 'ALMACEN', 'TIENDA', 'CASA CUBANO'
      stock_now: 0
    }
  ]);

  // Payments / Abonos (Existing from DB & New to add)
  const [existingPayments, setExistingPayments] = useState([]);
  const [newPayments, setNewPayments] = useState([]);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch customers and reset/load form on open
  useEffect(() => {
    if (isOpen) {
      if (noteToEdit) {
        setSelectedCustomer({
          id: noteToEdit.customer_id,
          name: noteToEdit.customer_name,
          phone: noteToEdit.customer_phone,
          address: noteToEdit.customer_address,
          store_location_url: noteToEdit.delivery_location_url
        });
        setDate(noteToEdit.date || new Date().toISOString().split('T')[0]);
        setDueDate(noteToEdit.due_date || noteToEdit.date || new Date().toISOString().split('T')[0]);
        setSellerName(noteToEdit.seller_name || 'DANIEL');
        setDeliveryType(noteToEdit.delivery_type || 'A su tienda');
        setDestination(noteToEdit.delivery_destination || noteToEdit.customer_address || '');
        setDeliveryLocationUrl(noteToEdit.delivery_location_url || '');
        setNotes(noteToEdit.notes || '');
        setErrorMessage('');

        if (noteToEdit.items && noteToEdit.items.length > 0) {
          setItems(noteToEdit.items.map((it, idx) => ({
            id: it.id || Date.now() + idx,
            product_id: it.product_id,
            sku: it.sku || '',
            description: it.description || '',
            unit_med: it.unit_med || 'UNI',
            sale_mode: it.sale_mode || 'CAJA',
            boxes_count: it.boxes_count || 1,
            units_per_box: it.units_per_box || 1,
            quantity: it.quantity || 1,
            unit_price: it.unit_price || '',
            price_type: 'caja',
            wholesale_price: 0,
            box_price: 0,
            special_price: 0,
            sale_price: 0,
            warehouse_source: it.warehouse_source || 'ALMACEN',
            stock_now: 0
          })));
        } else {
          setItems([
            {
              id: Date.now(),
              product_id: null,
              sku: '',
              description: '',
              unit_med: 'UNI',
              sale_mode: 'CAJA',
              boxes_count: 1,
              units_per_box: 1,
              quantity: 1,
              unit_price: '',
              price_type: 'caja',
              wholesale_price: 0,
              box_price: 0,
              special_price: 0,
              sale_price: 0,
              warehouse_source: 'ALMACEN',
              stock_now: 0
            }
          ]);
        }

        // Cargar pagos / abonos ya registrados
        if (noteToEdit.payments && Array.isArray(noteToEdit.payments)) {
          setExistingPayments(noteToEdit.payments);
        } else {
          setExistingPayments([]);
        }
        setNewPayments([]);

        // Consultar el endpoint GET /api/sales-notes/:id para asegurar datos frescos y pagos al segundo
        if (noteToEdit.id) {
          fetch(`/api/sales-notes/${noteToEdit.id}`)
            .then(res => res.json())
            .then(res => {
              if (res.success && res.data) {
                if (res.data.payments && Array.isArray(res.data.payments)) {
                  setExistingPayments(res.data.payments);
                }
                if (res.data.items && res.data.items.length > 0) {
                  setItems(res.data.items.map((it, idx) => ({
                    id: it.id || Date.now() + idx,
                    product_id: it.product_id,
                    sku: it.sku || '',
                    description: it.description || '',
                    unit_med: it.unit_med || 'UNI',
                    sale_mode: it.sale_mode || 'CAJA',
                    boxes_count: it.boxes_count || 1,
                    units_per_box: it.units_per_box || 1,
                    quantity: it.quantity || 1,
                    unit_price: it.unit_price || '',
                    price_type: 'caja',
                    wholesale_price: 0,
                    box_price: 0,
                    special_price: 0,
                    sale_price: 0,
                    warehouse_source: it.warehouse_source || 'ALMACEN',
                    stock_now: it.current_stock_now || 0
                  })));
                }
              }
            })
            .catch(err => console.error('Error fetching note details:', err));
        }
      } else {
        setSelectedCustomer(null);
        setCustomerSearch('');
        setIsCreatingCustomer(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
        setNewCustomerAddress('');
        setNewCustomerLocationUrl('');
        setDate(new Date().toISOString().split('T')[0]);
        setDueDate(new Date().toISOString().split('T')[0]);
        setSellerName('DANIEL');
        setDeliveryType('A su tienda');
        setDestination('');
        setDeliveryLocationUrl('');
        setNotes('');
        setErrorMessage('');
        setItems([
          {
            id: Date.now(),
            product_id: null,
            sku: '',
            description: '',
            unit_med: 'UNI',
            sale_mode: 'CAJA',
            boxes_count: 1,
            units_per_box: 1,
            quantity: 1,
            unit_price: '',
            price_type: 'caja',
            wholesale_price: 0,
            box_price: 0,
            special_price: 0,
            sale_price: 0,
            warehouse_source: 'ALMACEN',
            stock_now: 0
          }
        ]);
        setExistingPayments([]);
        setNewPayments([
          {
            tempId: Date.now() + 1,
            payment_method: 'POR EFECTIVO',
            amount: '',
            amount_cash: '',
            amount_qr: '',
            qr_account: 'CUENTA JAIME',
            payment_date: new Date().toISOString().split('T')[0],
            registered_by: 'DANIEL'
          }
        ]);
      }

      fetch('/api/customers')
        .then(res => res.json())
        .then(res => {
          if (res.success && res.data) {
            setCustomers(res.data);
          }
        })
        .catch(err => console.error('Error fetching customers:', err));
    }
  }, [isOpen, noteToEdit]);

  // Filter customers for Step 1
  const filteredCustomers = useMemo(() => {
    const term = customerSearch.trim().toLowerCase();
    if (!term) {
      return customers.slice(0, 15);
    }
    const words = term.split(/\s+/);
    return customers.filter(c => {
      const name = (c.name || '').toLowerCase();
      const code = (c.code || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const address = (c.address || '').toLowerCase();
      const full = `${code} ${name} ${phone} ${address}`;
      return words.every(w => full.includes(w));
    }).slice(0, 30);
  }, [customers, customerSearch]);

  // Direct selection of an existing customer
  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setDestination(cust.address || '');
    setDeliveryLocationUrl(cust.store_location_url || '');
    setErrorMessage('');
  };

  // Create new customer inline and directly lock into this note
  const handleCreateAndSelectCustomer = async (e) => {
    e?.preventDefault();
    if (!newCustomerName.trim()) {
      setErrorMessage('Por favor ingrese el nombre del nuevo cliente.');
      return;
    }

    setIsSavingCustomer(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustomerName.trim().toUpperCase(),
          phone: newCustomerPhone.trim(),
          address: newCustomerAddress.trim(),
          city: 'Cochabamba',
          store_location_url: newCustomerLocationUrl.trim(),
          notes: 'Registrado desde Nueva Nota de Venta'
        })
      }).then(r => r.json());

      if (!res.success) {
        throw new Error(res.error || 'Error al guardar nuevo cliente');
      }

      const created = res.data;
      setCustomers(prev => [created, ...prev]);
      setSelectedCustomer(created);
      setDestination(created.address || '');
      setDeliveryLocationUrl(created.store_location_url || '');
      setIsCreatingCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerAddress('');
      setNewCustomerLocationUrl('');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSavingCustomer(false);
    }
  };

  // Add Item row
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        product_id: null,
        sku: '',
        description: '',
        unit_med: 'UNI',
        sale_mode: 'CAJA',
        boxes_count: 1,
        units_per_box: 1,
        quantity: 1,
        unit_price: '',
        price_type: 'caja',
        wholesale_price: 0,
        box_price: 0,
        special_price: 0,
        sale_price: 0,
        warehouse_source: 'ALMACEN',
        stock_now: 0
      }
    ]);
  };

  // Remove Item row
  const handleRemoveItem = (id) => {
    setItems(prev => (prev.length > 1 ? prev.filter(it => it.id !== id) : prev));
  };

  // Select product for a row
  const handleSelectProduct = (itemId, prod) => {
    if (!prod) return;

    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      const upb = prod.units_per_box || 1;
      
      let price = 0;
      let priceType = 'mayor';

      if (it.sale_mode === 'CAJA') {
        if (prod.box_price && prod.box_price > 0) {
          price = prod.box_price;
          priceType = 'caja';
        } else if (prod.wholesale_price && prod.wholesale_price > 0) {
          price = prod.wholesale_price;
          priceType = 'mayor';
        } else {
          price = prod.sale_price || 0;
          priceType = 'manual';
        }
      } else {
        if (prod.wholesale_price && prod.wholesale_price > 0) {
          price = prod.wholesale_price;
          priceType = 'mayor';
        } else if (prod.sale_price && prod.sale_price > 0) {
          price = prod.sale_price;
          priceType = 'manual';
        } else {
          price = prod.box_price || 0;
          priceType = 'caja';
        }
      }

      return {
        ...it,
        product_id: prod.id,
        sku: prod.sku,
        description: prod.name,
        unit_med: prod.unit || 'UNI',
        units_per_box: upb,
        unit_price: price,
        price_type: priceType,
        wholesale_price: prod.wholesale_price || 0,
        box_price: prod.box_price || 0,
        special_price: prod.special_price || 0,
        sale_price: prod.sale_price || 0,
        stock_now: prod.current_stock
      };
    }));
  };

  // Clear product from row to search again
  const handleClearProduct = (itemId) => {
    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      return {
        ...it,
        product_id: null,
        sku: '',
        description: '',
        unit_price: '',
        price_type: 'caja',
        wholesale_price: 0,
        box_price: 0,
        special_price: 0,
        sale_price: 0,
        stock_now: 0
      };
    }));
  };

  // Toggle sale mode and adjust price smartly
  const handleSaleModeChange = (itemId, newMode) => {
    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      let newPrice = it.unit_price;
      let newPriceType = it.price_type;

      if (newMode === 'CAJA' && it.box_price > 0) {
        newPrice = it.box_price;
        newPriceType = 'caja';
      } else if (newMode === 'UNIDAD' && it.wholesale_price > 0) {
        newPrice = it.wholesale_price;
        newPriceType = 'mayor';
      }

      return {
        ...it,
        sale_mode: newMode,
        unit_price: newPrice,
        price_type: newPriceType
      };
    }));
  };

  // Update Item field (supports single field or multiple updates object)
  const handleUpdateItem = (id, fieldOrUpdates, value) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      if (typeof fieldOrUpdates === 'object' && fieldOrUpdates !== null) {
        return { ...it, ...fieldOrUpdates };
      }
      return { ...it, [fieldOrUpdates]: value };
    }));
  };

  // Add New Payment row
  const handleAddNewPayment = () => {
    setNewPayments(prev => [
      ...prev,
      {
        tempId: Date.now() + Math.random(),
        payment_method: 'POR EFECTIVO',
        amount: '',
        amount_cash: '',
        amount_qr: '',
        qr_account: 'CUENTA JAIME',
        payment_date: new Date().toISOString().split('T')[0],
        registered_by: sellerName || 'DANIEL'
      }
    ]);
  };

  const handleRemoveNewPayment = (tempId) => {
    setNewPayments(prev => prev.filter(p => p.tempId !== tempId));
  };

  const handleUpdateNewPayment = (tempId, field, value) => {
    setNewPayments(prev => prev.map(p => {
      if (p.tempId !== tempId) return p;
      return { ...p, [field]: value };
    }));
  };

  // Delete existing payment from database with recalculation
  const handleDeleteExistingPayment = async (payment) => {
    if (!noteToEdit?.id || !payment?.id) return;
    const confirmMsg = `¿Deseas anular y eliminar este abono de Bs ${Number(payment.amount).toFixed(2)}?\n\n• Cobrado por: ${payment.registered_by || 'DANIEL'}\n• Modalidad: ${payment.payment_method}\n• Fecha: ${payment.payment_date}\n\nEl saldo de la nota será recalculado automáticamente.`;
    if (!window.confirm(confirmMsg)) return;

    setIsDeletingPayment(true);
    try {
      const res = await fetch(`/api/sales-notes/${noteToEdit.id}/payments/${payment.id}`, {
        method: 'DELETE'
      }).then(r => r.json());

      if (!res.success) {
        throw new Error(res.error || 'Error al eliminar abono');
      }

      setExistingPayments(prev => prev.filter(p => p.id !== payment.id));
      if (onNoteUpdated) {
        onNoteUpdated(res.data);
      }
    } catch (err) {
      alert(`Error al eliminar abono: ${err.message}`);
    } finally {
      setIsDeletingPayment(false);
    }
  };

  // Calculate totals
  let totalBoxes = 0;
  let totalUnits = 0;
  let totalAmount = 0;

  items.forEach(it => {
    const isBox = it.sale_mode === 'CAJA';
    const price = parseFloat(it.unit_price) || 0;
    if (isBox) {
      const b = parseInt(it.boxes_count || 0, 10);
      const u = parseInt(it.units_per_box || 1, 10);
      totalBoxes += b;
      totalUnits += b * u;
      totalAmount += b * u * price;
    } else {
      const q = parseInt(it.quantity || 0, 10);
      totalUnits += q;
      totalAmount += q * price;
    }
  });

  const existingPaidSum = existingPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
  const newPaidSum = newPayments.reduce((acc, p) => {
    if (p.payment_method === 'POR EFECTIVO Y TRANSFERENCIA') {
      const c = parseFloat(p.amount_cash) || 0;
      const q = parseFloat(p.amount_qr) || 0;
      return acc + c + q;
    }
    return acc + (parseFloat(p.amount) || 0);
  }, 0);
  const totalPaid = existingPaidSum + newPaidSum;
  const balanceDue = Math.max(0, totalAmount - totalPaid);

  const isCredit = Boolean(dueDate && dueDate > date && balanceDue > 0);
  let noteStatusLabel = 'PENDIENTE';
  let noteStatusColor = '#fbbf24';
  let noteStatusBg = 'rgba(245, 158, 11, 0.15)';
  let noteStatusBorder = 'rgba(245, 158, 11, 0.35)';

  if (balanceDue <= 0) {
    noteStatusLabel = 'CANCELADO / PAGADO';
    noteStatusColor = '#34d399';
    noteStatusBg = 'rgba(16, 185, 129, 0.15)';
    noteStatusBorder = 'rgba(16, 185, 129, 0.35)';
  } else if (isCredit) {
    const dueParts = (dueDate || '').split('-');
    const dueShort = dueParts.length === 3 ? `${dueParts[2]}/${dueParts[1]}` : dueDate;
    noteStatusLabel = `CRÉDITO (Vence ${dueShort})`;
    noteStatusColor = '#818cf8';
    noteStatusBg = 'rgba(99, 102, 241, 0.15)';
    noteStatusBorder = 'rgba(99, 102, 241, 0.35)';
  }

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedCustomer) {
      setErrorMessage('Por favor selecciona o crea un cliente primero.');
      return;
    }

    const custName = selectedCustomer.name;
    const custPhone = selectedCustomer.phone || '';
    const custAddress = selectedCustomer.address || '';
    const finalCustId = selectedCustomer.id;

    // Validate items
    const validItems = items.filter(it => it.sku || it.description);
    if (validItems.length === 0) {
      setErrorMessage('Debe agregar al menos un producto a la nota de venta.');
      return;
    }

    for (const it of validItems) {
      if (!it.unit_price || parseFloat(it.unit_price) <= 0) {
        setErrorMessage(`El precio para "${it.description || it.sku}" debe ser mayor a 0.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Submit note
      const payload = {
        customer_id: finalCustId,
        customer_name: custName,
        customer_phone: custPhone,
        customer_address: custAddress,
        date,
        due_date: dueDate,
        seller_name: sellerName,
        delivery_type: deliveryType || 'A su tienda',
        delivery_destination: destination || custAddress,
        delivery_location_url: deliveryLocationUrl || selectedCustomer.store_location_url || '',
        notes,
        items: validItems.map(it => ({
          product_id: it.product_id,
          sku: it.sku,
          description: it.description,
          unit_med: it.unit_med,
          sale_mode: it.sale_mode,
          boxes_count: parseInt(it.boxes_count || 1, 10),
          units_per_box: parseInt(it.units_per_box || 1, 10),
          quantity: it.sale_mode === 'CAJA' ? parseInt(it.boxes_count || 1, 10) * parseInt(it.units_per_box || 1, 10) : parseInt(it.quantity || 1, 10),
          unit_price: parseFloat(it.unit_price) || 0,
          warehouse_source: it.warehouse_source || 'ALMACEN'
        })),
        payments: (() => {
          const list = [];
          newPayments.forEach(p => {
            if (p.payment_method === 'POR EFECTIVO Y TRANSFERENCIA') {
              const cash = parseFloat(p.amount_cash) || 0;
              const qr = parseFloat(p.amount_qr) || 0;
              const qrAcc = p.qr_account || 'CUENTA JAIME';

              if (cash > 0) {
                list.push({
                  is_new: true,
                  payment_method: 'POR EFECTIVO',
                  account_info: `Parte Efectivo (Pago Mixto)`,
                  amount: cash,
                  payment_date: p.payment_date || date,
                  registered_by: p.registered_by || sellerName || 'DANIEL'
                });
              }
              if (qr > 0) {
                list.push({
                  is_new: true,
                  payment_method: `POR TRANSFERENCIA QR ${qrAcc}`,
                  account_info: `Parte QR ${qrAcc} (Pago Mixto)`,
                  amount: qr,
                  payment_date: p.payment_date || date,
                  registered_by: p.registered_by || sellerName || 'DANIEL'
                });
              }
            } else {
              const amt = parseFloat(p.amount) || 0;
              if (amt > 0) {
                list.push({
                  is_new: true,
                  payment_method: p.payment_method,
                  account_info: '',
                  amount: amt,
                  payment_date: p.payment_date || date,
                  registered_by: p.registered_by || sellerName || 'DANIEL'
                });
              }
            }
          });
          return list;
        })()
      };

      if (noteToEdit) {
        const res = await fetch(`/api/sales-notes/${noteToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(r => r.json());

        if (!res.success) {
          throw new Error(res.error || 'Error al actualizar la nota de venta.');
        }

        const fullNoteRes = await fetch(`/api/sales-notes/${noteToEdit.id}`).then(r => r.json());
        if (fullNoteRes.success) {
          onNoteUpdated && onNoteUpdated(fullNoteRes.data);
        } else {
          onNoteUpdated && onNoteUpdated(res.data);
        }

        onClose();
        return;
      }

      const res = await fetch('/api/sales-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (!res.success) {
        throw new Error(res.error || 'Error al emitir la nota de venta.');
      }

      // Fetch the full newly created note to pass to printer
      const fullNoteRes = await fetch(`/api/sales-notes/${res.data.noteId}`).then(r => r.json());
      if (fullNoteRes.success) {
        onNoteCreated && onNoteCreated(fullNoteRes.data);
      } else {
        onNoteCreated && onNoteCreated(res.data);
      }

      onClose();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1050 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '1050px', 
          width: '95%',
          maxHeight: '94vh',
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
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
            }}>
              <Package size={22} />
            </div>
            <div>
              <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)', margin: 0 }}>
                {noteToEdit ? `Editar Pedido / Nota: ${noteToEdit.note_code}` : 'Emitir Nota de Despacho & Venta'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                {noteToEdit
                  ? `Cliente: ${selectedCustomer?.name || noteToEdit.customer_name} • Ajusta cajas, agrega o quita productos (Stock sincronizado)`
                  : selectedCustomer 
                    ? `Cliente: ${selectedCustomer.name} • Cajas/unidades, abonos y almacén` 
                    : 'Paso 1: Busca o registra al cliente para iniciar la nota de venta'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {noteToEdit && onOpenPrintNote && (
              <button
                type="button"
                onClick={() => onOpenPrintNote(noteToEdit)}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '6px 12px', gap: '6px' }}
                title="Ver vista de impresión y WhatsApp"
              >
                <Printer size={15} />
                <span>Ver Comprobante</span>
              </button>
            )}
            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px', border: 'none' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content: Step 1 vs Step 2 */}
        {!selectedCustomer ? (
          <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
            {errorMessage && (
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
                <span>{errorMessage}</span>
              </div>
            )}

            {!isCreatingCustomer ? (
              <div>
                {/* Search & Action Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '14px',
                  padding: '20px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={20} color="var(--cyan-primary)" />
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                        ¿A qué cliente se emitirá esta nota?
                      </h4>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                      Busca un cliente registrado en la base de datos o crea uno nuevo al instante.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingCustomer(true);
                      setNewCustomerName(customerSearch.trim());
                      setErrorMessage('');
                    }}
                    className="btn btn-primary"
                    style={{ padding: '9px 18px', fontSize: '0.84rem', fontWeight: 700, gap: '8px' }}
                  >
                    <Plus size={16} />
                    <span>+ Crear Nuevo Cliente</span>
                  </button>
                </div>

                {/* Search Input */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Buscar por nombre de cliente, teléfono, código o dirección / mercado..."
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    autoFocus
                    style={{
                      paddingLeft: '46px',
                      height: '48px',
                      fontSize: '0.92rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(6, 182, 212, 0.4)',
                      background: 'rgba(15, 23, 42, 0.7)'
                    }}
                  />
                  {customerSearch && (
                    <button
                      type="button"
                      onClick={() => setCustomerSearch('')}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {/* Subtitle */}
                <div style={{ marginBottom: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {customerSearch.trim() ? `Resultados de búsqueda (${filteredCustomers.length}):` : 'Clientes Registrados en Base de Datos:'}
                </div>

                {/* Customer List */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  paddingRight: '6px'
                }}>
                  {filteredCustomers.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '12px',
                      border: '1px dashed var(--border-subtle)'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
                      <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                        No se encontró ningún cliente con "{customerSearch}"
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '16px' }}>
                        Puedes registrarlo ahora mismo para continuar con la nota
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingCustomer(true);
                          setNewCustomerName(customerSearch.trim().toUpperCase());
                          setErrorMessage('');
                        }}
                        className="btn btn-emerald"
                        style={{ padding: '8px 18px', fontSize: '0.84rem', fontWeight: 700, gap: '6px' }}
                      >
                        <Plus size={16} />
                        <span>Crear cliente "{customerSearch.trim()}"</span>
                      </button>
                    </div>
                  ) : (
                    filteredCustomers.map(c => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '14px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                          e.currentTarget.style.background = 'rgba(6, 182, 212, 0.08)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, overflow: 'hidden' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            background: 'rgba(99, 102, 241, 0.2)',
                            color: 'var(--indigo-brand)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1rem',
                            flexShrink: 0
                          }}>
                            {(c.name || 'C').slice(0, 2).toUpperCase()}
                          </div>

                          <div style={{ overflow: 'hidden', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.96rem' }}>
                                {c.name}
                              </span>
                              <span className="badge badge-indigo" style={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>
                                {c.code || `CLI-${c.id}`}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '14px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', flexWrap: 'wrap' }}>
                              {c.phone ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Phone size={12} color="var(--emerald-success)" /> {c.phone}
                                </span>
                              ) : (
                                <span style={{ color: '#64748b' }}>Sin teléfono</span>
                              )}

                              {c.address ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <MapPin size={12} color="var(--cyan-primary)" /> {c.address}
                                </span>
                              ) : (
                                <span style={{ color: '#64748b' }}>Sin dirección</span>
                              )}

                              {c.store_location_url && (
                                <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                  📍 Ubicación GPS
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{
                            padding: '8px 16px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            flexShrink: 0,
                            gap: '6px'
                          }}
                        >
                          <span>Crear Nota</span>
                          <span>→</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Inline New Customer Creation Form */
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                borderRadius: '16px',
                padding: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--emerald-success)'
                    }}>
                      <User size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                        Registrar Nuevo Cliente
                      </h4>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
                        Se guardará en la cartera de clientes y se iniciará la nota para él de inmediato.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingCustomer(false);
                      setErrorMessage('');
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  >
                    ← Volver al Buscador
                  </button>
                </div>

                <form onSubmit={handleCreateAndSelectCustomer}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label className="form-label">Nombre del Cliente / Negocio *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej. ERICK GARCIA o COMERCIAL HNOS."
                        value={newCustomerName}
                        onChange={e => setNewCustomerName(e.target.value)}
                        autoFocus
                        required
                        style={{ height: '42px', fontSize: '0.88rem' }}
                      />
                    </div>

                    <div>
                      <label className="form-label">Teléfono / WhatsApp</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej. 68579599"
                        value={newCustomerPhone}
                        onChange={e => setNewCustomerPhone(e.target.value)}
                        style={{ height: '42px', fontSize: '0.88rem' }}
                      />
                    </div>

                    <div>
                      <label className="form-label">Dirección / Mercado del Cliente</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej. MERCADO LA PAMPA / PASILLO 3"
                        value={newCustomerAddress}
                        onChange={e => setNewCustomerAddress(e.target.value)}
                        style={{ height: '42px', fontSize: '0.88rem' }}
                      />
                    </div>

                    <div>
                      <label className="form-label">Link Ubicación Google Maps / GPS de su tienda (Opcional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="https://maps.app.goo.gl/... o enlace GPS"
                        value={newCustomerLocationUrl}
                        onChange={e => setNewCustomerLocationUrl(e.target.value)}
                        style={{ height: '42px', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCustomer(false)}
                      className="btn btn-secondary"
                      style={{ padding: '10px 18px' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingCustomer}
                      className="btn btn-primary"
                      style={{ padding: '10px 24px', fontWeight: 800, gap: '8px' }}
                    >
                      {isSavingCustomer ? (
                        <span>Guardando...</span>
                      ) : (
                        <>
                          <Check size={16} />
                          <span>Guardar y Crear Nota para este Cliente</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* Step 2: Form Body with Customer Locked In */
          <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
            {/* Locked Customer Header Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.45)',
              borderRadius: '14px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '1.15rem',
                  boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)'
                }}>
                  {(selectedCustomer.name || 'C').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc' }}>
                      {selectedCustomer.name}
                    </span>
                    <span className="badge badge-indigo" style={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>
                      {selectedCustomer.code || `CLI-${selectedCustomer.id}`}
                    </span>
                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                      ✓ Cliente Asignado
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', flexWrap: 'wrap' }}>
                    {selectedCustomer.phone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={13} color="var(--emerald-success)" /> {selectedCustomer.phone}
                      </span>
                    )}
                    {selectedCustomer.address && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} color="var(--cyan-primary)" /> {selectedCustomer.address}
                      </span>
                    )}
                    {(selectedCustomer.store_location_url || deliveryLocationUrl) && (
                      <a 
                        href={deliveryLocationUrl || selectedCustomer.store_location_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                      >
                        <ExternalLink size={13} /> Ver Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (items.some(i => i.product_id) && !window.confirm('¿Deseas seleccionar otro cliente para esta nota?')) {
                    return;
                  }
                  setSelectedCustomer(null);
                }}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '7px 14px', gap: '6px' }}
                title="Cambiar cliente para esta nota"
              >
                🔄 Cambiar Cliente
              </button>
            </div>

            {/* General Note Logistics & Dates Bar */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '16px 18px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                {/* Encargado / Vendedor */}
                <div>
                  <label className="form-label">Vendedor / Encargado</label>
                  <select 
                    className="form-select" 
                    value={sellerName} 
                    onChange={e => setSellerName(e.target.value)}
                  >
                    <option value="DANIEL">DANIEL</option>
                    <option value="JAIME">JAIME</option>
                    <option value="MOSTRADOR TIENDA">MOSTRADOR TIENDA</option>
                    <option value="VENTAS MAYORISTA">VENTAS MAYORISTA</option>
                  </select>
                </div>

                {/* Fecha Emisión */}
                <div>
                  <label className="form-label">Fecha de Venta</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={date} 
                    onChange={e => setDate(e.target.value)}
                    required 
                  />
                </div>

                {/* Fecha Límite de Pago */}
                <div>
                  <label className="form-label">Fecha Límite de Pago (Crédito)</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={dueDate} 
                    onChange={e => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

          {/* Section 2: Items Table (Mixed Box / Unit) */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '18px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Boxes size={18} color="var(--cyan-primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cyan-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  2. Mercadería & Detalle de Productos
                </span>
                <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                  Soporte Cajas & Unidades
                </span>
              </div>
              <button 
                type="button" 
                onClick={handleAddItem}
                className="btn btn-emerald"
                style={{ fontSize: '0.76rem', padding: '6px 12px', gap: '6px' }}
              >
                <Plus size={14} />
                <span>+ Agregar Producto</span>
              </button>
            </div>

            {/* Items Dynamic Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((it, idx) => {
                const isBox = it.sale_mode === 'CAJA';
                const rowSubtotal = isBox 
                  ? (parseInt(it.boxes_count || 0, 10) * parseInt(it.units_per_box || 1, 10) * (parseFloat(it.unit_price) || 0))
                  : (parseInt(it.quantity || 0, 10) * (parseFloat(it.unit_price) || 0));

                return (
                  <div 
                    key={it.id} 
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'grid',
                      gridTemplateColumns: 'minmax(250px, 2.8fr) 95px 130px 175px 135px 95px 36px',
                      gap: '10px',
                      alignItems: 'center'
                    }}
                  >
                    {/* Product Searchable Combobox */}
                    <div>
                      <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                        Producto ({it.stock_now ? `Stock: ${it.stock_now}` : 'Buscador'}) *
                      </label>
                      <ProductSearchCombobox 
                        products={products}
                        item={it}
                        onSelectProduct={(p) => handleSelectProduct(it.id, p)}
                        onClearProduct={() => handleClearProduct(it.id)}
                      />
                    </div>

                    {/* Mode Toggle (Caja vs Unidad) */}
                    <div>
                      <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                        Modalidad
                      </label>
                      <select 
                        className="form-select"
                        value={it.sale_mode}
                        onChange={e => handleSaleModeChange(it.id, e.target.value)}
                        style={{ fontSize: '0.76rem', fontWeight: 700, color: isBox ? 'var(--cyan-primary)' : '#fbbf24', height: '42px' }}
                      >
                        <option value="CAJA">📦 Caja</option>
                        <option value="UNIDAD">🔢 Unidad</option>
                      </select>
                    </div>

                    {/* Quantity or Boxes Inputs */}
                    {isBox ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        <div>
                          <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                            Cajas
                          </label>
                          <input 
                            type="number" 
                            min="1"
                            className="form-input"
                            value={it.boxes_count}
                            onChange={e => handleUpdateItem(it.id, 'boxes_count', e.target.value)}
                            style={{ fontSize: '0.8rem', textAlign: 'center', fontWeight: 700, height: '42px', padding: '4px 2px' }}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                            U/Cj
                          </label>
                          <input 
                            type="number" 
                            min="1"
                            className="form-input"
                            value={it.units_per_box}
                            onChange={e => handleUpdateItem(it.id, 'units_per_box', e.target.value)}
                            style={{ fontSize: '0.8rem', textAlign: 'center', height: '42px', padding: '4px 2px' }}
                            required
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                          Cant. Unidades
                        </label>
                        <input 
                          type="number" 
                          min="1"
                          className="form-input"
                          value={it.quantity}
                          onChange={e => handleUpdateItem(it.id, 'quantity', e.target.value)}
                          style={{ fontSize: '0.8rem', textAlign: 'center', fontWeight: 700, height: '42px' }}
                          required
                        />
                      </div>
                    )}

                    {/* Unit Price with Quick Price Selector Chips */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                          Precio Unit. (Bs)
                        </label>
                        {it.price_type && (
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: it.price_type === 'manual' ? '#fbbf24' : 'var(--cyan-primary)' }}>
                            {it.price_type === 'caja' ? '📦 Caja' : it.price_type === 'mayor' ? '🏪 Mayor' : it.price_type === 'especial' ? '⭐ Esp' : '✏️ Manual'}
                          </span>
                        )}
                      </div>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        className="form-input" 
                        placeholder="0.00"
                        value={it.unit_price}
                        onChange={e => {
                          const val = e.target.value;
                          handleUpdateItem(it.id, {
                            unit_price: val,
                            price_type: 'manual'
                          });
                        }}
                        style={{ fontSize: '0.82rem', textAlign: 'right', fontWeight: 700, height: '30px' }}
                        required
                      />

                      {/* Quick pricing chips */}
                      <div style={{ display: 'flex', gap: '3px', marginTop: '3px', flexWrap: 'wrap' }}>
                        {it.wholesale_price > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateItem(it.id, {
                                unit_price: it.wholesale_price,
                                price_type: 'mayor'
                              });
                            }}
                            title={`Precio Mayor: Bs ${it.wholesale_price}`}
                            style={{
                              fontSize: '0.6rem',
                              padding: '1px 3px',
                              borderRadius: '3px',
                              border: `1px solid ${it.price_type === 'mayor' ? 'var(--cyan-primary)' : 'rgba(255,255,255,0.1)'}`,
                              background: it.price_type === 'mayor' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(0,0,0,0.3)',
                              color: it.price_type === 'mayor' ? '#38bdf8' : 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                          >
                            May: {it.wholesale_price}
                          </button>
                        )}
                        {it.box_price > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateItem(it.id, {
                                unit_price: it.box_price,
                                price_type: 'caja'
                              });
                            }}
                            title={`Precio Caja: Bs ${it.box_price}`}
                            style={{
                              fontSize: '0.6rem',
                              padding: '1px 3px',
                              borderRadius: '3px',
                              border: `1px solid ${it.price_type === 'caja' ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
                              background: it.price_type === 'caja' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0,0,0,0.3)',
                              color: it.price_type === 'caja' ? '#fbbf24' : 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                          >
                            Caj: {it.box_price}
                          </button>
                        )}
                        {it.special_price > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateItem(it.id, {
                                unit_price: it.special_price,
                                price_type: 'especial'
                              });
                            }}
                            title={`Precio Especial: Bs ${it.special_price}`}
                            style={{
                              fontSize: '0.6rem',
                              padding: '1px 3px',
                              borderRadius: '3px',
                              border: `1px solid ${it.price_type === 'especial' ? '#a855f7' : 'rgba(255,255,255,0.1)'}`,
                              background: it.price_type === 'especial' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(0,0,0,0.3)',
                              color: it.price_type === 'especial' ? '#c084fc' : 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                          >
                            Esp: {it.special_price}
                          </button>
                        )}
                        {it.sale_price > 0 && it.sale_price !== it.wholesale_price && it.sale_price !== it.box_price && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateItem(it.id, {
                                unit_price: it.sale_price,
                                price_type: 'unit'
                              });
                            }}
                            title={`Precio Detalle / Unitario: Bs ${it.sale_price}`}
                            style={{
                              fontSize: '0.6rem',
                              padding: '1px 3px',
                              borderRadius: '3px',
                              border: `1px solid ${it.price_type === 'unit' ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                              background: it.price_type === 'unit' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(0,0,0,0.3)',
                              color: it.price_type === 'unit' ? '#34d399' : 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                          >
                            Det: {it.sale_price}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Alistar mercadería en (Per Product) */}
                    <div>
                      <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                        Alistar en:
                      </label>
                      <select 
                        className="form-select"
                        value={it.warehouse_source || 'ALMACEN'}
                        onChange={e => handleUpdateItem(it.id, 'warehouse_source', e.target.value)}
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          height: '42px',
                          padding: '4px 6px',
                          background: it.warehouse_source === 'TIENDA' 
                            ? 'rgba(245, 158, 11, 0.15)' 
                            : it.warehouse_source === 'CASA CUBANO' 
                            ? 'rgba(168, 85, 247, 0.15)' 
                            : 'rgba(16, 185, 129, 0.15)',
                          color: it.warehouse_source === 'TIENDA' 
                            ? '#fbbf24' 
                            : it.warehouse_source === 'CASA CUBANO' 
                            ? '#c084fc' 
                            : '#34d399',
                          border: `1px solid ${
                            it.warehouse_source === 'TIENDA' 
                              ? 'rgba(245, 158, 11, 0.4)' 
                              : it.warehouse_source === 'CASA CUBANO' 
                              ? 'rgba(168, 85, 247, 0.4)' 
                              : 'rgba(16, 185, 129, 0.4)'
                          }`
                        }}
                      >
                        <option value="ALMACEN">📦 Almacén</option>
                        <option value="TIENDA">🏬 Tienda</option>
                        <option value="CASA CUBANO">🏠 C. Cubano</option>
                      </select>
                    </div>

                    {/* Subtotal */}
                    <div>
                      <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', textAlign: 'right' }}>
                        Subtotal
                      </label>
                      <div style={{
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        color: '#10b981',
                        fontFamily: 'monospace',
                        padding: '6px 2px',
                        textAlign: 'right'
                      }}>
                        Bs {rowSubtotal.toFixed(2)}
                      </div>
                    </div>

                    {/* Delete button */}
                    <div style={{ textAlign: 'center' }}>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(it.id)}
                        className="btn btn-secondary"
                        disabled={items.length <= 1}
                        style={{ padding: '6px', color: '#fb7185', border: 'none' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Warehouse batch helpers */}
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '10px' }}>
              <span>Total de productos en nota: <strong>{items.length}</strong></span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem' }}>Alistar todos en:</span>
                <button
                  type="button"
                  onClick={() => setItems(prev => prev.map(it => ({ ...it, warehouse_source: 'ALMACEN' })))}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.7rem', padding: '3px 8px', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                >
                  📦 Todo Almacén
                </button>
                <button
                  type="button"
                  onClick={() => setItems(prev => prev.map(it => ({ ...it, warehouse_source: 'TIENDA' })))}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.7rem', padding: '3px 8px', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                >
                  🏬 Todo Tienda
                </button>
                <button
                  type="button"
                  onClick={() => setItems(prev => prev.map(it => ({ ...it, warehouse_source: 'CASA CUBANO' })))}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.7rem', padding: '3px 8px', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}
                >
                  🏠 Todo Cubano
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Payments / Abonos & Liquidation */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '16px',
            marginBottom: '20px'
          }}>
            {/* Left: Abonos a Cuenta & Observaciones */}
            <div style={{
              background: 'var(--bg-subtle-box, rgba(0, 0, 0, 0.25))',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '18px'
            }}>
              {/* Título de la sección (sin botón repetido) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <DollarSign size={18} color="var(--cyan-primary)" />
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--cyan-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  3. Pagos a Cuenta & Abonos (A/C)
                </span>
              </div>

              {/* A. Historial de Pagos / Abonos ya registrados en la Nota */}
              {existingPayments.length > 0 && (
                <div style={{
                  marginBottom: '16px',
                  background: 'var(--bg-dark-surface, #ffffff)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '10px',
                  padding: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--emerald-success, #059669)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={14} />
                      Abonos Registrados ({existingPayments.length})
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--emerald-success, #059669)', fontFamily: 'var(--font-mono, monospace)' }}>
                      Total Cobrado: Bs {existingPaidSum.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {existingPayments.map((p, idx) => (
                      <div 
                        key={p.id || idx}
                        style={{
                          background: 'var(--bg-dark-card, #ffffff)',
                          border: '1px solid var(--border-subtle, #e2e8f0)',
                          borderRadius: '8px',
                          padding: '9px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          flexWrap: 'wrap',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        {/* Info Principal */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
                          <span style={{
                            fontSize: '0.98rem',
                            fontWeight: 900,
                            color: 'var(--emerald-success, #059669)',
                            fontFamily: 'var(--font-mono, monospace)',
                            minWidth: '95px'
                          }}>
                            Bs {Number(p.amount || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>

                          <span style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '5px',
                            background: 'rgba(2, 132, 199, 0.1)',
                            color: 'var(--cyan-primary, #0284c7)',
                            border: '1px solid rgba(2, 132, 199, 0.25)'
                          }}>
                            {p.payment_method?.includes('QR') || p.payment_method?.includes('TR') ? '📱' : p.payment_method?.includes('BANC') ? '🏦' : '💵'} {p.payment_method}
                          </span>

                          <span style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '5px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: 'var(--indigo-brand, #6366f1)',
                            border: '1px solid rgba(99, 102, 241, 0.25)'
                          }}>
                            👤 Cobró: {p.registered_by || 'DANIEL'}
                          </span>

                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} /> {p.payment_date}
                          </span>

                          {p.created_at && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-faint, #64748b)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={11} /> {p.created_at.replace('T', ' ').slice(0, 16)}
                            </span>
                          )}

                          {p.account_info && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              ({p.account_info})
                            </span>
                          )}
                        </div>

                        {/* Botón para eliminar/anular si se equivocaron */}
                        {noteToEdit && (
                          <button
                            type="button"
                            onClick={() => handleDeleteExistingPayment(p)}
                            disabled={isDeletingPayment}
                            className="btn btn-secondary"
                            title="Anular / Eliminar este abono de la nota"
                            style={{
                              padding: '4px 10px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: 'rgba(244, 63, 94, 0.08)',
                              color: 'var(--rose-danger, #e11d48)',
                              border: '1px solid rgba(244, 63, 94, 0.3)',
                              borderRadius: '6px',
                              gap: '4px'
                            }}
                          >
                            <Trash2 size={13} />
                            <span>Anular</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* B. Registrar Nuevos Abonos a Cuenta */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {existingPayments.length > 0 ? '+ Registrar Abono Adicional:' : 'Registrar Pago / Abono Inicial:'}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddNewPayment}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '3px 9px', color: 'var(--cyan-primary)', borderColor: 'rgba(6, 182, 212, 0.4)', gap: '4px', fontWeight: 700 }}
                  >
                    <Plus size={12} />
                    <span>+ Agregar Abono</span>
                  </button>
                </div>

                {newPayments.length === 0 ? (
                  <div style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: 'var(--bg-dark-surface, rgba(255, 255, 255, 0.03))',
                    border: '1px dashed var(--border-glass, rgba(255, 255, 255, 0.15))',
                    textAlign: 'center',
                    fontSize: '0.76rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span>No hay nuevos abonos en borrador. </span>
                    <button
                      type="button"
                      onClick={handleAddNewPayment}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--cyan-primary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      Haz clic aquí para agregar un nuevo pago a cuenta.
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {newPayments.map(p => {
                      const isMixed = p.payment_method === 'POR EFECTIVO Y TRANSFERENCIA';

                      return (
                        <div 
                          key={p.tempId} 
                          style={{ 
                            background: 'var(--bg-dark-card, rgba(6, 182, 212, 0.04))',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: isMixed ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid var(--border-subtle, rgba(6, 182, 212, 0.2))',
                            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          {/* Fila Principal de Parámetros */}
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: isMixed ? '1.9fr 1.3fr 1fr 1fr 32px' : '2.2fr 1.1fr 1.1fr 1.3fr 32px', 
                            gap: '8px', 
                            alignItems: 'end' 
                          }}>
                            {/* 1. Modalidad */}
                            <div>
                              <label style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                                Modalidad:
                              </label>
                              <select 
                                className="form-select"
                                value={p.payment_method}
                                onChange={e => handleUpdateNewPayment(p.tempId, 'payment_method', e.target.value)}
                                style={{ fontSize: '0.76rem', height: '36px', fontWeight: 700, color: isMixed ? 'var(--cyan-primary)' : 'inherit' }}
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

                            {/* Si es MIXTO: Cuenta del QR */}
                            {isMixed && (
                              <div>
                                <label style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--cyan-primary)', display: 'block', marginBottom: '3px' }}>
                                  📱 QR a Nombre de:
                                </label>
                                <select 
                                  className="form-select"
                                  value={p.qr_account || 'CUENTA JAIME'}
                                  onChange={e => handleUpdateNewPayment(p.tempId, 'qr_account', e.target.value)}
                                  style={{ fontSize: '0.76rem', height: '36px', fontWeight: 700, border: '1px solid rgba(6, 182, 212, 0.4)' }}
                                >
                                  <option value="CUENTA JAIME">CUENTA JAIME</option>
                                  <option value="CUENTA BETO">CUENTA BETO / BETHO</option>
                                  <option value="CUENTA CELSO">CUENTA CELSO</option>
                                </select>
                              </div>
                            )}

                            {/* 2. Cobró */}
                            <div>
                              <label style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                                Cobró:
                              </label>
                              <select 
                                className="form-select"
                                value={p.registered_by || 'DANIEL'}
                                onChange={e => handleUpdateNewPayment(p.tempId, 'registered_by', e.target.value)}
                                style={{ fontSize: '0.76rem', height: '36px', fontWeight: 600 }}
                              >
                                <option value="DANIEL">DANIEL</option>
                                <option value="JAIME">JAIME</option>
                                <option value="TITO">TITO</option>
                                <option value="ENTREGA">ENTREGA</option>
                                <option value="MOSTRADOR TIENDA">MOSTRADOR</option>
                              </select>
                            </div>

                            {/* 3. Fecha Pago */}
                            <div>
                              <label style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                                Fecha Pago:
                              </label>
                              <input 
                                type="date" 
                                className="form-input"
                                value={p.payment_date || date}
                                onChange={e => handleUpdateNewPayment(p.tempId, 'payment_date', e.target.value)}
                                style={{ fontSize: '0.76rem', height: '36px' }}
                              />
                            </div>

                            {/* 4. Si NO es mixto: Monto Bs directo sin Detalle */}
                            {!isMixed && (
                              <div>
                                <label style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                                  Monto Bs:
                                </label>
                                <input 
                                  type="number" 
                                  step="0.01" 
                                  min="0"
                                  className="form-input" 
                                  placeholder="0.00"
                                  value={p.amount}
                                  onChange={e => handleUpdateNewPayment(p.tempId, 'amount', e.target.value)}
                                  style={{ fontSize: '0.88rem', fontWeight: 800, textAlign: 'right', height: '36px', color: 'var(--emerald-success)' }}
                                />
                              </div>
                            )}

                            {/* 5. Descartar fila */}
                            <div style={{ textAlign: 'center' }}>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveNewPayment(p.tempId)}
                                className="btn btn-secondary"
                                title="Descartar este abono"
                                style={{ height: '36px', width: '32px', padding: 0, border: 'none', color: 'var(--rose-danger, #fb7185)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Sub-fila especial si es MIXTO: 2 CUADROS (1 Efectivo y 1 QR) */}
                          {isMixed && (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr 1.2fr',
                              gap: '12px',
                              padding: '10px 14px',
                              background: 'rgba(6, 182, 212, 0.06)',
                              borderRadius: '8px',
                              border: '1px dashed rgba(6, 182, 212, 0.35)',
                              alignItems: 'center'
                            }}>
                              <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--amber-warning, #f59e0b)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                                  💵 Monto en Efectivo (Bs):
                                </label>
                                <input 
                                  type="number" 
                                  step="0.01" 
                                  min="0"
                                  className="form-input" 
                                  placeholder="0.00"
                                  value={p.amount_cash || ''}
                                  onChange={e => handleUpdateNewPayment(p.tempId, 'amount_cash', e.target.value)}
                                  style={{ fontSize: '0.88rem', fontWeight: 800, textAlign: 'right', height: '36px', color: 'var(--amber-warning, #f59e0b)', background: 'var(--bg-dark-surface, #ffffff)' }}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--cyan-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                                  📱 Monto QR ({p.qr_account || 'CUENTA JAIME'}) (Bs):
                                </label>
                                <input 
                                  type="number" 
                                  step="0.01" 
                                  min="0"
                                  className="form-input" 
                                  placeholder="0.00"
                                  value={p.amount_qr || ''}
                                  onChange={e => handleUpdateNewPayment(p.tempId, 'amount_qr', e.target.value)}
                                  style={{ fontSize: '0.88rem', fontWeight: 800, textAlign: 'right', height: '36px', color: 'var(--cyan-primary)', background: 'var(--bg-dark-surface, #ffffff)' }}
                                />
                              </div>

                              <div style={{ textAlign: 'right', paddingRight: '4px' }}>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Total de este Abono:</span>
                                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--emerald-success)', fontFamily: 'var(--font-mono, monospace)' }}>
                                  Bs {((parseFloat(p.amount_cash) || 0) + (parseFloat(p.amount_qr) || 0)).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Observaciones adicionales */}
              <div style={{ marginTop: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Observaciones adicionales</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Notas de entrega, embalaje, chofer..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {/* Debajo de Observaciones: Lugar / Destino de Entrega & Ubicación de Tienda */}
              <div style={{
                marginTop: '14px',
                background: 'var(--bg-dark-surface, #ffffff)',
                border: '1px solid var(--border-glass)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={15} color="var(--cyan-primary)" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--cyan-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Destino & Ubicación de Entrega
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Lugar / Destino de Entrega *</label>
                    <select 
                      className="form-select"
                      value={deliveryType}
                      onChange={e => setDeliveryType(e.target.value)}
                      style={{ fontSize: '0.78rem', fontWeight: 600 }}
                    >
                      <option value="A su tienda">A su tienda</option>
                      <option value="A su casa">A su casa</option>
                      <option value="A su almacén">A su almacén</option>
                      <option value="A su casa, tienda o almacén">A su casa, tienda o almacén</option>
                      <option value="Puesto en Mercado / Feria">Puesto en Mercado / Feria</option>
                      <option value="Agencia de Transporte / Encomienda">Agencia de Transporte / Encomienda</option>
                      <option value="Retiro en Tienda (Mostrador)">Retiro en Tienda (Mostrador)</option>
                      <option value="Otro">Otro (especificar en dirección)</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Dirección / Referencia de Destino</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. MERCADO LA PAMPA / PASILLO 3"
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      style={{ fontSize: '0.78rem' }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <label className="form-label" style={{ fontSize: '0.7rem', margin: 0 }}>
                      Ubicación de su tienda (Link de Google Maps / GPS)
                    </label>
                    {deliveryLocationUrl && (
                      <a 
                        href={deliveryLocationUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ fontSize: '0.7rem', color: 'var(--cyan-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                      >
                        <ExternalLink size={11} />
                        <span>Ver / Probar Mapa</span>
                      </a>
                    )}
                  </div>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="https://maps.app.goo.gl/... o coordenadas GPS"
                    value={deliveryLocationUrl}
                    onChange={e => setDeliveryLocationUrl(e.target.value)}
                    style={{ fontSize: '0.78rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Resumen Económico */}
            <div style={{
              background: 'var(--bg-subtle-box, #ffffff)',
              border: '1px solid var(--border-glass)',
              borderRadius: '14px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
                  Liquidación de la Nota
                </span>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cajas / Unidades:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
                    {totalBoxes} cajas ({totalUnits} unidades)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.95rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>TOTAL NOTA:</span>
                  <span style={{ fontWeight: 900, color: 'var(--text-main, #f8fafc)', fontFamily: 'monospace', fontSize: '1.15rem' }}>
                    Bs {totalAmount.toFixed(2)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--emerald-success, #34d399)', fontWeight: 700 }}>A CUENTA (A/C):</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, color: 'var(--emerald-success, #34d399)', fontFamily: 'monospace', fontSize: '1rem' }}>
                      Bs {totalPaid.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {existingPaidSum > 0 && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--emerald-success, #6ee7b7)', marginTop: '1px' }}>
                        Bs {existingPaidSum.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} registrado{newPaidSum > 0 ? ` + Bs ${newPaidSum.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} nuevo` : ''}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '2px solid var(--border-subtle)', fontSize: '1.05rem' }}>
                  <span style={{ fontWeight: 800, color: balanceDue > 0 ? 'var(--rose-danger, #fb7185)' : 'var(--emerald-success, #34d399)' }}>
                    SALDO PENDIENTE:
                  </span>
                  <span style={{ fontWeight: 900, color: balanceDue > 0 ? 'var(--rose-danger, #fb7185)' : 'var(--emerald-success, #34d399)', fontFamily: 'monospace', fontSize: '1.25rem' }}>
                    Bs {balanceDue.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Status Indicator */}
              <div style={{
                marginTop: '14px',
                padding: '10px 12px',
                borderRadius: '8px',
                textAlign: 'center',
                fontWeight: 800,
                fontSize: '0.85rem',
                letterSpacing: '0.05em',
                background: noteStatusBg,
                color: noteStatusColor,
                border: `1px solid ${noteStatusBorder}`
              }}>
                ESTADO: {noteStatusLabel}
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
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
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-glass)' }}>
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
              className="btn btn-primary" 
              disabled={isSubmitting}
              style={{ padding: '10px 28px', fontWeight: 800, fontSize: '0.9rem' }}
            >
              {isSubmitting 
                ? (noteToEdit ? 'Actualizando y Sincronizando Stock...' : 'Emitiendo y Descontando Stock...') 
                : (noteToEdit ? '💾 Guardar Cambios en Nota' : 'Confirmar y Despachar Nota')}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
