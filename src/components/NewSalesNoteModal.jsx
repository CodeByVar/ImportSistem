import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  Clock,
  Save,
  RefreshCw
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
      <div className="bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-500/35 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 min-h-[44px]">
        <div className="flex flex-col overflow-hidden flex-1 min-w-0">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="font-mono font-black text-cyan-700 dark:text-cyan-300 text-[11px] bg-cyan-100/70 dark:bg-cyan-500/20 px-1.5 py-0.5 rounded shrink-0 border border-cyan-200 dark:border-cyan-500/30">
              {item.sku}
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {item.description}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex gap-2 items-center">
            <span className={`font-bold ${(item.stock_now || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
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
          className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-lg transition-colors shrink-0 cursor-pointer"
          title="Cambiar producto / Buscar otro"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          className="form-input pl-9 text-xs sm:text-sm h-10 sm:h-11 w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 rounded-xl"
          placeholder="Buscar por código (SKU) o nombre..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/40 shadow-2xl rounded-xl max-h-64 overflow-y-auto mt-1 p-1 text-slate-800 dark:text-slate-100 divide-y divide-slate-100 dark:divide-slate-800">
          {filteredProducts.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
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
                  className="p-2 sm:p-2.5 hover:bg-cyan-50 dark:hover:bg-cyan-500/20 cursor-pointer rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0">
                      <span className="font-mono font-black text-cyan-700 dark:text-cyan-300 text-[11px] bg-cyan-50 dark:bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-200 dark:border-cyan-500/30 shrink-0">
                        {p.sku}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {p.name}
                      </span>
                    </div>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border shrink-0 ${
                      hasStock 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' 
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                    }`}>
                      Stock: {p.current_stock || 0}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 sm:gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                    <span>📦 Cj: {p.units_per_box || 1} u</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold">May: Bs {p.wholesale_price || 0}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">Caj: Bs {p.box_price || 0}</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">Esp: Bs {p.special_price || 0}</span>
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
  return 'DANIEL';
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
  const [sellerName, setSellerName] = useState(() => getActiveSessionUserName());
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
        const activeCreator = getActiveSessionUserName();
        setSellerName(activeCreator);
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
            registered_by: activeCreator
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

  // Add New Payment row (Always Mixed / Direct Efectivo + QR)
  const handleAddNewPayment = () => {
    let activeSessionName = sellerName || 'ENCARGADO EN TURNO';
    try {
      const savedAuth = localStorage.getItem('siscontrol_auth_session');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed?.user?.name) activeSessionName = parsed.user.name.toUpperCase();
      } else {
        const savedActive = localStorage.getItem('siscontrol_active_user');
        if (savedActive) {
          const parsed = JSON.parse(savedActive);
          if (parsed?.name) activeSessionName = parsed.name.toUpperCase();
        }
      }
    } catch (e) {
      // ignore
    }

    setNewPayments(prev => [
      ...prev,
      {
        tempId: Date.now() + Math.random(),
        payment_method: 'POR EFECTIVO Y TRANSFERENCIA',
        amount: '',
        amount_cash: '',
        amount_qr: '',
        amount_discount: '',
        qr_account: 'CUENTA JAIME',
        payment_date: new Date().toISOString().split('T')[0],
        registered_by: activeSessionName
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
      const d = parseFloat(p.amount_discount) || 0;
      return acc + c + q + d;
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
              const disc = parseFloat(p.amount_discount) || 0;
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
              if (disc > 0) {
                list.push({
                  is_new: true,
                  payment_method: 'REBAJA / DESCUENTO',
                  account_info: 'Rebaja / Descuento aplicado',
                  amount: disc,
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
      padding: '8px'
    }}>
      <div 
        className="w-full max-w-[1050px] h-[94dvh] sm:h-auto sm:max-h-[92dvh] flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
      >
        {/* Header Compacto y Responsivo */}
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30 shrink-0">
              <Package size={19} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-heading text-sm sm:text-lg font-black text-slate-900 dark:text-white m-0 truncate">
                {noteToEdit ? `Editar Nota: ${noteToEdit.note_code}` : 'Emitir Nota de Despacho & Venta'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 m-0 truncate">
                {noteToEdit
                  ? `Cliente: ${selectedCustomer?.name || noteToEdit.customer_name}`
                  : selectedCustomer 
                    ? `Cliente: ${selectedCustomer.name}` 
                    : 'Paso 1: Selecciona o registra al cliente'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {noteToEdit && onOpenPrintNote && (
              <button
                type="button"
                onClick={() => onOpenPrintNote(noteToEdit)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                title="Ver comprobante de impresión y WhatsApp"
              >
                <Printer size={14} />
                <span className="hidden sm:inline">Ver Comprobante</span>
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content: Step 1 vs Step 2 */}
        {!selectedCustomer ? (
          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            {errorMessage && (
              <div className="bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-xl p-3 mb-3.5 flex items-center gap-2 text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-semibold">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!isCreatingCustomer ? (
              <div>
                {/* Search & Action Banner */}
                <div className="bg-gradient-to-r from-cyan-50/80 to-indigo-50/80 dark:from-cyan-950/30 dark:to-indigo-950/30 border border-cyan-200 dark:border-cyan-500/40 rounded-2xl p-3.5 sm:p-5 mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <User size={18} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                      <h4 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white m-0">
                        ¿A qué cliente se emitirá esta nota?
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0">
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
                    className="btn btn-primary py-2.5 px-4 text-xs font-bold gap-2 cursor-pointer w-full sm:w-auto justify-center shrink-0"
                  >
                    <Plus size={16} />
                    <span>Crear Nuevo Cliente</span>
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative mb-3.5">
                  <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    className="form-input pl-10 pr-9 h-11 sm:h-12 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-cyan-500/40 rounded-xl w-full"
                    placeholder="Buscar por nombre, teléfono, código o dirección..."
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    autoFocus
                  />
                  {customerSearch && (
                    <button
                      type="button"
                      onClick={() => setCustomerSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>

                {/* Subtitle */}
                <div className="mb-2.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  {customerSearch.trim() ? `Resultados de búsqueda (${filteredCustomers.length}):` : 'Clientes Registrados en Base de Datos:'}
                </div>

                {/* Customer List */}
                <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-0.5">
                  {filteredCustomers.length === 0 ? (
                    <div className="text-center p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto mb-2.5">
                        <Search size={20} />
                      </div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base mb-1">
                        No se encontró ningún cliente con "{customerSearch}"
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                        Puedes registrarlo ahora mismo para continuar con la nota
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingCustomer(true);
                          setNewCustomerName(customerSearch.trim().toUpperCase());
                          setErrorMessage('');
                        }}
                        className="btn btn-emerald text-xs py-2.5 px-4 font-bold gap-2 cursor-pointer mx-auto justify-center"
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
                        className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-cyan-500/60 hover:bg-cyan-50/50 dark:hover:bg-cyan-500/10 rounded-xl p-3 flex items-center justify-between gap-2.5 cursor-pointer transition-all shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3.5 flex-1 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                            {(c.name || 'C').slice(0, 2).toUpperCase()}
                          </div>

                          <div className="overflow-hidden flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-base truncate">
                                {c.name}
                              </span>
                              <span className="badge badge-indigo text-[10px] sm:text-[11px] font-mono">
                                {c.code || `CLI-${c.id}`}
                              </span>
                            </div>

                            <div className="flex gap-2.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                              {c.phone ? (
                                <span className="flex items-center gap-1">
                                  <Phone size={11} className="text-emerald-500 shrink-0" /> {c.phone}
                                </span>
                              ) : (
                                <span className="text-slate-400">Sin teléfono</span>
                              )}

                              {c.address ? (
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin size={11} className="text-cyan-500 shrink-0" /> <span className="truncate">{c.address}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400">Sin dirección</span>
                              )}

                              {c.store_location_url && (
                                <span className="text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1">
                                  <MapPin size={11} className="shrink-0" /> GPS
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-primary text-[11px] sm:text-xs py-1.5 sm:py-2 px-2.5 sm:px-3.5 font-bold gap-1 shrink-0"
                        >
                          <span>Elegir</span>
                          <span>→</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Inline New Customer Creation Form - 100% Mobile Responsive */
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2.5">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                      <User size={19} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-lg font-extrabold text-slate-900 dark:text-white m-0">
                        Registrar Nuevo Cliente
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5 leading-snug">
                        Se guardará en la cartera de clientes y se iniciará la nota de inmediato.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingCustomer(false);
                      setErrorMessage('');
                    }}
                    className="btn btn-secondary text-xs py-2 px-3 w-full sm:w-auto justify-center shrink-0"
                  >
                    ← Volver al Buscador
                  </button>
                </div>

                <form onSubmit={handleCreateAndSelectCustomer}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mb-4 sm:mb-5">
                    <div>
                      <label className="form-label text-[11px] sm:text-xs">Nombre del Cliente / Negocio *</label>
                      <input
                        type="text"
                        className="form-input text-xs sm:text-sm h-10 sm:h-11 w-full"
                        placeholder="Ej. FERRETERÍA CENTRAL o COMERCIAL BOLIVIA"
                        value={newCustomerName}
                        onChange={e => setNewCustomerName(e.target.value)}
                        autoFocus
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label text-[11px] sm:text-xs">Teléfono / WhatsApp</label>
                      <input
                        type="text"
                        className="form-input text-xs sm:text-sm h-10 sm:h-11 w-full"
                        placeholder="Ej. 70012345"
                        value={newCustomerPhone}
                        onChange={e => setNewCustomerPhone(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label text-[11px] sm:text-xs">Dirección / Mercado del Cliente</label>
                      <input
                        type="text"
                        className="form-input text-xs sm:text-sm h-10 sm:h-11 w-full"
                        placeholder="Ej. MERCADO LA PAMPA / PASILLO 3"
                        value={newCustomerAddress}
                        onChange={e => setNewCustomerAddress(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label text-[11px] sm:text-xs">Link Ubicación Google Maps / GPS (Opcional)</label>
                      <input
                        type="text"
                        className="form-input text-xs sm:text-sm h-10 sm:h-11 w-full"
                        placeholder="https://maps.app.goo.gl/... o enlace GPS"
                        value={newCustomerLocationUrl}
                        onChange={e => setNewCustomerLocationUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreatingCustomer(false)}
                      className="btn btn-secondary py-2.5 px-4 text-xs sm:text-sm font-bold w-full sm:w-auto justify-center"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingCustomer}
                      className="btn btn-primary py-2.5 px-4 sm:px-6 font-black text-xs sm:text-sm gap-2 w-full sm:w-auto justify-center"
                    >
                      {isSavingCustomer ? (
                        <span>Guardando...</span>
                      ) : (
                        <>
                          <Check size={16} className="shrink-0" />
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
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
              {/* Locked Customer Header Card */}
              <div className="bg-gradient-to-r from-cyan-50/80 to-indigo-50/80 dark:from-cyan-950/30 dark:to-indigo-950/30 border border-cyan-200 dark:border-cyan-500/40 rounded-2xl p-3 sm:p-4 flex justify-between items-center flex-wrap gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs sm:text-base shadow-md shadow-cyan-500/30 shrink-0">
                    {(selectedCustomer.name || 'C').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">
                        {selectedCustomer.name}
                      </span>
                      <span className="badge badge-indigo text-[10px] font-mono">
                        {selectedCustomer.code || `CLI-${selectedCustomer.id}`}
                      </span>
                    </div>
                    <div className="flex gap-2.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                      {selectedCustomer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-emerald-500" /> {selectedCustomer.phone}
                        </span>
                      )}
                      {selectedCustomer.address && (
                        <span className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-none">
                          <MapPin size={12} className="text-cyan-500 shrink-0" /> <span className="truncate">{selectedCustomer.address}</span>
                        </span>
                      )}
                      {(selectedCustomer.store_location_url || deliveryLocationUrl) && (
                        <a 
                          href={deliveryLocationUrl || selectedCustomer.store_location_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink size={12} /> Ver Maps
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
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                  title="Cambiar cliente para esta nota"
                >
                  <RefreshCw size={12} />
                  <span>Cambiar Cliente</span>
                </button>
              </div>

              {/* General Note Logistics & Dates Bar */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 sm:p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
                  {/* Encargado / Vendedor */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="form-label text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Vendedor / Encargado</label>
                    <select 
                      className="form-select text-xs font-bold h-10 w-full" 
                      style={{ padding: '6px 12px', lineHeight: '1.3' }}
                      value={sellerName} 
                      onChange={e => setSellerName(e.target.value)}
                    >
                      {sellerName && !['DANIEL', 'JAIME', 'MOSTRADOR TIENDA', 'VENTAS MAYORISTA'].includes(sellerName) && (
                        <option value={sellerName}>{sellerName}</option>
                      )}
                      <option value="DANIEL">DANIEL</option>
                      <option value="JAIME">JAIME</option>
                      <option value="MOSTRADOR TIENDA">MOSTRADOR TIENDA</option>
                      <option value="VENTAS MAYORISTA">VENTAS MAYORISTA</option>
                    </select>
                  </div>

                  {/* Fecha Emisión */}
                  <div>
                    <label className="form-label text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Fecha de Venta</label>
                    <input 
                      type="date" 
                      className="form-input text-xs font-bold h-10 w-full" 
                      style={{ padding: '6px 10px', lineHeight: '1.3' }}
                      value={date} 
                      onChange={e => setDate(e.target.value)}
                      required 
                    />
                  </div>

                  {/* Fecha Límite de Pago */}
                  <div>
                    <label className="form-label text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Vencimiento (Crédito)</label>
                    <input 
                      type="date" 
                      className="form-input text-xs font-bold h-10 w-full" 
                      style={{ padding: '6px 10px', lineHeight: '1.3' }}
                      value={dueDate} 
                      onChange={e => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Items Table (Mixed Box / Unit) - 100% RESPONSIVE FOR MOBILE & DESKTOP */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 sm:p-5">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Boxes size={17} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-black text-cyan-700 dark:text-cyan-300 uppercase tracking-wide">
                      2. Productos ({items.length})
                    </span>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddItem}
                    className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                  >
                    <Plus size={14} />
                    <span>Agregar Producto</span>
                  </button>
                </div>

            {/* Items Dynamic Rows: Responsive Card on Mobile, Single Row on Desktop */}
            <div className="flex flex-col gap-3">
              {items.map((it, idx) => {
                const isBox = it.sale_mode === 'CAJA';
                const rowSubtotal = isBox 
                  ? (parseInt(it.boxes_count || 0, 10) * parseInt(it.units_per_box || 1, 10) * (parseFloat(it.unit_price) || 0))
                  : (parseInt(it.quantity || 0, 10) * (parseFloat(it.unit_price) || 0));

                return (
                  <div 
                    key={it.id} 
                    className="rounded-xl border border-slate-200 dark:border-slate-700/80 p-3 sm:p-3.5 bg-white dark:bg-slate-800/80 shadow-xs flex flex-col lg:flex-row lg:items-center gap-3 transition-colors"
                  >
                    {/* 1. Producto (Buscador Combobox) */}
                    <div className="flex-1 lg:flex-[2.5] min-w-0">
                      <div className="flex items-center justify-between mb-1 lg:mb-0.5">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          #{idx + 1} Producto ({it.stock_now ? `Stock: ${it.stock_now}` : 'Buscador'}) *
                        </label>
                        {/* Mobile delete button placed conveniently in top right */}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(it.id)}
                          className="lg:hidden p-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                          disabled={items.length <= 1}
                          title="Eliminar este producto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <ProductSearchCombobox 
                        products={products}
                        item={it}
                        onSelectProduct={(p) => handleSelectProduct(it.id, p)}
                        onClearProduct={() => handleClearProduct(it.id)}
                      />
                    </div>

                    {/* Mobile Grid for Quantities & Mode (On Desktop it flows inline) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:items-center gap-2.5 lg:gap-3">
                      {/* 2. Modalidad */}
                      <div className="lg:w-28">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                          Modalidad
                        </label>
                        <select 
                          className="form-select text-xs font-bold h-10 w-full"
                          value={it.sale_mode}
                          onChange={e => handleSaleModeChange(it.id, e.target.value)}
                          style={{ color: isBox ? '#0284c7' : '#d97706', padding: '6px 10px', lineHeight: '1.3' }}
                        >
                          <option value="CAJA">Caja</option>
                          <option value="UNIDAD">Unidad</option>
                        </select>
                      </div>

                      {/* 3. Cajas & U/Cj (o Cantidad Unidades) */}
                      {isBox ? (
                        <div className="col-span-1 sm:col-span-2 lg:w-36 grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                              Cajas
                            </label>
                            <input 
                              type="number" 
                              min="1"
                              className="form-input text-xs font-black text-center h-10 w-full"
                              style={{ padding: '6px 6px', lineHeight: '1.3' }}
                              value={it.boxes_count}
                              onChange={e => handleUpdateItem(it.id, 'boxes_count', e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                              U/Cj
                            </label>
                            <input 
                              type="number" 
                              min="1"
                              className="form-input text-xs font-bold text-center h-10 w-full"
                              style={{ padding: '6px 6px', lineHeight: '1.3' }}
                              value={it.units_per_box}
                              onChange={e => handleUpdateItem(it.id, 'units_per_box', e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="col-span-1 sm:col-span-2 lg:w-36">
                          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                            Cant. Unidades
                          </label>
                          <input 
                            type="number" 
                            min="1"
                            className="form-input text-xs font-black text-center h-10 w-full"
                            style={{ padding: '6px 8px', lineHeight: '1.3' }}
                            value={it.quantity}
                            onChange={e => handleUpdateItem(it.id, 'quantity', e.target.value)}
                            required
                          />
                        </div>
                      )}

                      {/* 4. Precio Unitario & Quick Chips */}
                      <div className="col-span-2 sm:col-span-1 lg:w-44">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            Precio Unit. (Bs)
                          </label>
                          {it.price_type && (
                            <span className="text-[10px] font-extrabold text-cyan-600 dark:text-cyan-400">
                              {it.price_type === 'caja' ? 'Caja' : it.price_type === 'mayor' ? 'Mayor' : it.price_type === 'especial' ? 'Esp' : 'Manual'}
                            </span>
                          )}
                        </div>
                        <input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          className="form-input text-xs font-black text-right h-9 w-full text-slate-900 dark:text-white" 
                          style={{ padding: '6px 10px', lineHeight: '1.3' }}
                          placeholder="0.00"
                          value={it.unit_price}
                          onChange={e => {
                            const val = e.target.value;
                            handleUpdateItem(it.id, {
                              unit_price: val,
                              price_type: 'manual'
                            });
                          }}
                          required
                        />
                        {/* Quick pricing chips */}
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {it.wholesale_price > 0 && (
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(it.id, { unit_price: it.wholesale_price, price_type: 'mayor' })}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                                it.price_type === 'mayor'
                                  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/30 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/50'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              May: {it.wholesale_price}
                            </button>
                          )}
                          {it.box_price > 0 && (
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(it.id, { unit_price: it.box_price, price_type: 'caja' })}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                                it.price_type === 'caja'
                                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/30 dark:text-amber-300 border border-amber-300 dark:border-amber-500/50'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              Caj: {it.box_price}
                            </button>
                          )}
                          {it.special_price > 0 && (
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(it.id, { unit_price: it.special_price, price_type: 'especial' })}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                                it.price_type === 'especial'
                                  ? 'bg-purple-100 text-purple-900 dark:bg-purple-500/30 dark:text-purple-300 border border-purple-300 dark:border-purple-500/50'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              Esp: {it.special_price}
                            </button>
                          )}
                          {it.sale_price > 0 && it.sale_price !== it.wholesale_price && it.sale_price !== it.box_price && (
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(it.id, { unit_price: it.sale_price, price_type: 'unit' })}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                                it.price_type === 'unit'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/30 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/50'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              Det: {it.sale_price}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 5. Alistar en & Subtotal */}
                    <div className="flex items-center justify-between lg:justify-end gap-3 pt-2.5 lg:pt-0 border-t border-slate-100 dark:border-slate-700/60 lg:border-t-0">
                      {/* Alistar en */}
                      <div className="w-36 sm:w-40 lg:w-36">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                          Alistar en:
                        </label>
                        <select 
                          className="form-select text-xs font-bold h-10 w-full"
                          style={{ padding: '6px 10px', lineHeight: '1.3' }}
                          value={it.warehouse_source || 'ALMACEN'}
                          onChange={e => handleUpdateItem(it.id, 'warehouse_source', e.target.value)}
                        >
                          <option value="ALMACEN">Almacén</option>
                          <option value="TIENDA">Tienda</option>
                          <option value="CASA CUBANO">C. Cubano</option>
                        </select>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right lg:w-28 shrink-0">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                          Subtotal
                        </label>
                        <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          Bs {rowSubtotal.toFixed(2)}
                        </div>
                        {isBox && (
                          <span className="text-[10px] text-slate-400 block">
                            {(parseInt(it.boxes_count || 0, 10) * parseInt(it.units_per_box || 1, 10))} u.
                          </span>
                        )}
                      </div>

                      {/* Desktop Trash button */}
                      <div className="hidden lg:flex items-center justify-center shrink-0 pt-4">
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(it.id)}
                          className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                          disabled={items.length <= 1}
                          title="Eliminar fila"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Warehouse batch helpers */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
              <span>Total de productos en nota: <strong className="text-slate-900 dark:text-white font-extrabold">{items.length}</strong></span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500">Alistar todos en:</span>
                <button
                  type="button"
                  onClick={() => setItems(prev => prev.map(it => ({ ...it, warehouse_source: 'ALMACEN' })))}
                  className="px-2 py-1 rounded-md text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/40 hover:bg-emerald-100 cursor-pointer"
                >
                  Todo Almacén
                </button>
                <button
                  type="button"
                  onClick={() => setItems(prev => prev.map(it => ({ ...it, warehouse_source: 'TIENDA' })))}
                  className="px-2 py-1 rounded-md text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/40 hover:bg-amber-100 cursor-pointer"
                >
                  Todo Tienda
                </button>
                <button
                  type="button"
                  onClick={() => setItems(prev => prev.map(it => ({ ...it, warehouse_source: 'CASA CUBANO' })))}
                  className="px-2 py-1 rounded-md text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/40 hover:bg-purple-100 cursor-pointer"
                >
                  Todo Cubano
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Payments / Abonos & Liquidation */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4 mb-5">
            {/* Left: Abonos a Cuenta & Observaciones */}
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xs">
              {/* Título de la sección */}
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={18} className="text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs sm:text-sm font-black text-cyan-700 dark:text-cyan-300 uppercase tracking-wide">
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
                    {existingPayments.length > 0 ? 'Registrar Abono Adicional:' : 'Registrar Pago / Abono Inicial:'}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddNewPayment}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '3px 9px', color: 'var(--cyan-primary)', borderColor: 'rgba(6, 182, 212, 0.4)', gap: '4px', fontWeight: 700 }}
                  >
                    <Plus size={12} />
                    <span>Agregar Abono</span>
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
                  <div className="flex flex-col gap-3">
                    {newPayments.map(p => {
                      const totalRowMixto = (parseFloat(p.amount_cash) || 0) + (parseFloat(p.amount_qr) || 0) + (parseFloat(p.amount_discount) || 0);

                      return (
                        <div 
                          key={p.tempId} 
                          className="bg-cyan-50/60 dark:bg-cyan-500/10 border border-dashed border-cyan-400/70 dark:border-cyan-500/40 rounded-xl p-3 flex flex-col gap-2.5"
                        >
                          {/* Encabezado: Cuenta QR + Cobró + Fecha + Eliminar */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                            <div className="sm:col-span-5">
                              <label className="text-[11px] font-extrabold text-slate-700 dark:text-cyan-300 uppercase block mb-1">
                                ¿De quién es la Cuenta QR?
                              </label>
                              <select 
                                className="form-select text-xs font-extrabold py-1.5 px-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg w-full h-[36px]"
                                value={p.qr_account || 'CUENTA JAIME'}
                                onChange={e => handleUpdateNewPayment(p.tempId, 'qr_account', e.target.value)}
                              >
                                <option value="CUENTA JAIME">CUENTA JAIME</option>
                                <option value="CUENTA BETHO">CUENTA BETHO</option>
                              </select>
                            </div>

                            <div className="sm:col-span-3">
                              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                                Cobrado por:
                              </label>
                              <input
                                type="text"
                                readOnly
                                value={p.registered_by || sellerName || 'SESIÓN ACTIVA'}
                                className="form-input text-xs font-black py-1.5 px-2.5 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg w-full h-[36px]"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                                Fecha Pago:
                              </label>
                              <input 
                                type="date" 
                                className="form-input text-xs py-1.5 px-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg w-full h-[36px]"
                                value={p.payment_date || date}
                                onChange={e => handleUpdateNewPayment(p.tempId, 'payment_date', e.target.value)}
                              />
                            </div>

                            <div className="sm:col-span-1 flex justify-end">
                              <button 
                                type="button" 
                                onClick={() => handleRemoveNewPayment(p.tempId)}
                                className="h-[36px] w-[36px] rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center cursor-pointer"
                                title="Descartar este abono"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Montos Efectivo + QR + Rebaja */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="text-[11px] font-extrabold text-slate-700 dark:text-amber-300 uppercase block mb-1">
                                Monto Efectivo (Bs)
                              </label>
                              <input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                inputMode="decimal"
                                className="form-input text-sm font-black py-1.5 px-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg w-full h-[38px]" 
                                placeholder="0.00"
                                value={p.amount_cash || ''}
                                onChange={e => handleUpdateNewPayment(p.tempId, 'amount_cash', e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-extrabold text-slate-700 dark:text-cyan-300 uppercase block mb-1">
                                Monto QR ({p.qr_account || 'CUENTA JAIME'}) (Bs)
                              </label>
                              <input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                inputMode="decimal"
                                className="form-input text-sm font-black py-1.5 px-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg w-full h-[38px]" 
                                placeholder="0.00"
                                value={p.amount_qr || ''}
                                onChange={e => handleUpdateNewPayment(p.tempId, 'amount_qr', e.target.value)}
                              />
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                              <label className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 uppercase block mb-1">
                                Rebaja / Descuento (Bs)
                              </label>
                              <input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                inputMode="decimal"
                                className="form-input text-sm font-black py-1.5 px-2.5 bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 rounded-lg w-full h-[38px]" 
                                placeholder="0.00"
                                value={p.amount_discount || ''}
                                onChange={e => handleUpdateNewPayment(p.tempId, 'amount_discount', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-1.5 border-t border-cyan-200/70 dark:border-cyan-500/20">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                              Total Liquidado {(parseFloat(p.amount_discount) || 0) > 0 ? '(Pago + Rebaja)' : '(Efectivo + QR)'}:
                            </span>
                            <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                              Bs {totalRowMixto.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
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
              <div className="mt-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span className="text-xs font-extrabold text-cyan-700 dark:text-cyan-400 uppercase tracking-wide">
                    Destino & Ubicación de Entrega
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="form-label text-[11px] mb-1">Lugar / Destino de Entrega *</label>
                    <select 
                      className="form-select text-xs font-semibold h-10 w-full"
                      style={{ padding: '6px 12px', lineHeight: '1.3' }}
                      value={deliveryType}
                      onChange={e => setDeliveryType(e.target.value)}
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
                    <label className="form-label text-[11px] mb-1">Dirección / Referencia de Destino</label>
                    <input 
                      type="text" 
                      className="form-input text-xs h-10 w-full" 
                      style={{ padding: '6px 12px', lineHeight: '1.3' }}
                      placeholder="Ej. MERCADO LA PAMPA / PASILLO 3"
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="form-label text-[11px] m-0">
                      Ubicación GPS / Google Maps (Opcional)
                    </label>
                    {deliveryLocationUrl && (
                      <a 
                        href={deliveryLocationUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink size={11} />
                        <span>Probar Mapa</span>
                      </a>
                    )}
                  </div>
                  <input 
                    type="text" 
                    className="form-input text-xs h-9 sm:h-10 py-1.5 px-2.5" 
                    placeholder="https://maps.app.goo.gl/... o coordenadas GPS"
                    value={deliveryLocationUrl}
                    onChange={e => setDeliveryLocationUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Right: Resumen Económico */}
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-3">
                  Liquidación de la Nota
                </span>

                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700/60 text-xs sm:text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Cajas / Unidades:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {totalBoxes} cajas ({totalUnits} unidades)
                  </span>
                </div>

                <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-700/60 text-sm sm:text-base">
                  <span className="font-black text-slate-800 dark:text-slate-200">TOTAL NOTA:</span>
                  <span className="font-black text-slate-900 dark:text-white font-mono text-xl sm:text-2xl">
                    Bs {totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700/60 text-xs sm:text-sm">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">A CUENTA (A/C):</span>
                  <div className="text-right">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-base">
                      Bs {totalPaid.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {existingPaidSum > 0 && (
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-300 font-medium">
                        Bs {existingPaidSum.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} registrado{newPaidSum > 0 ? ` + Bs ${newPaidSum.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} nuevo` : ''}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between py-3 border-b-2 border-slate-200 dark:border-slate-700 text-sm sm:text-base">
                  <span className={`font-black ${balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    SALDO PENDIENTE:
                  </span>
                  <span className={`font-black font-mono text-xl sm:text-2xl ${balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    Bs {balanceDue.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Status Indicator */}
              <div 
                className="mt-4 p-2.5 rounded-xl text-center font-black text-xs sm:text-sm tracking-wider uppercase border"
                style={{
                  background: noteStatusBg,
                  color: noteStatusColor,
                  borderColor: noteStatusBorder
                }}
              >
                ESTADO: {noteStatusLabel}
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl p-3 flex items-center gap-2 text-xs sm:text-sm text-rose-600 dark:text-rose-400">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}
          </div>

          {/* Footer Fijo y Compacto (No tapa el contenido al hacer scroll en celular) */}
          <div className="px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-row gap-2 sm:justify-end shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 justify-center cursor-pointer" 
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary py-2.5 px-4 sm:px-6 font-black text-xs sm:text-sm shadow-md shadow-cyan-900/20 gap-2 justify-center flex-1 sm:flex-none rounded-xl" 
              disabled={isSubmitting}
            >
              <Save size={16} />
              <span>
                {isSubmitting 
                  ? (noteToEdit ? 'Actualizando...' : 'Emitiendo...') 
                  : (noteToEdit ? 'Guardar Cambios en Nota' : 'Confirmar y Despachar Nota')}
              </span>
            </button>
          </div>
        </form>
        )}
      </div>
    </div>,
    document.body
  );
}
