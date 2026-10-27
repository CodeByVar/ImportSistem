import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Ship, 
  Truck, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Plus, 
  Trash2, 
  UserCheck, 
  Package, 
  Calendar, 
  MapPin, 
  Anchor,
  Clock,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Maximize2,
  Minimize2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';

export default function ContainerPrelistaModal({ 
  isOpen, 
  onClose, 
  container, 
  onUpdateContainer,
  customers = []
}) {
  const [activeTab, setActiveTab] = useState('prelist'); // 'prelist', 'reservations', 'logistics'
  const [items, setItems] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Excel upload state
  const [excelFile, setExcelFile] = useState(null);
  const [excelPreview, setExcelPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Multi-product bulk reservation state
  const [showBulkResModal, setShowBulkResModal] = useState(false);
  const [bulkResCustomerName, setBulkResCustomerName] = useState('');
  const [bulkResCustomerPhone, setBulkResCustomerPhone] = useState('');
  const [bulkResNotes, setBulkResNotes] = useState('');
  const [bulkResItems, setBulkResItems] = useState([]);
  const [bulkItemSearch, setBulkItemSearch] = useState('');
  const [isSubmittingBulkRes, setIsSubmittingBulkRes] = useState(false);

  // Single-item reservation state (compatibility)
  const [selectedItemForRes, setSelectedItemForRes] = useState(null);
  const [resCustomerName, setResCustomerName] = useState('');
  const [resCustomerPhone, setResCustomerPhone] = useState('');
  const [resBoxes, setResBoxes] = useState(1);
  const [resPrice, setResPrice] = useState('');
  const [resNotes, setResNotes] = useState('');
  const [isSubmittingRes, setIsSubmittingRes] = useState(false);

  // Receive / Warehousing state
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiveWarehouse, setReceiveWarehouse] = useState('CASA CUBANO');
  const [isReceiving, setIsReceiving] = useState(false);
  const [receiveSuccessMsg, setReceiveSuccessMsg] = useState('');
  const [customerList, setCustomerList] = useState(customers || []);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveUpdatePrices, setReceiveUpdatePrices] = useState(false);

  // Inline editing state
  const [editingItemId, setEditingItemId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (!customerList.length) {
        fetch('/api/customers')
          .then(r => r.json())
          .then(data => {
            if (data.success && data.data) {
              setCustomerList(data.data);
            }
          })
          .catch(err => console.error(err));
      }
    }
  }, [isOpen]);

  // Status updating state
  const [currentStatus, setCurrentStatus] = useState(container?.status || 'mar_transito');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (container && isOpen) {
      setCurrentStatus(container.status || 'mar_transito');
      fetchContainerItems();
    }
  }, [container, isOpen]);

  const fetchContainerItems = async () => {
    if (!container?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/containers/${container.id}/items`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setReservations(data.reservations || []);
      }
    } catch (err) {
      console.error('Error fetching container items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !container) return null;

  const isMaritimo = container.transport_type !== 'TERRESTRE';

  // Compute metrics
  const totalBoxes = items.reduce((acc, it) => acc + (Number(it.boxes_count) || 0), 0);
  const totalUnits = items.reduce((acc, it) => acc + (Number(it.total_units) || 0), 0);
  const totalReservedBoxes = items.reduce((acc, it) => acc + (Number(it.reserved_boxes) || 0), 0);
  const totalAvailableBoxes = Math.max(0, totalBoxes - totalReservedBoxes);

  // Status display
  const getStatusBadge = (st) => {
    switch (st) {
      case 'mar_transito':
        return { label: 'En Altamar', color: 'badge-cyan', icon: Ship, desc: 'Barco en navegación' };
      case 'puerto_aduana':
        return { label: 'En Puerto / Aduana', color: 'badge-amber', icon: Anchor, desc: 'Trámites de puerto y desaduanaje' };
      case 'camion_transito':
        return { label: 'En Camión (Tránsito)', color: 'badge-purple', icon: Truck, desc: 'En ruta hacia bodega' };
      case 'aduana_frontera':
        return { label: 'En Aduana Frontera', color: 'badge-amber', icon: AlertCircle, desc: 'Revisión en frontera' };
      case 'recibido':
        return { label: 'Recibido en Almacén', color: 'badge-emerald', icon: CheckCircle2, desc: 'Descargado en stock' };
      default:
        return { label: st, color: 'badge-cyan', icon: Ship, desc: '' };
    }
  };

  const handleStatusChange = async (newStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/containers/${container.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentStatus(newStatus);
        if (onUpdateContainer) onUpdateContainer();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Excel File Parsing matching User's Sheet columns
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    setUploadError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Prefer first sheet or active sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with raw headers
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (rawJson.length < 2) {
          throw new Error('La hoja está vacía o no tiene datos');
        }

        // Find header row (looks for row containing DETALLE or CODIGO)
        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(10, rawJson.length); i++) {
          const rowStr = rawJson[i].map(c => String(c).toUpperCase()).join(' ');
          if (rowStr.includes('DETALLE') || rowStr.includes('CODIGO') || rowStr.includes('CAJAS')) {
            headerRowIdx = i;
            break;
          }
        }

        const headers = rawJson[headerRowIdx].map(h => String(h).trim().toUpperCase());
        
        // Helper to find column index
        const findCol = (...names) => {
          return headers.findIndex(h => names.some(n => h.includes(n.toUpperCase())));
        };

        const colNum = findCol('Nº', 'N°', 'NUM');
        const colDetalle = findCol('DETALLE', 'DESCRIPCION', 'PRODUCTO', 'DESCRIPCIÓN');
        const colCodigo = findCol('CODIGO', 'CÓDIGO', 'SKU', 'COD');
        const colCajas = findCol('Q. DE CAJAS', 'Q DE CAJAS', 'CAJAS', 'CANT CAJAS');
        const colPorCaja = findCol('Q. POR CAJA', 'Q POR CAJA', 'POR CAJA', 'UNID/CAJA');
        const colUnMed = findCol('UN/MED', 'UNIDAD', 'MEDIDA');
        const colCostoAnt = findCol('COSTO ANT', 'COSTO ANTERIOR', 'P. COSTO ANT');
        const colPrecioAnt = findCol('PRECIO ANT', 'PRECIO ANTERIOR', 'P. ANT');
        const colCosto = headers.findIndex((h, idx) => {
          if (idx === colCostoAnt) return false;
          return ['COSTO', 'COSTO UNIT', 'P. COSTO'].some(n => h.includes(n)) && !h.includes('ANT');
        });
        const colMargen = findCol('%', 'MARGEN', 'UTILIDAD');
        const colPriceMayor = findCol('PRECIO MAYOR', 'P. MAYOR', 'MAYOR');
        const colPriceCaja = findCol('PRECIO CAJA', 'P. CAJA');
        const colPriceEsp = findCol('PRECIO ESPECIAL', 'P. ESPECIAL', 'ESPECIAL');
        const colPriceDesc25 = findCol('CON DECUENTO', 'DESCUENTO 25%');
        const colPriceAjuste20 = findCol('AJUSTE POR CAJA', 'AJUSTE');
        const colReserva = findCol('RESERVA', 'RESERVAS');
        const colObs = findCol('OBSERVACIONES', 'OBS');

        const parsedRows = [];
        for (let r = headerRowIdx + 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;

          const detalle = colDetalle !== -1 ? String(row[colDetalle] || '').trim() : '';
          const codigo = colCodigo !== -1 ? String(row[colCodigo] || '').trim().toUpperCase() : '';

          // Skip empty rows
          if (!detalle && !codigo) continue;

          const parseNum = (val) => {
            if (val === undefined || val === null || val === '') return 0;
            if (typeof val === 'number') return val;
            const clean = String(val).replace(/,/g, '.').replace(/[^\d.-]/g, '');
            return parseFloat(clean) || 0;
          };

          const cajas = colCajas !== -1 ? parseNum(row[colCajas]) : 0;
          const porCaja = colPorCaja !== -1 ? Math.max(1, parseNum(row[colPorCaja])) : 1;
          const totalUnits = cajas * porCaja;
          const costo = colCosto !== -1 ? parseNum(row[colCosto]) : 0;
          const costoAnt = colCostoAnt !== -1 ? parseNum(row[colCostoAnt]) : 0;
          const precioAnt = colPrecioAnt !== -1 ? parseNum(row[colPrecioAnt]) : 0;
          const margen = colMargen !== -1 ? parseNum(row[colMargen]) : 0;
          const priceMayor = colPriceMayor !== -1 ? parseNum(row[colPriceMayor]) : 0;
          const priceCaja = colPriceCaja !== -1 ? parseNum(row[colPriceCaja]) : 0;
          const priceEsp = colPriceEsp !== -1 ? parseNum(row[colPriceEsp]) : 0;
          const priceDesc25 = colPriceDesc25 !== -1 ? parseNum(row[colPriceDesc25]) : 0;
          const priceAjuste20 = colPriceAjuste20 !== -1 ? parseNum(row[colPriceAjuste20]) : 0;
          const reserva = colReserva !== -1 ? parseNum(row[colReserva]) : 0;
          const obs = colObs !== -1 ? String(row[colObs] || '').trim() : '';
          const num = colNum !== -1 ? parseNum(row[colNum]) : parsedRows.length + 1;

          parsedRows.push({
            num: num || parsedRows.length + 1,
            code: codigo,
            name: detalle,
            boxes: cajas,
            perBox: porCaja,
            totalUnits,
            measure: colUnMed !== -1 ? String(row[colUnMed] || 'UNI').trim() : 'UNI',
            cost: costo,
            previous_cost: costoAnt,
            previous_price: precioAnt,
            margin: margen,
            priceMayor,
            priceCaja,
            priceSpecial: priceEsp,
            priceDesc25,
            priceAjuste20,
            reserved: reserva,
            notes: obs,
            order_confirmed_date: new Date().toISOString()
          });
        }

        if (parsedRows.length === 0) {
          throw new Error('No se detectaron productos válidos con Código y Detalle en la hoja.');
        }

        setExcelPreview(parsedRows);
      } catch (err) {
        setUploadError(err.message || 'Error al procesar el archivo Excel');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSaveExcelPrelista = async () => {
    if (!excelPreview || excelPreview.length === 0) return;
    setIsUploading(true);
    setUploadError('');

    try {
      const res = await fetch(`/api/containers/${container.id}/items/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: excelPreview,
          replaceExisting: true
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Error al guardar la prelista');
      }

      setExcelPreview(null);
      setExcelFile(null);
      fetchContainerItems();
      if (onUpdateContainer) onUpdateContainer();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Multi-Product Pre-Reservation Handlers
  const handleOpenBulkResModal = () => {
    setBulkResCustomerName('');
    setBulkResCustomerPhone('');
    setBulkResNotes('');
    setBulkResItems([]);
    setBulkItemSearch('');
    setShowBulkResModal(true);
  };

  const handleSelectBulkCustomer = (cust) => {
    setBulkResCustomerName(cust.name);
    setBulkResCustomerPhone(cust.phone || '');
  };

  const handleAddProductToBulkRes = (item) => {
    if (bulkResItems.some(i => i.container_item_id === item.id)) {
      alert('Este producto ya está en la lista de la reserva');
      return;
    }
    const alreadyRes = Number(item.live_reserved_boxes || item.reserved_boxes || 0);
    const avail = Math.max(0, (Number(item.boxes_count) || 0) - alreadyRes);
    if (avail <= 0) {
      alert(`No quedan cajas disponibles para reservar del producto ${item.product_code}`);
      return;
    }
    const defaultPrice = Number(item.price_caja || item.price_mayor || 0);
    setBulkResItems(prev => [
      ...prev,
      {
        container_item_id: item.id,
        product_code: item.product_code,
        product_name: item.product_name,
        units_per_box: Number(item.units_per_box) || 1,
        total_boxes: Number(item.boxes_count) || 0,
        available_boxes: avail,
        reserved_boxes: 1,
        price_agreed: defaultPrice
      }
    ]);
  };

  const handleUpdateBulkItemBoxes = (index, val) => {
    const item = bulkResItems[index];
    if (!item) return;
    const max = item.available_boxes;
    const parsed = parseInt(val, 10);
    const num = isNaN(parsed) ? 1 : Math.max(1, Math.min(max, parsed));
    setBulkResItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], reserved_boxes: num };
      return copy;
    });
  };

  const handleUpdateBulkItemPrice = (index, val) => {
    setBulkResItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], price_agreed: val };
      return copy;
    });
  };

  const handleRemoveBulkItem = (index) => {
    setBulkResItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitBulkReservation = async (e) => {
    if (e) e.preventDefault();
    if (!bulkResCustomerName.trim()) {
      alert('Por favor ingresa o selecciona el nombre del cliente');
      return;
    }
    if (bulkResItems.length === 0) {
      alert('Debes agregar al menos un producto a la reserva');
      return;
    }

    setIsSubmittingBulkRes(true);
    try {
      const payload = {
        customer_name: bulkResCustomerName.trim().toUpperCase(),
        customer_phone: bulkResCustomerPhone.trim(),
        notes: bulkResNotes.trim(),
        items: bulkResItems.map(it => ({
          container_item_id: it.container_item_id,
          reserved_boxes: Number(it.reserved_boxes),
          reserved_units: Number(it.reserved_boxes) * Number(it.units_per_box),
          price_agreed: Number(it.price_agreed) || 0
        }))
      };

      const res = await fetch(`/api/containers/${container.id}/reservations/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error al guardar la reserva');

      setShowBulkResModal(false);
      fetchContainerItems();
      if (onUpdateContainer) onUpdateContainer();
      setActiveTab('reservations');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmittingBulkRes(false);
    }
  };

  // Pre-Reservation handlers
  const handleOpenReservation = (item) => {
    setSelectedItemForRes(item);
    setResCustomerName('');
    setResCustomerPhone('');
    setResBoxes(1);
    setResPrice(item.price_caja || item.price_mayor || '');
    setResNotes('');
  };

  const handleSelectExistingCustomer = (cust) => {
    setResCustomerName(cust.name);
    setResCustomerPhone(cust.phone || '');
  };

  const handleSubmitReservation = async (e) => {
    e.preventDefault();
    if (!selectedItemForRes || !resCustomerName.trim() || Number(resBoxes) <= 0) return;

    setIsSubmittingRes(true);
    try {
      const res = await fetch(`/api/containers/${container.id}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          container_item_id: selectedItemForRes.id,
          customer_name: resCustomerName.trim().toUpperCase(),
          customer_phone: resCustomerPhone.trim(),
          reserved_boxes: Number(resBoxes),
          reserved_units: Number(resBoxes) * (selectedItemForRes.units_per_box || 1),
          price_agreed: Number(resPrice) || 0,
          notes: resNotes.trim()
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Error al guardar la pre-reserva');
      }

      setSelectedItemForRes(null);
      fetchContainerItems();
      if (onUpdateContainer) onUpdateContainer();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmittingRes(false);
    }
  };

  const handleDeleteReservation = async (resId) => {
    if (!confirm('¿Seguro de cancelar esta pre-reserva? Se liberarán las cajas para venta.')) return;
    try {
      const res = await fetch(`/api/containers/${container.id}/reservations/${resId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchContainerItems();
        if (onUpdateContainer) onUpdateContainer();
      }
    } catch (err) {
      alert('Error al cancelar reserva: ' + err.message);
    }
  };

  // Inline editing handlers
  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    setEditValues({
      boxes_count: item.boxes_count ?? '',
      units_per_box: item.units_per_box ?? '',
      unit_cost: item.unit_cost ?? '',
      previous_cost: item.previous_cost ?? '',
      margin_percent: item.margin_percent ?? '',
      price_mayor: item.price_mayor ?? '',
      price_caja: item.price_caja ?? '',
      price_special: item.price_special ?? '',
      price_discount_25: item.price_discount_25 ?? '',
      price_adjustment_20: item.price_adjustment_20 ?? '',
    });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditValues({});
  };

  const handleSaveItemEdit = async (item) => {
    setIsSavingItem(true);
    try {
      const payload = {};
      Object.entries(editValues).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) {
          payload[k] = Number(v);
        }
      });
      // Compute total_units from edited boxes and perBox
      const boxes = payload.boxes_count ?? item.boxes_count;
      const perBox = payload.units_per_box ?? item.units_per_box;
      payload.total_units = Number(boxes) * Number(perBox);

      const res = await fetch(`/api/containers/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error al guardar');
      setEditingItemId(null);
      setEditValues({});
      fetchContainerItems();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setIsSavingItem(false);
    }
  };

  // Confirm arrival and warehouse receiving
  const handleReceiveContainer = async (overrideUpdatePrices) => {
    const shouldUpdatePrices = overrideUpdatePrices !== undefined ? overrideUpdatePrices : receiveUpdatePrices;

    setIsReceiving(true);
    setReceiveSuccessMsg('');
    try {
      const res = await fetch(`/api/containers/${container.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          arrival_date: receiveDate,
          warehouse: receiveWarehouse,
          update_prices: shouldUpdatePrices
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Error al ingresar el contenedor');
      }

      setReceiveSuccessMsg(data.message);
      setCurrentStatus('recibido');
      setShowReceiveModal(false);
      fetchContainerItems();
      if (onUpdateContainer) onUpdateContainer();
      alert(data.message);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsReceiving(false);
    }
  };

  // Filter items
  const filteredItems = items.filter(it => {
    const q = searchTerm.toLowerCase();
    return (
      it.product_code?.toLowerCase().includes(q) ||
      it.product_name?.toLowerCase().includes(q) ||
      it.notes?.toLowerCase().includes(q)
    );
  });

  const currBadge = getStatusBadge(currentStatus);
  const StatusIcon = currBadge.icon;

  return (
    <div className="modal-overlay" style={{ padding: isFullScreen ? 0 : '14px', alignItems: isFullScreen ? 'stretch' : 'center' }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: isFullScreen ? '100vw' : '1720px', 
          width: isFullScreen ? '100vw' : '97vw', 
          height: isFullScreen ? '100vh' : '95vh', 
          maxHeight: isFullScreen ? '100vh' : '95vh',
          borderRadius: isFullScreen ? '0px' : '16px',
          display: 'flex', 
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: isMaritimo ? 'rgba(6, 182, 212, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              border: `1px solid ${isMaritimo ? 'rgba(6, 182, 212, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isMaritimo ? 'var(--cyan-primary)' : '#f59e0b'
            }}>
              {isMaritimo ? <Ship size={25} /> : <Truck size={25} />}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 className="font-heading mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.5px' }}>
                  {container.tracking_number}
                </h3>
                <span className={`badge ${currBadge.color}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                  <StatusIcon size={13} /> {currBadge.label}
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  background: isMaritimo ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: isMaritimo ? '#38bdf8' : '#fbbf24',
                  border: '1px solid var(--border-subtle)',
                  fontWeight: 600
                }}>
                  {isMaritimo ? '🚢 Marítimo + Camión' : '🚛 Camión Directo'}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                {container.shipping_line} • Origen: <strong style={{ color: '#cbd5e1' }}>{container.origin_country}</strong>
                {container.port_name && ` • Puerto: ${container.port_name}`}
                {container.truck_plate && ` • Camión: ${container.truck_plate}`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Quick status dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cambiar Estado:</span>
              <select
                className="form-select"
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isUpdatingStatus}
                style={{ padding: '6px 12px', fontSize: '0.78rem', minWidth: '170px' }}
              >
                {isMaritimo ? (
                  <>
                    <option value="mar_transito">🌊 En Altamar</option>
                    <option value="puerto_aduana">⚓ En Puerto / Aduana</option>
                    <option value="camion_transito">🚛 En Camión hacia Almacén</option>
                    <option value="recibido">✅ Recibido en Almacén</option>
                  </>
                ) : (
                  <>
                    <option value="camion_transito">🚛 En Tránsito Terrestre</option>
                    <option value="aduana_frontera">🛂 En Aduana Frontera</option>
                    <option value="recibido">✅ Recibido en Almacén</option>
                  </>
                )}
              </select>
            </div>

            {/* Toggle Full Screen / Expand */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="btn btn-secondary"
              title={isFullScreen ? "Restaurar tamaño normal" : "Maximizar a pantalla completa"}
              style={{
                padding: '6px 10px',
                border: '1px solid var(--border-glass)',
                background: isFullScreen ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                color: isFullScreen ? '#818cf8' : '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              <span style={{ display: 'none', md: 'inline' }}>{isFullScreen ? 'Reducir' : 'Expandir'}</span>
            </button>

            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px 8px', border: 'none' }} title="Cerrar">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Top KPI Metrics Bar */}
        <div style={{
          padding: '12px 24px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Items en Prelista:</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              {items.length} productos
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Cajas en Camino:</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>
              {formatNumber(totalBoxes)} cajas
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Unidades Totales:</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
              {formatNumber(totalUnits)} unid.
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cajas Pre-Reservadas:</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
              {formatNumber(totalReservedBoxes)} cajas ({reservations.length} clientes)
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Disponibles para Preventa:</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
              {formatNumber(totalAvailableBoxes)} cajas
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.4)'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('prelist')}
              style={{
                padding: '12px 18px',
                borderBottom: activeTab === 'prelist' ? '2px solid var(--cyan-primary)' : '2px solid transparent',
                color: activeTab === 'prelist' ? '#38bdf8' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.84rem',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FileSpreadsheet size={16} />
              <span>📋 Prelista de Mercadería ({items.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('reservations')}
              style={{
                padding: '12px 18px',
                borderBottom: activeTab === 'reservations' ? '2px solid #f59e0b' : '2px solid transparent',
                color: activeTab === 'reservations' ? '#fbbf24' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.84rem',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <UserCheck size={16} />
              <span>👥 Pre-Reservas Activas ({reservations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('logistics')}
              style={{
                padding: '12px 18px',
                borderBottom: activeTab === 'logistics' ? '2px solid #10b981' : '2px solid transparent',
                color: activeTab === 'logistics' ? '#34d399' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.84rem',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={16} />
              <span>📥 Recepción & Descarga en Almacén</span>
            </button>
          </div>

          {activeTab === 'prelist' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '7px 14px' }}
                title="Cargar o actualizar la prelista desde un archivo Excel"
              >
                <Upload size={14} />
                <span>📥 {items.length > 0 ? 'Actualizar / Cargar Excel' : 'Subir Prelista (Excel)'}</span>
              </button>

              {items.length > 0 && (
                <>
                  {currentStatus !== 'recibido' && (
                    <button
                      onClick={handleOpenBulkResModal}
                      className="btn"
                      style={{
                        fontSize: '0.78rem',
                        padding: '7px 15px',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#ffffff',
                        fontWeight: 700,
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 2px 10px rgba(245, 158, 11, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                      title="Registrar reserva de clientes antes de que llegue la mercadería"
                    >
                      <UserCheck size={14} />
                      <span>📌 Hacer Reserva</span>
                    </button>
                  )}

                  {currentStatus === 'recibido' ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '8px',
                      color: '#34d399',
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}>
                      <CheckCircle2 size={15} />
                      <span>✅ Mercadería en Stock</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowReceiveModal(true)}
                      className="btn"
                      style={{
                        fontSize: '0.78rem',
                        padding: '7px 16px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff',
                        fontWeight: 700,
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        cursor: 'pointer'
                      }}
                      title="Subir cantidades al inventario físico real y Kardex"
                    >
                      <CheckCircle2 size={15} />
                      <span>📥 Subir a Stock / Almacén</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Tab 1: Prelista */}
        {activeTab === 'prelist' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px 24px' }}>
            
            {/* Excel Preview Modal / Alert if file loaded */}
            {excelPreview && (
              <div style={{
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyan-primary)', fontWeight: 700 }}>
                    <FileSpreadsheet size={18} />
                    <span>Vista previa del Excel: {excelFile?.name} ({excelPreview.length} filas detectadas)</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => { setExcelPreview(null); setExcelFile(null); }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveExcelPrelista}
                      className="btn btn-primary"
                      disabled={isUploading}
                      style={{ fontSize: '0.78rem', padding: '6px 16px' }}
                    >
                      {isUploading ? 'Guardando...' : 'Confirmar y Guardar Prelista'}
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                  <table className="table" style={{ fontSize: '0.75rem', width: '100%' }}>
                    <thead>
                      <tr>
                        <th>N°</th>
                        <th>Código</th>
                        <th>Detalle</th>
                        <th>Cajas</th>
                        <th>Unid/Caja</th>
                        <th>Total Unid</th>
                        <th>Costo ($)</th>
                        <th>P. Mayor</th>
                        <th>P. Caja</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excelPreview.slice(0, 10).map((r, i) => (
                        <tr key={i}>
                          <td className="mono">{r.num}</td>
                          <td className="mono" style={{ fontWeight: 700, color: 'var(--cyan-primary)' }}>{r.code}</td>
                          <td>{r.name}</td>
                          <td className="mono">{r.boxes}</td>
                          <td className="mono">{r.perBox}</td>
                          <td className="mono" style={{ fontWeight: 700 }}>{r.totalUnits}</td>
                          <td className="mono">{r.cost}</td>
                          <td className="mono">{r.priceMayor}</td>
                          <td className="mono">{r.priceCaja}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {excelPreview.length > 10 && (
                    <div style={{ textAlign: 'center', padding: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      ... y {excelPreview.length - 10} filas más.
                    </div>
                  )}
                </div>
              </div>
            )}

            {uploadError && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '14px',
                fontSize: '0.8rem',
                color: '#fb7185',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Filter toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Buscar por código o detalle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '34px', fontSize: '0.8rem', padding: '8px 12px 8px 34px' }}
                />
              </div>

              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Mostrando {filteredItems.length} de {items.length} productos
              </span>
            </div>

            {/* Table Container */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', border: '1px solid var(--border-glass)', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.4)' }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                  Cargando prelista...
                </div>
              ) : items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <FileSpreadsheet size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                  <h4 style={{ color: '#f8fafc', marginBottom: '6px' }}>No hay prelista cargada en este embarque</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 18px' }}>
                    Sube el archivo Excel de la carga (con las columnas Detalle, Código, Cajas, Costo, Precios) para habilitar el seguimiento y las pre-reservas.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-primary"
                    style={{ fontSize: '0.82rem', padding: '8px 18px' }}
                  >
                    <Upload size={15} />
                    <span>Subir Excel Ahora</span>
                  </button>
                </div>
              ) : (
                <table className="table" style={{ width: '100%', minWidth: '1380px', fontSize: '0.78rem', tableLayout: 'auto' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(8px)' }}>
                    <tr>
                      <th style={{ width: '38px', textAlign: 'center', padding: '10px 6px' }}>#</th>
                      <th style={{ minWidth: '95px', padding: '10px 8px' }}>Código</th>
                      <th style={{ minWidth: '260px', padding: '10px 8px' }}>Detalle del Producto</th>
                      <th style={{ minWidth: '65px', textAlign: 'center', padding: '10px 6px' }}>Cajas</th>
                      <th style={{ minWidth: '65px', textAlign: 'center', padding: '10px 6px' }}>Unid/Cj</th>
                      <th style={{ minWidth: '75px', textAlign: 'center', padding: '10px 6px' }}>Total Unid</th>
                      <th style={{ minWidth: '95px', textAlign: 'right', padding: '10px 8px', color: '#94a3b8' }}>Costo Ant. ($)</th>
                      <th style={{ minWidth: '95px', textAlign: 'right', padding: '10px 8px', color: '#f87171' }}>Costo ($)</th>
                      <th style={{ minWidth: '75px', textAlign: 'center', padding: '10px 6px', color: '#fbbf24' }}>% Margen</th>
                      <th style={{ minWidth: '95px', textAlign: 'right', padding: '10px 8px', color: '#38bdf8' }}>P. Mayor</th>
                      <th style={{ minWidth: '95px', textAlign: 'right', padding: '10px 8px', color: '#a78bfa' }}>P. Caja</th>
                      <th style={{ minWidth: '95px', textAlign: 'right', padding: '10px 8px', color: '#34d399' }}>P. Especial</th>
                      <th style={{ minWidth: '75px', textAlign: 'center', padding: '10px 6px' }}>Reservadas</th>
                      <th style={{ minWidth: '85px', textAlign: 'center', padding: '10px 6px' }}>Disponibles</th>
                      <th style={{ minWidth: '115px', textAlign: 'center', padding: '10px 8px' }}>Editar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((it) => {
                      const isEditing = editingItemId === it.id;
                      const boxes = isEditing ? Number(editValues.boxes_count ?? it.boxes_count) : Number(it.boxes_count) || 0;
                      const perBox = isEditing ? Number(editValues.units_per_box ?? it.units_per_box) : Number(it.units_per_box) || 1;
                      const resv = Number(it.live_reserved_boxes !== undefined ? it.live_reserved_boxes : it.reserved_boxes) || 0;
                      const avail = Math.max(0, boxes - resv);

                      const editInput = (field, color) => (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editValues[field] ?? ''}
                          onChange={e => setEditValues(v => ({ ...v, [field]: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveItemEdit(it);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="form-input mono"
                          style={{
                            width: '80px',
                            padding: '4px 6px',
                            fontSize: '0.76rem',
                            background: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(99, 102, 241, 0.6)',
                            borderRadius: '6px',
                            color: color || '#f8fafc',
                            textAlign: 'right'
                          }}
                        />
                      );

                      return (
                        <tr
                          key={it.id}
                          style={{
                            background: isEditing ? 'rgba(99, 102, 241, 0.1)' : undefined,
                            outline: isEditing ? '1px solid rgba(99, 102, 241, 0.5)' : undefined
                          }}
                        >
                          <td className="mono" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '8px 6px' }}>
                            {it.item_number || '-'}
                          </td>
                          <td className="mono" style={{ fontWeight: 700, color: 'var(--cyan-primary)', padding: '8px 8px' }}>
                            {it.product_code}
                          </td>
                          <td style={{ fontWeight: 500, color: '#f8fafc', minWidth: '240px', padding: '8px 8px' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: '1.25' }}>{it.product_name}</div>
                            {it.order_confirmed_date && (
                              <div style={{ fontSize: '0.67rem', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>📅 Subido:</span>
                                <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                                  {new Date(it.order_confirmed_date).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Cajas */}
                          <td className="mono" style={{ fontWeight: 700, textAlign: 'center', padding: '8px 6px' }}>
                            {isEditing
                              ? <input 
                                  type="number" 
                                  min="0" 
                                  value={editValues.boxes_count ?? ''} 
                                  onChange={e => setEditValues(v => ({ ...v, boxes_count: e.target.value }))} 
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSaveItemEdit(it);
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                  className="form-input mono" 
                                  style={{ width: '60px', padding: '4px 5px', fontSize: '0.76rem', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(99, 102, 241, 0.6)', borderRadius: '6px', textAlign: 'center' }} 
                                />
                              : boxes
                            }
                          </td>

                          {/* Unid/Cj */}
                          <td className="mono" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '8px 6px' }}>
                            {isEditing
                              ? <input 
                                  type="number" 
                                  min="1" 
                                  value={editValues.units_per_box ?? ''} 
                                  onChange={e => setEditValues(v => ({ ...v, units_per_box: e.target.value }))} 
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSaveItemEdit(it);
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                  className="form-input mono" 
                                  style={{ width: '60px', padding: '4px 5px', fontSize: '0.76rem', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(99, 102, 241, 0.6)', borderRadius: '6px', textAlign: 'center' }} 
                                />
                              : perBox
                            }
                          </td>

                          {/* Total Unid (computed) */}
                          <td className="mono" style={{ fontWeight: 700, textAlign: 'center', color: isEditing ? '#f59e0b' : '#f8fafc', padding: '8px 6px' }}>
                            {isEditing ? formatNumber(boxes * perBox) : formatNumber(it.total_units)}
                          </td>

                          {/* Costo Anterior */}
                          <td className="mono" style={{ textAlign: 'right', color: '#94a3b8', padding: '8px 8px' }}>
                            {isEditing
                              ? editInput('previous_cost', '#94a3b8')
                              : (it.previous_cost ? `$${Number(it.previous_cost).toFixed(2)}` : <span style={{ color: '#475569' }}>—</span>)
                            }
                          </td>

                          {/* Costo Actual (red accent) */}
                          <td className="mono" style={{ textAlign: 'right', fontWeight: 600, color: '#f87171', padding: '8px 8px' }}>
                            {isEditing
                              ? editInput('unit_cost', '#f87171')
                              : `$${Number(it.unit_cost || 0).toFixed(2)}`
                            }
                          </td>

                          {/* % Margen */}
                          <td className="mono" style={{ textAlign: 'center', color: '#fbbf24', padding: '8px 6px' }}>
                            {isEditing
                              ? editInput('margin_percent', '#fbbf24')
                              : (it.margin_percent ? `${Number(it.margin_percent).toFixed(1)}%` : '—')
                            }
                          </td>

                          {/* P. Mayor */}
                          <td className="mono" style={{ textAlign: 'right', color: '#38bdf8', padding: '8px 8px' }}>
                            {isEditing
                              ? editInput('price_mayor', '#38bdf8')
                              : (it.price_mayor ? `$${Number(it.price_mayor).toFixed(2)}` : '—')
                            }
                          </td>

                          {/* P. Caja */}
                          <td className="mono" style={{ textAlign: 'right', color: '#a78bfa', padding: '8px 8px' }}>
                            {isEditing
                              ? editInput('price_caja', '#a78bfa')
                              : (it.price_caja ? `$${Number(it.price_caja).toFixed(2)}` : '—')
                            }
                          </td>

                          {/* P. Especial */}
                          <td className="mono" style={{ textAlign: 'right', color: '#34d399', padding: '8px 8px' }}>
                            {isEditing
                              ? editInput('price_special', '#34d399')
                              : (it.price_special ? `$${Number(it.price_special).toFixed(2)}` : '—')
                            }
                          </td>

                          {/* Reservadas */}
                          <td style={{ textAlign: 'center', padding: '8px 6px' }}>
                            {resv > 0 ? (
                              <span className="badge badge-amber" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>{resv} cj</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>0</span>
                            )}
                          </td>

                          {/* Disponibles */}
                          <td style={{ textAlign: 'center', padding: '8px 6px' }}>
                            <span style={{ fontWeight: 700, color: avail > 0 ? '#10b981' : '#f43f5e', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                              {avail} cj
                            </span>
                          </td>

                          {/* Acciones edición */}
                          <td style={{ textAlign: 'center', padding: '8px 6px' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => handleSaveItemEdit(it)}
                                  disabled={isSavingItem}
                                  title="Guardar cambios (Enter)"
                                  style={{
                                    background: 'rgba(16,185,129,0.25)',
                                    border: '1px solid rgba(16,185,129,0.6)',
                                    color: '#34d399',
                                    borderRadius: '6px',
                                    padding: '5px 9px',
                                    cursor: 'pointer',
                                    fontSize: '0.72rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontWeight: 600
                                  }}
                                >
                                  <CheckCircle2 size={13} />
                                  {isSavingItem ? '...' : 'OK'}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  title="Cancelar (Esc)"
                                  style={{
                                    background: 'rgba(244,63,94,0.18)',
                                    border: '1px solid rgba(244,63,94,0.5)',
                                    color: '#fb7185',
                                    borderRadius: '6px',
                                    padding: '5px 7px',
                                    cursor: 'pointer',
                                    fontSize: '0.72rem',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => handleStartEdit(it)}
                                  title="Editar este producto en prelista"
                                  style={{
                                    background: 'rgba(99,102,241,0.18)',
                                    border: '1px solid rgba(99,102,241,0.4)',
                                    color: '#a5b4fc',
                                    borderRadius: '6px',
                                    padding: '5px 10px',
                                    cursor: 'pointer',
                                    fontSize: '0.72rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: 600
                                  }}
                                >
                                  ✏️ Editar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Active Pre-Reservations */}
        {activeTab === 'reservations' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h4 style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.05rem', margin: 0 }}>
                  Pre-Reservas de Clientes en este Lote
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Clientes que apartaron cajas antes de que el contenedor llegue a almacén. Al confirmar llegada se crean como Notas de Venta automáticamente.
                </p>
              </div>

              {currentStatus !== 'recibido' && items.length > 0 && (
                <button
                  onClick={handleOpenBulkResModal}
                  className="btn"
                  style={{
                    fontSize: '0.8rem',
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#ffffff',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(245, 158, 11, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={15} />
                  <span>📌 Nueva Pre-Reserva</span>
                </button>
              )}
            </div>

            {reservations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <UserCheck size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                <h4 style={{ color: '#f8fafc', marginBottom: '6px' }}>No hay reservas registradas en este lote</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
                  Puedes apartar cajas para tus clientes antes de que el embarque llegue a almacén.
                </p>
                {currentStatus !== 'recibido' && items.length > 0 && (
                  <button
                    onClick={handleOpenBulkResModal}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none' }}
                  >
                    <Plus size={15} />
                    <span>Crear Primera Reserva</span>
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {Object.values(
                  reservations.reduce((acc, r) => {
                    const key = r.customer_name || 'CLIENTE';
                    if (!acc[key]) {
                      acc[key] = {
                        customer_name: r.customer_name,
                        customer_phone: r.customer_phone,
                        status: r.status,
                        created_at: r.created_at,
                        notes: r.notes,
                        items: [],
                        total_boxes: 0,
                        total_units: 0,
                        total_amount: 0
                      };
                    }
                    acc[key].items.push(r);
                    const b = Number(r.reserved_boxes) || 0;
                    const u = Number(r.reserved_units) || 0;
                    const p = Number(r.price_agreed) || 0;
                    acc[key].total_boxes += b;
                    acc[key].total_units += u;
                    acc[key].total_amount += (u * p);
                    return acc;
                  }, {})
                ).map((group, gIdx) => (
                  <div
                    key={gIdx}
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                    }}
                  >
                    {/* Customer Group Header */}
                    <div style={{
                      padding: '14px 20px',
                      background: 'rgba(245, 158, 11, 0.08)',
                      borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: 'rgba(245, 158, 11, 0.2)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fbbf24',
                          fontWeight: 800
                        }}>
                          👤
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1rem', margin: 0 }}>
                              {group.customer_name}
                            </h4>
                            {group.customer_phone && (
                              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                📱 {group.customer_phone}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Fecha reserva: {formatDate(group.created_at)} {group.notes ? `• Nota: ${group.notes}` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Badges & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="badge badge-amber" style={{ fontSize: '0.75rem', padding: '4px 10px', fontWeight: 700 }}>
                          📦 {group.total_boxes} Cajas ({formatNumber(group.total_units)} unid)
                        </span>
                        {group.total_amount > 0 && (
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                            ${group.total_amount.toFixed(2)}
                          </span>
                        )}
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          background: group.status === 'CONVERTIDO' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: group.status === 'CONVERTIDO' ? '#34d399' : '#fbbf24'
                        }}>
                          {group.status === 'CONVERTIDO' ? '✅ En Nota de Venta' : '⏳ Pre-Reserva Activa'}
                        </span>
                      </div>
                    </div>

                    {/* Customer Items Table */}
                    <div style={{ overflowX: 'auto' }}>
                      <table className="table" style={{ width: '100%', fontSize: '0.78rem' }}>
                        <thead>
                          <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                            <th style={{ padding: '8px 14px' }}>Código</th>
                            <th style={{ padding: '8px 14px' }}>Detalle de Producto</th>
                            <th style={{ textAlign: 'center', padding: '8px 14px' }}>Cajas Reservadas</th>
                            <th style={{ textAlign: 'center', padding: '8px 14px' }}>Unidades</th>
                            <th style={{ textAlign: 'right', padding: '8px 14px' }}>Precio Acordado</th>
                            <th style={{ textAlign: 'right', padding: '8px 14px' }}>Subtotal ($)</th>
                            <th style={{ textAlign: 'right', padding: '8px 14px', width: '60px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((r) => {
                            const boxes = Number(r.reserved_boxes) || 0;
                            const units = Number(r.reserved_units) || 0;
                            const price = Number(r.price_agreed) || 0;
                            const sub = units * price;
                            return (
                              <tr key={r.id}>
                                <td className="mono" style={{ fontWeight: 700, color: 'var(--cyan-primary)', padding: '8px 14px' }}>
                                  {r.product_code}
                                </td>
                                <td style={{ color: '#f8fafc', padding: '8px 14px' }}>{r.product_name}</td>
                                <td style={{ textAlign: 'center', padding: '8px 14px' }}>
                                  <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                                    {boxes} cj
                                  </span>
                                </td>
                                <td className="mono" style={{ textAlign: 'center', color: '#cbd5e1', padding: '8px 14px' }}>
                                  {formatNumber(units)} u
                                </td>
                                <td className="mono" style={{ textAlign: 'right', color: '#38bdf8', fontWeight: 600, padding: '8px 14px' }}>
                                  {price > 0 ? `$${price.toFixed(2)}` : '—'}
                                </td>
                                <td className="mono" style={{ textAlign: 'right', color: '#34d399', fontWeight: 700, padding: '8px 14px' }}>
                                  {sub > 0 ? `$${sub.toFixed(2)}` : '—'}
                                </td>
                                <td style={{ textAlign: 'right', padding: '8px 14px' }}>
                                  <button
                                    onClick={() => handleDeleteReservation(r.id)}
                                    className="btn btn-secondary"
                                    style={{ padding: '3px 6px', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)' }}
                                    title="Cancelar esta reserva"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Logistics & Warehouse Receiving */}
        {activeTab === 'logistics' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <div style={{ maxWidth: '850px', margin: '0 auto' }}>
              
              {/* Route & Transport info card */}
              <div style={{
                background: 'rgba(12, 18, 34, 0.8)',
                border: '1px solid var(--border-glass)',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <h4 className="font-heading" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isMaritimo ? <Ship size={18} color="var(--cyan-primary)" /> : <Truck size={18} color="#f59e0b" />}
                  <span>Información de Ruta y Transporte</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Modalidad:</span>
                    <strong style={{ color: '#f8fafc' }}>
                      {isMaritimo ? '🚢 Marítimo + Camión (Multimodal)' : '🚛 Terrestre Directo'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Origen:</span>
                    <strong style={{ color: '#f8fafc' }}>{container.origin_country || 'China'}</strong>
                  </div>
                  {isMaritimo && (
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Puerto de Arribo:</span>
                      <strong style={{ color: '#38bdf8' }}>{container.port_name || 'Arica'}</strong>
                    </div>
                  )}
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Camión / Placa de Enlace:</span>
                    <strong style={{ color: '#fbbf24' }}>{container.truck_plate || 'Sin asignar aún'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Chofer / Empresa:</span>
                    <strong style={{ color: '#cbd5e1' }}>{container.truck_driver || container.shipping_line}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Fecha Estimada Llegada:</span>
                    <strong style={{ color: 'var(--cyan-primary)' }}>
                      {container.estimated_arrival ? formatDate(container.estimated_arrival) : 'No definida'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Reception to Warehouse Panel */}
              <div style={{
                background: currentStatus === 'recibido' 
                  ? 'rgba(16, 185, 129, 0.08)' 
                  : 'rgba(6, 182, 212, 0.08)',
                border: currentStatus === 'recibido'
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '14px',
                padding: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '18px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: currentStatus === 'recibido' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: currentStatus === 'recibido' ? '#10b981' : 'var(--cyan-primary)',
                    flexShrink: 0
                  }}>
                    <CheckCircle2 size={26} />
                  </div>
                  <div>
                    <h3 className="font-heading" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                      {currentStatus === 'recibido' 
                        ? '✅ Contenedor Descargado e Ingresado a Stock' 
                        : '📥 Dar Entrada y Descargar en Stock de Almacén'}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {currentStatus === 'recibido'
                        ? `Este lote fue recibido en almacén el ${formatDate(container.actual_arrival || container.warehouse_arrival_date || new Date())}. Todo el stock físico y los movimientos de Kardex están activos.`
                        : `Cuando el ${isMaritimo ? 'contenedor/camión' : 'camión'} llegue físicamente al almacén, presiona el botón para incorporar las ${formatNumber(totalUnits)} unidades (${formatNumber(totalBoxes)} cajas) directamente al inventario físico real y al Kardex.`}
                    </p>
                  </div>
                </div>

                {receiveSuccessMsg && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '18px',
                    fontSize: '0.84rem',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <CheckCircle2 size={18} />
                    <span>{receiveSuccessMsg}</span>
                  </div>
                )}

                {currentStatus !== 'recibido' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <label className="form-label">Fecha de Llegada / Descarga</label>
                        <input
                          type="date"
                          className="form-input"
                          value={receiveDate}
                          onChange={(e) => setReceiveDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label">Almacén de Destino</label>
                        <select
                          className="form-select"
                          value={receiveWarehouse}
                          onChange={(e) => setReceiveWarehouse(e.target.value)}
                        >
                          <option value="CASA CUBANO">CASA CUBANO</option>
                          <option value="GALPON CENTRAL">GALPON CENTRAL</option>
                          <option value="TIENDA PRINCIPAL">TIENDA PRINCIPAL</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setShowReceiveModal(true)}
                        disabled={isReceiving || items.length === 0}
                        className="btn btn-primary"
                        style={{
                          padding: '12px 28px',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <CheckCircle2 size={18} />
                        <span>Confirmar Llegada e Ingresar Stock a Almacén</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Modal: Nueva Pre-Reserva Multi-Producto */}
        {showBulkResModal && (
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content" style={{ maxWidth: '820px', width: '92%', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
              {/* Header */}
              <div style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border-glass)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.95)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fbbf24'
                  }}>
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.15rem', margin: 0 }}>
                      📌 Nueva Pre-Reserva de Cliente
                    </h3>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Embarque / Camión: <strong style={{ color: 'var(--cyan-primary)' }}>{container.tracking_number}</strong> • Puedes agregar múltiples productos
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowBulkResModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '6px', border: 'none', borderRadius: '8px' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* 1. Customer Information */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>👤 Datos del Cliente</span>
                  </div>

                  {customerList.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <label className="form-label" style={{ fontSize: '0.74rem' }}>Seleccionar Cliente Existente (Opcional):</label>
                      <select
                        className="form-select"
                        style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                        onChange={(e) => {
                          const c = customerList.find(x => x.id === Number(e.target.value));
                          if (c) handleSelectBulkCustomer(c);
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>-- Seleccionar de la agenda de clientes --</option>
                        {customerList.map(c => (
                          <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.76rem' }}>Nombre o Razón Social *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej. ERICK GARCIA"
                        value={bulkResCustomerName}
                        onChange={(e) => setBulkResCustomerName(e.target.value)}
                        required
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.76rem' }}>Teléfono / WhatsApp</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej. 70012345"
                        value={bulkResCustomerPhone}
                        onChange={(e) => setBulkResCustomerPhone(e.target.value)}
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.76rem' }}>Notas / Condiciones de la Reserva</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej. Despacho prioritario apenas llegue, pago 50% contra entrega..."
                      value={bulkResNotes}
                      onChange={(e) => setBulkResNotes(e.target.value)}
                      style={{ fontSize: '0.8rem' }}
                    />
                  </div>
                </div>

                {/* 2. Product Picker Section */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🔍 Agregar Productos de este Embarque</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {items.length} productos disponibles en prelista
                    </span>
                  </div>

                  {/* Search input */}
                  <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Escribe código SKU o nombre de producto para buscar y añadir..."
                      value={bulkItemSearch}
                      onChange={(e) => setBulkItemSearch(e.target.value)}
                      style={{ paddingLeft: '32px', fontSize: '0.8rem' }}
                    />
                  </div>

                  {/* Quick results dropdown / list */}
                  {bulkItemSearch.trim() && (
                    <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '8px', background: '#090d16' }}>
                      {items
                        .filter(it => {
                          const s = bulkItemSearch.toLowerCase();
                          return (it.product_code && it.product_code.toLowerCase().includes(s)) ||
                                 (it.product_name && it.product_name.toLowerCase().includes(s));
                        })
                        .slice(0, 10)
                        .map(it => {
                          const alreadyRes = Number(it.live_reserved_boxes || it.reserved_boxes || 0);
                          const avail = Math.max(0, (Number(it.boxes_count) || 0) - alreadyRes);
                          const isAlreadyAdded = bulkResItems.some(x => x.container_item_id === it.id);

                          return (
                            <div
                              key={it.id}
                              style={{
                                padding: '8px 12px',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.78rem'
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 700, color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>
                                  {it.product_code}
                                </span>
                                <span style={{ color: '#cbd5e1', marginLeft: '8px' }}>{it.product_name}</span>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {it.units_per_box} u/cj • {it.boxes_count} cj lote • <strong style={{ color: avail > 0 ? '#10b981' : '#f43f5e' }}>{avail} cj libres</strong>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  handleAddProductToBulkRes(it);
                                  setBulkItemSearch('');
                                }}
                                disabled={avail <= 0 || isAlreadyAdded}
                                className="btn"
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.72rem',
                                  background: isAlreadyAdded ? 'rgba(255,255,255,0.1)' : 'rgba(56, 189, 248, 0.2)',
                                  color: isAlreadyAdded ? '#94a3b8' : '#38bdf8',
                                  border: isAlreadyAdded ? '1px solid transparent' : '1px solid rgba(56, 189, 248, 0.4)',
                                  borderRadius: '6px',
                                  cursor: (avail <= 0 || isAlreadyAdded) ? 'not-allowed' : 'pointer'
                                }}
                              >
                                {isAlreadyAdded ? '✓ Agregado' : avail <= 0 ? 'Sin stock' : '+ Agregar'}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* 3. Selected Items Table */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                      📋 Productos Reservados ({bulkResItems.length})
                    </div>
                    {bulkResItems.length === 0 && (
                      <span style={{ fontSize: '0.74rem', color: '#fb7185' }}>
                        * Selecciona al menos 1 producto arriba
                      </span>
                    )}
                  </div>

                  {bulkResItems.length === 0 ? (
                    <div style={{
                      padding: '30px',
                      textAlign: 'center',
                      background: 'rgba(0,0,0,0.15)',
                      border: '1px dashed var(--border-glass)',
                      borderRadius: '10px',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem'
                    }}>
                      Usa el buscador de arriba para buscar y agregar los productos que este cliente desea apartar.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid var(--border-glass)', borderRadius: '10px', overflow: 'hidden' }}>
                      <table className="table" style={{ width: '100%', fontSize: '0.76rem' }}>
                        <thead>
                          <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
                            <th style={{ padding: '8px 10px' }}>Código</th>
                            <th style={{ padding: '8px 10px' }}>Detalle</th>
                            <th style={{ textAlign: 'center', padding: '8px 10px', width: '90px' }}>Libres</th>
                            <th style={{ textAlign: 'center', padding: '8px 10px', width: '110px' }}>Cajas *</th>
                            <th style={{ textAlign: 'center', padding: '8px 10px', width: '80px' }}>Unidades</th>
                            <th style={{ textAlign: 'right', padding: '8px 10px', width: '110px' }}>P. Acordado ($)</th>
                            <th style={{ textAlign: 'right', padding: '8px 10px', width: '100px' }}>Subtotal ($)</th>
                            <th style={{ width: '40px', padding: '8px 10px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkResItems.map((item, idx) => {
                            const sub = Number(item.reserved_boxes) * Number(item.units_per_box) * (Number(item.price_agreed) || 0);
                            return (
                              <tr key={item.container_item_id}>
                                <td className="mono" style={{ fontWeight: 700, color: 'var(--cyan-primary)', padding: '6px 10px' }}>
                                  {item.product_code}
                                </td>
                                <td style={{ color: '#f8fafc', padding: '6px 10px' }}>
                                  {item.product_name}
                                </td>
                                <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 600, padding: '6px 10px' }}>
                                  {item.available_boxes} cj
                                </td>
                                <td style={{ textAlign: 'center', padding: '6px 10px' }}>
                                  <input
                                    type="number"
                                    min="1"
                                    max={item.available_boxes}
                                    value={item.reserved_boxes}
                                    onChange={(e) => handleUpdateBulkItemBoxes(idx, e.target.value)}
                                    className="form-input mono"
                                    style={{
                                      width: '80px',
                                      padding: '4px 6px',
                                      textAlign: 'center',
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      borderColor: 'rgba(245, 158, 11, 0.5)'
                                    }}
                                  />
                                </td>
                                <td className="mono" style={{ textAlign: 'center', color: '#cbd5e1', padding: '6px 10px' }}>
                                  {item.reserved_boxes * item.units_per_box}
                                </td>
                                <td style={{ textAlign: 'right', padding: '6px 10px' }}>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={item.price_agreed}
                                    onChange={(e) => handleUpdateBulkItemPrice(idx, e.target.value)}
                                    className="form-input mono"
                                    placeholder="0.00"
                                    style={{
                                      width: '90px',
                                      padding: '4px 6px',
                                      textAlign: 'right',
                                      fontSize: '0.8rem'
                                    }}
                                  />
                                </td>
                                <td className="mono" style={{ textAlign: 'right', fontWeight: 700, color: '#34d399', padding: '6px 10px' }}>
                                  ${sub.toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'center', padding: '6px 10px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBulkItem(idx)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#fb7185',
                                      cursor: 'pointer',
                                      padding: '3px'
                                    }}
                                    title="Quitar de la lista"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Summary bar */}
                {bulkResItems.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '10px',
                    padding: '12px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Total Cajas</span>
                      <strong style={{ fontSize: '1.1rem', color: '#fbbf24' }}>
                        {bulkResItems.reduce((acc, it) => acc + Number(it.reserved_boxes), 0)} cj
                      </strong>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(245, 158, 11, 0.2)', borderRight: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Total Unidades</span>
                      <strong style={{ fontSize: '1.1rem', color: '#38bdf8' }}>
                        {formatNumber(bulkResItems.reduce((acc, it) => acc + (Number(it.reserved_boxes) * Number(it.units_per_box)), 0))} u
                      </strong>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Valor Acordado Estimado</span>
                      <strong style={{ fontSize: '1.1rem', color: '#34d399' }}>
                        ${bulkResItems.reduce((acc, it) => acc + (Number(it.reserved_boxes) * Number(it.units_per_box) * (Number(it.price_agreed) || 0)), 0).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-glass)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                background: 'rgba(15, 23, 42, 0.95)'
              }}>
                <button
                  type="button"
                  onClick={() => setShowBulkResModal(false)}
                  className="btn btn-secondary"
                  disabled={isSubmittingBulkRes}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmitBulkReservation}
                  disabled={isSubmittingBulkRes || bulkResItems.length === 0 || !bulkResCustomerName.trim()}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    border: 'none',
                    fontWeight: 700,
                    padding: '10px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <UserCheck size={16} />
                  <span>{isSubmittingBulkRes ? 'Guardando Reserva...' : 'Confirmar Pre-Reserva Completa'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirmar Ingreso a Almacén / Stock */}
        {showReceiveModal && (
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content" style={{ maxWidth: '580px', borderRadius: '16px', overflow: 'hidden' }}>
              {/* Modal Header */}
              <div style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border-glass)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.95)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981'
                  }}>
                    <Package size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.15rem', margin: 0 }}>
                      Ingresar Mercadería a Almacén
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Embarque: <strong style={{ color: '#38bdf8' }}>{container.tracking_number}</strong> • {items.length} productos
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowReceiveModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '6px', border: 'none', borderRadius: '8px' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px' }}>
                
                {/* Summary Badges */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                  marginBottom: '20px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-glass)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Productos</span>
                    <strong style={{ fontSize: '1.15rem', color: '#f8fafc' }}>{items.length}</strong>
                  </div>
                  <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-glass)', borderRight: '1px solid var(--border-glass)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Total Cajas</span>
                    <strong style={{ fontSize: '1.15rem', color: '#38bdf8' }}>{formatNumber(totalBoxes)}</strong>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Total Unidades</span>
                    <strong style={{ fontSize: '1.15rem', color: '#34d399' }}>{formatNumber(totalUnits)}</strong>
                  </div>
                </div>

                {/* Warehouse & Date Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '6px' }}>
                      <Calendar size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                      Fecha de Ingreso:
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={receiveDate}
                      onChange={(e) => setReceiveDate(e.target.value)}
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '6px' }}>
                      <MapPin size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                      Almacén de Destino:
                    </label>
                    <select
                      className="form-select"
                      value={receiveWarehouse}
                      onChange={(e) => setReceiveWarehouse(e.target.value)}
                      style={{ fontSize: '0.82rem' }}
                    >
                      <option value="CASA CUBANO">CASA CUBANO</option>
                      <option value="GALPON CENTRAL">GALPON CENTRAL</option>
                      <option value="TIENDA PRINCIPAL">TIENDA PRINCIPAL</option>
                    </select>
                  </div>
                </div>

                {/* The 2 Mode Cards (Selection of Stock only vs Stock + Prices) */}
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', marginBottom: '10px', display: 'block' }}>
                  Selecciona el modo de ingreso al sistema:
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {/* Option 1: Solo Subir Stock */}
                  <div
                    onClick={() => setReceiveUpdatePrices(false)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: !receiveUpdatePrices 
                        ? '2px solid #10b981' 
                        : '1px solid var(--border-glass)',
                      background: !receiveUpdatePrices 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px'
                    }}
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: !receiveUpdatePrices ? '6px solid #10b981' : '2px solid var(--border-subtle)',
                      background: '#0f172a',
                      marginTop: '2px',
                      flexShrink: 0
                    }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: !receiveUpdatePrices ? '#34d399' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📦 Solo Subir Stock Físico</span>
                        <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>Recomendado si mantienes precios</span>
                      </div>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                        Suma las unidades y cajas al inventario físico real y registra las Entradas en el Kardex. <strong>Mantiene intactos y sin cambios todos los precios de venta actuales (Mayor, Caja, Especial) y costos en el catálogo.</strong>
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Subir Stock Y Actualizar Precios */}
                  <div
                    onClick={() => setReceiveUpdatePrices(true)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: receiveUpdatePrices 
                        ? '2px solid #38bdf8' 
                        : '1px solid var(--border-glass)',
                      background: receiveUpdatePrices 
                        ? 'rgba(56, 189, 248, 0.1)' 
                        : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px'
                    }}
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: receiveUpdatePrices ? '6px solid #38bdf8' : '2px solid var(--border-subtle)',
                      background: '#0f172a',
                      marginTop: '2px',
                      flexShrink: 0
                    }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: receiveUpdatePrices ? '#38bdf8' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>⚡ Subir Stock Y Actualizar Precios</span>
                        <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>Stock + Catálogo</span>
                      </div>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                        Suma las unidades al inventario físico (Kardex) <strong>Y ACTUALIZA los precios de venta</strong> (P. Mayor, P. Caja, P. Especial) y el Costo en el catálogo con los valores registrados en esta prelista.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security alert */}
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '0.74rem',
                  color: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Seguridad:</strong> Una vez confirmado, este lote se marcará como <strong>"Recibido en Almacén"</strong> y no podrá descargarse una segunda vez para evitar duplicaciones en el stock.
                  </span>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowReceiveModal(false)}
                    className="btn btn-secondary"
                    disabled={isReceiving}
                    style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReceiveContainer(receiveUpdatePrices)}
                    disabled={isReceiving}
                    className="btn"
                    style={{
                      fontSize: '0.82rem',
                      padding: '8px 22px',
                      fontWeight: 700,
                      border: 'none',
                      borderRadius: '8px',
                      background: receiveUpdatePrices
                        ? 'linear-gradient(135deg, #0284c7, #0369a1)'
                        : 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#ffffff',
                      boxShadow: receiveUpdatePrices
                        ? '0 4px 14px rgba(2, 132, 199, 0.4)'
                        : '0 4px 14px rgba(16, 185, 129, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    {isReceiving ? (
                      <span>Procesando ingreso...</span>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>
                          {receiveUpdatePrices 
                            ? 'Confirmar: Subir Stock y Precios' 
                            : 'Confirmar: Solo Subir Stock'}
                        </span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
