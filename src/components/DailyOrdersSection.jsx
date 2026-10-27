import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ClipboardList, 
  User, 
  Plus, 
  Save, 
  RefreshCw, 
  Printer, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  CheckSquare, 
  Square, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  DollarSign,
  Truck,
  Clock,
  ExternalLink,
  PackageCheck,
  Box
} from 'lucide-react';
import DeliveryConfirmModal from './DeliveryConfirmModal';

const DAYS_OF_WEEK = [
  { key: 'LUNES', label: 'LUNES', dayIndex: 1 },
  { key: 'MARTES', label: 'MARTES', dayIndex: 2 },
  { key: 'MIERCOLES', label: 'MIÉRCOLES', dayIndex: 3 },
  { key: 'JUEVES', label: 'JUEVES', dayIndex: 4 },
  { key: 'VIERNES', label: 'VIERNES', dayIndex: 5 },
  { key: 'SABADO', label: 'SÁBADO', dayIndex: 6 },
];

// Helper to calculate Monday of week offset
function getMonday(d = new Date(), offsetWeeks = 0) {
  const date = new Date(d);
  date.setDate(date.getDate() + (offsetWeeks * 7));
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function formatDateIso(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateShort(dateObj) {
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}`;
}

// Helper to get dynamic live account status of note
function getAccountStatus(row) {
  if (!row.sales_note_id) return null;

  if (row.note_status === 'ANULADO') {
    return {
      type: 'ANULADO',
      label: 'ANULADO',
      color: 'var(--rose-danger)',
      bg: 'rgba(244, 63, 94, 0.12)',
      border: 'rgba(244, 63, 94, 0.35)',
      detail: 'Nota Anulada'
    };
  }

  const balance = Number(row.note_balance ?? 0);

  if (balance <= 0 || row.note_status === 'PAGADO') {
    return {
      type: 'CANCELADO',
      label: 'CANCELADO',
      color: 'var(--emerald-success)',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.35)',
      detail: 'Bs 0.00 Saldo'
    };
  }

  const isCredit = row.note_due_date && row.note_due_date > row.note_date;
  const balFormatted = `Saldo: Bs ${balance.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (isCredit) {
    const dueParts = (row.note_due_date || '').split('-');
    const dueShort = dueParts.length === 3 ? `${dueParts[2]}/${dueParts[1]}` : row.note_due_date;
    return {
      type: 'CREDITO',
      label: 'CRÉDITO',
      color: 'var(--indigo-brand)',
      bg: 'rgba(99, 102, 241, 0.12)',
      border: 'rgba(99, 102, 241, 0.35)',
      detail: balFormatted,
      dueDetail: `Vence ${dueShort}`
    };
  }

  return {
    type: 'PENDIENTE',
    label: 'PENDIENTE',
    color: 'var(--amber-warning)',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.35)',
    detail: balFormatted
  };
}

export default function DailyOrdersSection({ 
  onOpenPrintNote, 
  onOpenEditNote, 
  onOpenNewNote, 
  onOpenAddPayment, 
  onNavigateToContainers,
  refreshTrigger 
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayKey, setSelectedDayKey] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const map = { 1: 'LUNES', 2: 'MARTES', 3: 'MIERCOLES', 4: 'JUEVES', 5: 'VIERNES', 6: 'SABADO' };
    return map[dayOfWeek] || 'LUNES';
  });
  const [supervisor, setSupervisor] = useState('TITO');
  const [deliveryModalRow, setDeliveryModalRow] = useState(null);

  // Days dates mapping for current week offset
  const weekDays = useMemo(() => {
    const monday = getMonday(new Date(), weekOffset);
    return DAYS_OF_WEEK.map((d, idx) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + idx);
      return {
        ...d,
        dateIso: formatDateIso(dayDate),
        dateShort: formatDateShort(dayDate),
        dateFull: `${d.label} ${formatDateShort(dayDate)}`
      };
    });
  }, [weekOffset]);

  const activeDay = useMemo(() => {
    return weekDays.find(d => d.key === selectedDayKey) || weekDays[0];
  }, [weekDays, selectedDayKey]);

  // Main table rows
  const [rows, setRows] = useState([]);
  // Side section items
  const [sideItems, setSideItems] = useState([]);
  const [dateSalesNotes, setDateSalesNotes] = useState([]);
  const [truckReservations, setTruckReservations] = useState([]);
  const [preReservaSalesNotes, setPreReservaSalesNotes] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch orders for active day
  const fetchDailyOrders = useCallback(async () => {
    if (!activeDay?.dateIso) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/daily-orders?date=${activeDay.dateIso}`).then(r => r.json());
      if (res.success) {
        setRows(res.data.orders || []);
        setSideItems(res.data.sideItems || []);
        if (res.data.supervisor) {
          setSupervisor(res.data.supervisor);
        }
        setDateSalesNotes(res.data.dateSalesNotes || []);
        setTruckReservations(res.data.truckReservations || []);
        setPreReservaSalesNotes(res.data.preReservaSalesNotes || []);
      } else {
        throw new Error(res.error || 'Error al cargar orden del día');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeDay]);

  useEffect(() => {
    fetchDailyOrders();
  }, [fetchDailyOrders, refreshTrigger]);

  // Open full Sales Note modal in Edit or Print mode
  const handleOpenSalesNote = async (salesNoteId) => {
    if (!salesNoteId) return;
    try {
      const res = await fetch(`/api/sales-notes/${salesNoteId}`).then(r => r.json());
      if (res.success && res.data) {
        if (onOpenEditNote) {
          onOpenEditNote(res.data);
        } else if (onOpenPrintNote) {
          onOpenPrintNote(res.data);
        }
      } else {
        alert(res.error || 'No se pudo abrir la nota de venta');
      }
    } catch (err) {
      console.error('Error al abrir nota:', err);
      alert('Error de conexión al cargar la nota');
    }
  };

  // Handle cell edit for a row
  const handleRowChange = (index, field, value) => {
    setRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Add new row
  const handleAddRow = () => {
    const newRowNum = rows.length + 1;
    setRows(prev => [
      ...prev,
      {
        row_num: newRowNum,
        activity_or_customer: '',
        sales_note_id: null,
        sales_note_code: null,
        morning_shift: 1,
        afternoon_shift: 0,
        status: 'IMPRESO',
        observations: '',
        extra_observations: '',
        pending_tasks: ''
      }
    ]);
  };

  // Remove a row
  const handleRemoveRow = (index) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  // Side items helpers
  const handleAddSideItem = (section) => {
    setSideItems(prev => [
      ...prev,
      {
        section,
        title: '',
        status: 'PENDIENTE',
        notes: '',
        row_num: prev.filter(i => i.section === section).length + 1
      }
    ]);
  };

  const handleSideItemChange = (index, field, value) => {
    setSideItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveSideItem = (index) => {
    setSideItems(prev => prev.filter((_, i) => i !== index));
  };

  // Save changes to database
  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg('');
    try {
      const payload = {
        date: activeDay.dateIso,
        dayName: activeDay.key,
        supervisor: supervisor || 'TITO',
        orders: rows,
        sideItems
      };

      const res = await fetch('/api/daily-orders/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (res.success) {
        setToast('¡Orden del Día guardada con éxito en SQLite!');
        setTimeout(() => setToast(''), 4000);
        await fetchDailyOrders();
      } else {
        throw new Error(res.error || 'Error al guardar');
      }
    } catch (err) {
      setErrorMsg(`Error al guardar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Sync sales notes of the day into the table
  const handleSyncNotes = async () => {
    setIsSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/daily-orders/sync-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: activeDay.dateIso,
          dayName: activeDay.key,
          supervisor
        })
      }).then(r => r.json());

      if (res.success) {
        setToast(res.message);
        setTimeout(() => setToast(''), 4000);
        await fetchDailyOrders();
      } else {
        throw new Error(res.error || 'Error al sincronizar');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Print dispatch sheet
  const handlePrint = () => {
    window.print();
  };

  const pendientesList = sideItems.filter(i => i.section === 'PENDIENTES');
  const tareasHacerList = sideItems.filter(i => i.section === 'LISTAS_HACER');
  const correccionesList = sideItems.filter(i => i.section === 'CORRECCIONES');
  const esperaReservaSideList = sideItems.filter(i => i.section === 'ESPERA_RESERVA');

  // Agrupar pre-reservas por camión / contenedor y luego por cliente
  const truckGroups = useMemo(() => {
    const groups = {};
    (truckReservations || []).forEach(r => {
      const key = r.container_id;
      if (!groups[key]) {
        groups[key] = {
          containerId: r.container_id,
          trackingNumber: r.tracking_number,
          transportType: r.transport_type,
          truckPlate: r.truck_plate,
          truckDriver: r.truck_driver,
          containerStatus: r.container_status,
          estimatedArrival: r.estimated_arrival,
          shippingLine: r.shipping_line,
          clients: {}
        };
      }
      const clientKey = (r.customer_name || 'CLIENTE').trim().toUpperCase();
      if (!groups[key].clients[clientKey]) {
        groups[key].clients[clientKey] = {
          customerName: clientKey,
          customerPhone: r.customer_phone,
          items: []
        };
      }
      groups[key].clients[clientKey].items.push(r);
    });

    return Object.values(groups).map(g => ({
      ...g,
      clientsList: Object.values(g.clients)
    }));
  }, [truckReservations]);

  const totalTruckClientsCount = useMemo(() => {
    return truckGroups.reduce((acc, g) => acc + g.clientsList.length, 0);
  }, [truckGroups]);

  const totalEsperaCount = totalTruckClientsCount + esperaReservaSideList.length;

  // Agregar cliente y sus ítems de pre-reserva de camión a la tabla de hoy
  const handleAddTruckReservationToDaily = (truck, client) => {
    const newRowNum = rows.length + 1;
    const itemsDesc = client.items.map(it => `${it.reserved_boxes} cj ${it.product_code}`).join(', ');
    const truckDesc = truck.transportType === 'TERRESTRE' ? 'Camión' : 'Embarque';

    setRows(prev => [
      ...prev,
      {
        row_num: newRowNum,
        activity_or_customer: client.customerName,
        sales_note_id: null,
        sales_note_code: null,
        morning_shift: 1,
        afternoon_shift: 0,
        status: 'IMPRESO',
        observations: `Pre-reserva ${truckDesc} ${truck.trackingNumber}: ${itemsDesc}`,
        extra_observations: client.customerPhone ? `Tel: ${client.customerPhone}` : (truck.truckPlate ? `Placa: ${truck.truckPlate}` : ''),
        pending_tasks: 'Coordinar entrega de pre-reserva de camión'
      }
    ]);

    setToast(`¡${client.customerName} agregado a la tabla del día! Haz clic en "Guardar Orden del Día".`);
    setTimeout(() => setToast(''), 4500);
  };

  return (
    <div className="daily-orders-container glass-panel" style={{
      padding: '24px',
      borderRadius: '18px',
      marginBottom: '28px',
      border: '1px solid var(--border-glass)',
      background: 'var(--bg-dark-surface)'
    }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          background: 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          padding: '12px 22px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 700,
          fontSize: '0.88rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-glass)'
      }}>
        {/* Title & Supervisor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(16, 185, 129, 0.25))',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cyan-primary)'
          }}>
            <ClipboardList size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 className="font-heading" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                ORDEN DE ENTREGAS DE CLIENTES DIARIO
              </h2>
              <span className="badge badge-emerald" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                Control L - M - M - J - V - S
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span>Encargado / Supervisor:</span>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                background: 'var(--bg-subtle-box)',
                padding: '3px 10px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-glass)',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)'
              }}>
                <User size={14} color="var(--cyan-primary)" />
                <input 
                  type="text"
                  value={supervisor}
                  onChange={e => setSupervisor(e.target.value.toUpperCase())}
                  placeholder="TITO"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontWeight: 800,
                    width: '90px',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    outline: 'none',
                    letterSpacing: '0.04em'
                  }}
                />
              </div>
              <span style={{ margin: '0 4px', color: 'var(--text-faint)' }}>•</span>
              <span>Fecha: <strong style={{ color: 'var(--text-main)' }}>{activeDay.dateIso}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSyncNotes}
            disabled={isSaving}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 14px', gap: '6px' }}
            title="Sincronizar automáticamente las notas de venta creadas en esta fecha"
          >
            <RefreshCw size={15} className={isSaving ? 'animate-spin' : ''} color="var(--cyan-primary)" />
            <span>Sincronizar Notas del Día</span>
            {dateSalesNotes.length > 0 && (
              <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                {dateSalesNotes.length}
              </span>
            )}
          </button>

          <button
            onClick={onOpenNewNote}
            className="btn btn-primary"
            style={{
              fontSize: '0.85rem',
              padding: '9px 18px',
              gap: '8px',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)'
            }}
            title="Crear nueva nota de venta"
          >
            <Plus size={16} />
            <span>+ Nueva Nota de Venta</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-emerald"
            style={{
              fontSize: '0.85rem',
              padding: '9px 18px',
              gap: '8px',
              fontWeight: 700,
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.35)'
            }}
          >
            <Save size={16} />
            <span>{isSaving ? 'Guardando...' : 'Guardar Orden del Día'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 12px' }}
            title="Imprimir hoja de ruta"
          >
            <Printer size={16} />
          </button>
        </div>
      </div>

      {/* Week Navigator & Day Tabs (Identical to Google Sheets tabs) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '18px'
      }}>
        {/* Day Pills / Tabs */}
        <div style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          background: 'var(--bg-tab-container)',
          padding: '5px',
          borderRadius: '14px',
          border: '1px solid var(--border-glass)',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.04)'
        }}>
          {weekDays.map(d => {
            const isActive = d.key === selectedDayKey;
            return (
              <button
                key={d.key}
                onClick={() => setSelectedDayKey(d.key)}
                className="btn"
                style={{
                  padding: '7px 15px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 800 : 700,
                  border: 'none',
                  background: isActive 
                    ? 'linear-gradient(135deg, #06b6d4, #0284c7)' 
                    : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: isActive ? '0 4px 14px rgba(6, 182, 212, 0.4)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{d.label}</span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: isActive ? 800 : 600,
                  padding: '2px 7px',
                  background: isActive ? 'rgba(0, 0, 0, 0.22)' : 'var(--border-subtle)',
                  color: isActive ? '#ffffff' : 'var(--text-faint)',
                  borderRadius: '6px',
                  boxShadow: isActive ? 'inset 0 1px 2px rgba(0, 0, 0, 0.15)' : 'none'
                }}>
                  {d.dateShort}
                </span>
              </button>
            );
          })}
        </div>

        {/* Week Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--bg-tab-container)',
          padding: '5px',
          borderRadius: '12px',
          border: '1px solid var(--border-glass)',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.04)'
        }}>
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="btn btn-secondary"
            style={{ padding: '6px 8px', border: 'none', color: 'var(--text-main)' }}
            title="Semana Anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="btn btn-secondary"
            style={{ padding: '4px 12px', fontSize: '0.78rem', border: 'none', fontWeight: 800, color: 'var(--text-main)' }}
          >
            Esta Semana
          </button>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="btn btn-secondary"
            style={{ padding: '6px 8px', border: 'none', color: 'var(--text-main)' }}
            title="Semana Siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {errorMsg && (
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
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Table: Exact Columns from Google Sheet reference */}
      <div className="data-table-container" style={{
        overflowX: 'auto',
        borderRadius: '12px',
        border: '1px solid var(--border-glass)',
        marginBottom: '20px'
      }}>
        <table className="data-table" style={{ fontSize: '0.82rem', width: '100%', minWidth: '1100px' }}>
          <thead>
            <tr>
              <th style={{ width: '45px', textAlign: 'center' }}>N°</th>
              <th style={{ minWidth: '220px' }}>ACTIVIDAD O CLIENTE</th>
              <th style={{ width: '90px', textAlign: 'center', background: 'rgba(6, 182, 212, 0.08)' }}>
                HORARIO MAÑANA
              </th>
              <th style={{ width: '90px', textAlign: 'center', background: 'rgba(6, 182, 212, 0.08)' }}>
                HORARIO TARDE
              </th>
              <th style={{ width: '130px', textAlign: 'center' }}>ESTADO</th>
              <th style={{ minWidth: '180px' }}>OBSERVACIONES</th>
              <th style={{ minWidth: '180px', color: 'var(--cyan-primary)' }}>OBSERVACIONES EXTRA</th>
              <th style={{ minWidth: '190px' }}>ESTADO DE CUENTA / TAREAS</th>
              <th style={{ width: '60px', textAlign: 'center' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                  Cargando la orden del día para {activeDay.dateFull}...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📝</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>No hay actividades ni pedidos programados para este día</div>
                  <div style={{ fontSize: '0.78rem', marginTop: '6px' }}>
                    Haz clic en <strong>"+ Agregar Fila"</strong> o en <strong>"Sincronizar Notas del Día"</strong> para importar las notas emitidas.
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                return (
                  <tr key={index}>
                    {/* N° */}
                    <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {index + 1}
                    </td>

                    {/* Actividad o Cliente */}
                    <td>
                      {row.sales_note_id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenSalesNote(row.sales_note_id)}
                            style={{
                              background: 'var(--bg-subtle-box, rgba(6, 182, 212, 0.08))',
                              border: '1px solid var(--border-glass)',
                              borderRadius: '9px',
                              padding: '7px 11px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '9px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s ease',
                              color: 'var(--text-main)',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              flex: 1,
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(6, 182, 212, 0.12)';
                              e.currentTarget.style.borderColor = 'var(--cyan-primary)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'var(--bg-subtle-box, rgba(6, 182, 212, 0.08))';
                              e.currentTarget.style.borderColor = 'var(--border-glass)';
                            }}
                            title="Toca para editar la nota (agregar/quitar productos, cambiar precios o cajas)"
                          >
                            <FileText size={16} color="var(--cyan-primary)" style={{ flexShrink: 0 }} />
                            <span style={{ 
                              flex: 1, 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap',
                              color: 'var(--text-main)',
                              fontWeight: 700
                            }}>
                              {(row.activity_or_customer || '').replace(/\s*\([A-Za-z0-9_-]+\)\s*$/, '') || 'Cliente'}
                            </span>
                            {row.sales_note_code && (
                              <span className="badge badge-cyan" style={{ fontSize: '0.72rem', padding: '2px 8px', flexShrink: 0, fontWeight: 700 }}>
                                {row.sales_note_code} ✏️
                              </span>
                            )}
                          </button>

                          {onOpenPrintNote && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/sales-notes/${row.sales_note_id}`).then(r => r.json());
                                  if (res.success && res.data) onOpenPrintNote(res.data);
                                } catch (err) {
                                  console.error('Error al cargar comprobante:', err);
                                }
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '7px 9px', borderRadius: '8px', flexShrink: 0 }}
                              title="Ver comprobante de impresión y WhatsApp"
                            >
                              <Printer size={15} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="text"
                            className="form-input"
                            value={row.activity_or_customer || ''}
                            placeholder="TIENDA, LISTA DE PEDIDO, CLIENTE..."
                            onChange={e => handleRowChange(index, 'activity_or_customer', e.target.value)}
                            style={{
                              padding: '7px 11px',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: 'var(--text-main)'
                            }}
                          />
                        </div>
                      )}
                    </td>

                    {/* Horario Mañana (Checkbox) */}
                    <td style={{ textAlign: 'center', background: 'rgba(6, 182, 212, 0.02)' }}>
                      <button
                        type="button"
                        onClick={() => handleRowChange(index, 'morning_shift', row.morning_shift ? 0 : 1)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: row.morning_shift ? 'var(--cyan-primary)' : 'var(--text-faint)',
                          padding: '4px'
                        }}
                        title={row.morning_shift ? 'Mañana: Marcado' : 'Mañana: Desmarcado'}
                      >
                        {row.morning_shift ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </td>

                    {/* Horario Tarde (Checkbox) */}
                    <td style={{ textAlign: 'center', background: 'rgba(6, 182, 212, 0.02)' }}>
                      <button
                        type="button"
                        onClick={() => handleRowChange(index, 'afternoon_shift', row.afternoon_shift ? 0 : 1)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: row.afternoon_shift ? 'var(--cyan-primary)' : 'var(--text-faint)',
                          padding: '4px'
                        }}
                        title={row.afternoon_shift ? 'Tarde: Marcado' : 'Tarde: Desmarcado'}
                      >
                        {row.afternoon_shift ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </td>

                    {/* Estado */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        <select
                          className="form-select"
                          value={row.status || 'EN PREPARACIÓN'}
                          onChange={e => handleRowChange(index, 'status', e.target.value)}
                          style={{
                            padding: '4px 6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            borderRadius: '8px',
                            background: 
                              row.status === 'ENTREGADO' ? 'rgba(16, 185, 129, 0.2)' :
                              row.status === 'EN CAMINO' ? 'rgba(6, 182, 212, 0.2)' :
                              row.status === 'EN PREPARACIÓN' ? 'rgba(99, 102, 241, 0.2)' :
                              row.status === 'PENDIENTE' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                            color:
                              row.status === 'ENTREGADO' ? 'var(--emerald-success)' :
                              row.status === 'EN CAMINO' ? 'var(--cyan-primary)' :
                              row.status === 'EN PREPARACIÓN' ? 'var(--indigo-brand)' :
                              row.status === 'PENDIENTE' ? 'var(--amber-warning)' : 'var(--text-main)',
                            borderColor:
                              row.status === 'ENTREGADO' ? 'rgba(16, 185, 129, 0.5)' :
                              row.status === 'EN CAMINO' ? 'rgba(6, 182, 212, 0.5)' :
                              row.status === 'EN PREPARACIÓN' ? 'rgba(99, 102, 241, 0.5)' : 'var(--border-glass)'
                          }}
                        >
                          <option value="EN PREPARACIÓN">EN PREPARACIÓN</option>
                          <option value="EN CAMINO">EN CAMINO</option>
                          <option value="IMPRESO">IMPRESO</option>
                          <option value="ENTREGADO">ENTREGADO</option>
                          <option value="PENDIENTE">PENDIENTE</option>
                          <option value="CANCELADO">CANCELADO</option>
                        </select>

                        {/* Botón rápido para marcar ENTREGADO y liquidar si tiene nota y aún no está entregado */}
                        {row.sales_note_id && row.status !== 'ENTREGADO' && (
                          <button
                            type="button"
                            onClick={() => setDeliveryModalRow(row)}
                            className="btn btn-emerald"
                            style={{
                              padding: '3px 8px',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 0 10px rgba(16, 185, 129, 0.35)',
                              cursor: 'pointer'
                            }}
                            title="Confirmar entrega de mercadería y liquidar cobro / deuda"
                          >
                            <Truck size={12} />
                            <span>Entregar</span>
                          </button>
                        )}
                        {row.status === 'ENTREGADO' && (
                          <span style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={11} /> Entregado
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Observaciones */}
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        value={row.observations || ''}
                        placeholder="Observación de entrega..."
                        onChange={e => handleRowChange(index, 'observations', e.target.value)}
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      />
                    </td>

                    {/* Observaciones Extra (Highlighted with subtle cyan font like Google Sheets) */}
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        value={row.extra_observations || ''}
                        placeholder="Descontar extra, flete..."
                        onChange={e => handleRowChange(index, 'extra_observations', e.target.value)}
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.8rem',
                          color: 'var(--cyan-primary)',
                          fontWeight: 600
                        }}
                      />
                    </td>

                    {/* ESTADO DE CUENTA / TAREAS */}
                    <td>
                      {(() => {
                        const acc = getAccountStatus(row);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {acc && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <div 
                                  onClick={() => row.sales_note_id && handleOpenSalesNote(row.sales_note_id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: acc.bg,
                                    border: `1px solid ${acc.border}`,
                                    borderRadius: '7px',
                                    padding: '4px 8px',
                                    fontSize: '0.72rem',
                                    color: acc.color,
                                    fontWeight: 800,
                                    letterSpacing: '0.04em',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    flex: 1
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.filter = 'brightness(1.15)';
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.filter = 'none';
                                  }}
                                  title="Estado de cuenta dinámico de la nota (Tocar para ver nota)"
                                >
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{
                                      width: '6px',
                                      height: '6px',
                                      borderRadius: '50%',
                                      background: acc.color,
                                      display: 'inline-block'
                                    }} />
                                    <span>{acc.label}</span>
                                    {acc.dueDetail && (
                                      <span style={{ fontSize: '0.64rem', opacity: 0.8, fontWeight: 600 }}>
                                        ({acc.dueDetail})
                                      </span>
                                    )}
                                  </span>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.95, fontFamily: 'monospace' }}>
                                    {acc.detail}
                                  </span>
                                </div>

                                {/* Quick payment button if pending balance */}
                                {onOpenAddPayment && Number(row.note_balance ?? 0) > 0 && row.note_status !== 'ANULADO' && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!row.sales_note_id) return;
                                      try {
                                        const res = await fetch(`/api/sales-notes/${row.sales_note_id}`).then(r => r.json());
                                        if (res.success && res.data) {
                                          onOpenAddPayment(res.data);
                                        }
                                      } catch (err) {
                                        console.error('Error al abrir abono:', err);
                                      }
                                    }}
                                    className="btn btn-emerald"
                                    style={{ padding: '4px 7px', fontSize: '0.7rem', borderRadius: '6px', flexShrink: 0 }}
                                    title="Registrar Abono / Cobro rápido"
                                  >
                                    <DollarSign size={13} />
                                  </button>
                                )}
                              </div>
                            )}

                            <input
                              type="text"
                              className="form-input"
                              value={row.pending_tasks || ''}
                              placeholder={acc ? "Tarea operativa adicional..." : "Tarea logística pendiente..."}
                              onChange={e => handleRowChange(index, 'pending_tasks', e.target.value)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.76rem',
                                background: 'rgba(0, 0, 0, 0.25)',
                                borderRadius: '6px'
                              }}
                            />
                          </div>
                        );
                      })()}
                    </td>

                    {/* Acciones */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className="btn btn-secondary"
                        style={{ padding: '6px', color: '#fb7185', border: 'none' }}
                        title="Eliminar fila"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Table footer with manual row addition */}
        <div style={{
          padding: '10px 16px',
          background: 'var(--bg-subtle-box)',
          borderTop: '1px solid var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <button
            type="button"
            onClick={handleAddRow}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px', gap: '6px' }}
            title="Agregar fila manual a la planilla"
          >
            <Plus size={14} color="var(--emerald-success)" />
            <span>+ Agregar Fila Manual</span>
          </button>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Total actividades / pedidos hoy: <strong style={{ color: 'var(--text-main)' }}>{rows.length}</strong>
          </span>
        </div>
      </div>

      {/* Auxiliary Sections Grid (Columns I, J, K, L) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginTop: '16px'
      }}>
        {/* 1. PENDIENTES POR ENTREGAR */}
        <div style={{
          background: 'var(--bg-subtle-box)',
          border: '1px solid rgba(244, 63, 94, 0.25)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--rose-danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>PENDIENTES POR ENTREGAR</span>
              <span className="badge badge-rose" style={{ fontSize: '0.68rem' }}>{pendientesList.length}</span>
            </div>
            <button
              onClick={() => handleAddSideItem('PENDIENTES')}
              className="btn btn-secondary"
              style={{ fontSize: '0.72rem', padding: '4px 8px', gap: '4px' }}
            >
              <Plus size={12} />
              <span>Añadir</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendientesList.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                Sin entregas pendientes registradas
              </div>
            ) : (
              pendientesList.map((item, idx) => {
                const realIndex = sideItems.indexOf(item);
                return (
                  <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Cliente o pedido..."
                      value={item.title || ''}
                      onChange={e => handleSideItemChange(realIndex, 'title', e.target.value)}
                      style={{ fontSize: '0.78rem', padding: '5px 8px', flex: 1 }}
                    />
                    <select
                      className="form-select"
                      value={item.status || 'PENDIENTE'}
                      onChange={e => handleSideItemChange(realIndex, 'status', e.target.value)}
                      style={{ width: '100px', fontSize: '0.72rem', padding: '4px' }}
                    >
                      <option value="PENDIENTE">PENDIENTE</option>
                      <option value="EN RUTA">EN RUTA</option>
                      <option value="ENTREGADO">ENTREGADO</option>
                    </select>
                    <button
                      onClick={() => handleRemoveSideItem(realIndex)}
                      className="btn btn-secondary"
                      style={{ padding: '4px', border: 'none', color: '#fb7185' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. LISTAS POR HACER */}
        <div style={{
          background: 'var(--bg-subtle-box)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--indigo-brand)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>LISTAS POR HACER</span>
              <span className="badge badge-indigo" style={{ fontSize: '0.68rem' }}>{tareasHacerList.length}</span>
            </div>
            <button
              onClick={() => handleAddSideItem('LISTAS_HACER')}
              className="btn btn-secondary"
              style={{ fontSize: '0.72rem', padding: '4px 8px', gap: '4px' }}
            >
              <Plus size={12} />
              <span>Añadir</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tareasHacerList.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                Sin tareas logísticas en lista
              </div>
            ) : (
              tareasHacerList.map((item, idx) => {
                const realIndex = sideItems.indexOf(item);
                return (
                  <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Tarea o lista de empaque..."
                      value={item.title || ''}
                      onChange={e => handleSideItemChange(realIndex, 'title', e.target.value)}
                      style={{ fontSize: '0.78rem', padding: '5px 8px', flex: 1, color: 'var(--text-main)' }}
                    />
                    <button
                      onClick={() => handleRemoveSideItem(realIndex)}
                      className="btn btn-secondary"
                      style={{ padding: '4px', border: 'none', color: '#fb7185' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. CORRECCIONES DE NOTAS */}
        <div style={{
          background: 'var(--bg-subtle-box)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--amber-warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>CORRECCIONES DE NOTAS</span>
              <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>{correccionesList.length}</span>
            </div>
            <button
              onClick={() => handleAddSideItem('CORRECCIONES')}
              className="btn btn-secondary"
              style={{ fontSize: '0.72rem', padding: '4px 8px', gap: '4px' }}
            >
              <Plus size={12} />
              <span>Añadir</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {correccionesList.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                Sin correcciones registradas para hoy
              </div>
            ) : (
              correccionesList.map((item, idx) => {
                const realIndex = sideItems.indexOf(item);
                return (
                  <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: XIMENA SILES - corregir precio..."
                      value={item.title || ''}
                      onChange={e => handleSideItemChange(realIndex, 'title', e.target.value)}
                      style={{ fontSize: '0.78rem', padding: '5px 8px', flex: 1, color: 'var(--amber-warning)', fontWeight: 600 }}
                    />
                    <button
                      onClick={() => handleRemoveSideItem(realIndex)}
                      className="btn btn-secondary"
                      style={{ padding: '4px', border: 'none', color: '#fb7185' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 4. NOTAS EN ESPERA DE RESERVA (PRE-RESERVAS POR CAMIÓN QUE ESTÁ LLEGANDO) */}
        <div style={{
          background: 'var(--bg-subtle-box)',
          border: '1.5px solid rgba(6, 182, 212, 0.35)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--cyan-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Truck size={15} color="var(--cyan-primary)" />
              <span>NOTAS EN ESPERA DE RESERVA</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.68rem', background: 'rgba(6, 182, 212, 0.18)', color: 'var(--cyan-primary)', border: '1px solid rgba(6, 182, 212, 0.35)' }}>
                {totalEsperaCount}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {onNavigateToContainers && (
                <button
                  onClick={onNavigateToContainers}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.70rem', padding: '3px 7px', gap: '4px', color: 'var(--text-muted)' }}
                  title="Ver módulo de Camiones y Embarques"
                >
                  <ExternalLink size={11} />
                  <span>Embarques</span>
                </button>
              )}
              <button
                onClick={() => handleAddSideItem('ESPERA_RESERVA')}
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '4px 8px', gap: '4px' }}
                title="Añadir nota manual en espera"
              >
                <Plus size={12} />
                <span>Añadir</span>
              </button>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: '340px',
            overflowY: 'auto',
            paddingRight: '4px'
          }}>
            {/* Si no hay nada */}
            {truckGroups.length === 0 && esperaReservaSideList.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                <Clock size={20} style={{ margin: '0 auto 6px', display: 'block', opacity: 0.5 }} />
                Sin listas ni notas en espera de reserva para camiones en camino
              </div>
            ) : null}

            {/* Listas de pre-reservas creadas en cada camión que está llegando */}
            {truckGroups.map((truck) => (
              <div 
                key={truck.containerId}
                style={{
                  background: 'rgba(6, 182, 212, 0.05)',
                  border: '1px solid rgba(6, 182, 212, 0.22)',
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {/* Cabecera del Camión / Embarque */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '6px',
                  borderBottom: '1px dashed rgba(6, 182, 212, 0.25)',
                  fontSize: '0.74rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--cyan-primary)' }}>
                    <Truck size={13} />
                    <span>
                      {truck.transportType === 'TERRESTRE' ? 'Camión' : 'Embarque'}: {truck.trackingNumber}
                    </span>
                    {truck.truckPlate && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        ({truck.truckPlate})
                      </span>
                    )}
                  </div>
                  <span className="badge badge-cyan" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                    {truck.containerStatus === 'camion_transito' ? 'En Camino' : (truck.containerStatus || 'En Tránsito')}
                  </span>
                </div>

                {/* Clientes con listas de pre-reserva en este camión */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {truck.clientsList.map((client, cIdx) => {
                    const totalBoxes = client.items.reduce((s, it) => s + (Number(it.reserved_boxes) || 0), 0);
                    return (
                      <div 
                        key={cIdx}
                        style={{
                          background: 'var(--bg-glass-card, rgba(255, 255, 255, 0.03))',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '8px',
                          padding: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '5px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            👤 {client.customerName}
                          </span>
                          <span style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--cyan-primary)' }}>
                            {totalBoxes} cj reservadas
                          </span>
                        </div>

                        {client.customerPhone && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            📞 Tel: {client.customerPhone}
                          </div>
                        )}

                        {/* Detalle de productos de la lista de pre-reserva */}
                        <div style={{ marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {client.items.map((it, itemIdx) => (
                            <div 
                              key={itemIdx}
                              style={{ 
                                fontSize: '0.70rem', 
                                color: 'var(--text-muted)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                background: 'rgba(0,0,0,0.08)',
                                padding: '3px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
                                <span style={{ fontWeight: 700, color: 'var(--cyan-primary)', minWidth: '32px' }}>
                                  {it.reserved_boxes} cj
                                </span>
                                <strong style={{ color: 'var(--text-main)' }}>{it.product_code}</strong>
                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }} title={it.product_name}>
                                  {it.product_name}
                                </span>
                              </div>
                              {it.price_agreed > 0 && (
                                <span style={{ fontSize: '0.66rem', color: 'var(--emerald-success)', fontWeight: 600 }}>
                                  Bs {it.price_agreed}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Botón para pasar a la orden del día */}
                        <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleAddTruckReservationToDaily(truck, client)}
                            className="btn btn-secondary"
                            style={{
                              fontSize: '0.68rem',
                              padding: '3px 8px',
                              gap: '4px',
                              color: 'var(--cyan-primary)',
                              borderColor: 'rgba(6, 182, 212, 0.4)',
                              background: 'rgba(6, 182, 212, 0.08)'
                            }}
                            title="Agregar este cliente a la orden del día de entregas"
                          >
                            <Plus size={11} />
                            <span>Pasar a Orden del Día</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Memos y notas manuales adicionales creadas por el usuario */}
            {esperaReservaSideList.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: truckGroups.length > 0 ? '6px' : '0' }}>
                {truckGroups.length > 0 && (
                  <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Notas manuales en espera:
                  </div>
                )}
                {esperaReservaSideList.map((item, idx) => {
                  const realIndex = sideItems.indexOf(item);
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Nota o lista en espera de reserva..."
                        value={item.title || ''}
                        onChange={e => handleSideItemChange(realIndex, 'title', e.target.value)}
                        style={{ fontSize: '0.78rem', padding: '5px 8px', flex: 1, color: 'var(--cyan-primary)', fontWeight: 600 }}
                      />
                      <button
                        onClick={() => handleRemoveSideItem(realIndex)}
                        className="btn btn-secondary"
                        style={{ padding: '4px', border: 'none', color: '#fb7185' }}
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmación rápida de entrega y liquidación */}
      <DeliveryConfirmModal
        isOpen={!!deliveryModalRow}
        onClose={() => setDeliveryModalRow(null)}
        row={deliveryModalRow}
        onDeliverySuccess={() => {
          fetchDailyOrders();
          setToast('¡Entrega y liquidación registradas con éxito!');
          setTimeout(() => setToast(''), 4000);
        }}
      />
    </div>
  );
}
