import React, { useState, useRef } from 'react';
import { 
  X, 
  Ship, 
  Truck,
  MapPin, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  Anchor,
  Navigation,
  Upload,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function NewContainerModal({ isOpen, onClose, onContainerCreated }) {
  const [transportType, setTransportType] = useState('MARITIMO'); // 'MARITIMO' o 'TERRESTRE'
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingLine, setShippingLine] = useState('MSC Mediterranean Shipping');
  const [originCountry, setOriginCountry] = useState('China (Ningbo)');
  const [portName, setPortName] = useState('Arica (Chile)');
  const [truckPlate, setTruckPlate] = useState('');
  const [truckDriver, setTruckDriver] = useState('');
  const [status, setStatus] = useState('mar_transito');
  const [departureDate, setDepartureDate] = useState('');
  const [portArrivalDate, setPortArrivalDate] = useState('');
  const [estimatedArrival, setEstimatedArrival] = useState('');
  const [totalFob, setTotalFob] = useState('');
  const [totalFreight, setTotalFreight] = useState('');
  const [totalTaxes, setTotalTaxes] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Excel Prelista state
  const [excelFile, setExcelFile] = useState(null);
  const [parsedItems, setParsedItems] = useState([]);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleTypeChange = (type) => {
    setTransportType(type);
    if (type === 'TERRESTRE') {
      setOriginCountry('Frontera / Terrestre');
      setShippingLine('Transporte Terrestre');
      setStatus('camion_transito');
    } else {
      setOriginCountry('China (Ningbo)');
      setShippingLine('MSC Mediterranean Shipping');
      setStatus('mar_transito');
    }
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (rawJson.length < 2) {
          throw new Error('La hoja seleccionada está vacía.');
        }

        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(10, rawJson.length); i++) {
          const rowStr = rawJson[i].map(c => String(c).toUpperCase()).join(' ');
          if (rowStr.includes('DETALLE') || rowStr.includes('CODIGO') || rowStr.includes('CAJAS')) {
            headerRowIdx = i;
            break;
          }
        }

        const headers = rawJson[headerRowIdx].map(h => String(h).trim().toUpperCase());
        const findCol = (...names) => headers.findIndex(h => names.some(n => h.includes(n.toUpperCase())));

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

        const items = [];
        for (let r = headerRowIdx + 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;

          const detalle = colDetalle !== -1 ? String(row[colDetalle] || '').trim() : '';
          const codigo = colCodigo !== -1 ? String(row[colCodigo] || '').trim().toUpperCase() : '';
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
          const num = colNum !== -1 ? parseNum(row[colNum]) : items.length + 1;

          items.push({
            num: num || items.length + 1,
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

        if (items.length === 0) {
          throw new Error('No se detectaron productos válidos en el archivo Excel.');
        }

        setParsedItems(items);
      } catch (err) {
        setErrorMessage('Error al leer Excel: ' + err.message);
        setExcelFile(null);
        setParsedItems([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleClearExcel = () => {
    setExcelFile(null);
    setParsedItems([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!trackingNumber.trim()) {
      setErrorMessage(transportType === 'MARITIMO' ? 'N° de Contenedor o BL es obligatorio.' : 'N° de Placa o Manifiesto de Camión es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transport_type: transportType,
          tracking_number: trackingNumber.trim().toUpperCase(),
          origin_country: originCountry,
          shipping_line: shippingLine,
          port_name: transportType === 'MARITIMO' ? portName : '',
          truck_plate: truckPlate.trim().toUpperCase(),
          truck_driver: truckDriver.trim(),
          status,
          departure_date: departureDate || null,
          port_arrival_date: portArrivalDate || null,
          estimated_arrival: estimatedArrival || null,
          total_fob: parseFloat(totalFob) || 0,
          total_freight: parseFloat(totalFreight) || 0,
          total_taxes: parseFloat(totalTaxes) || 0,
          notes
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Error al guardar embarque');
      }

      const newContainerId = data.id;

      // If prelista was attached, save items to this container immediately
      if (parsedItems.length > 0 && newContainerId) {
        const bulkRes = await fetch(`/api/containers/${newContainerId}/items/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: parsedItems,
            replaceExisting: true
          })
        });
        const bulkData = await bulkRes.json();
        if (!bulkData.success) {
          console.warn('Aviso al guardar prelista:', bulkData.error);
        }
      }

      if (onContainerCreated) {
        onContainerCreated(newContainerId);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: transportType === 'MARITIMO' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              border: `1px solid ${transportType === 'MARITIMO' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: transportType === 'MARITIMO' ? 'var(--cyan-primary)' : '#f59e0b'
            }}>
              {transportType === 'MARITIMO' ? <Ship size={22} /> : <Truck size={22} />}
            </div>
            <div>
              <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                Registrar Nuevo Embarque / Carga
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Control logístico de importación marítima o transporte terrestre
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px', border: 'none' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          
          {/* Modalidad de Transporte Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
              Tipo de Transporte / Modalidad
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={() => handleTypeChange('MARITIMO')}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: transportType === 'MARITIMO' ? '2px solid var(--cyan-primary)' : '1px solid var(--border-glass)',
                  background: transportType === 'MARITIMO' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  color: transportType === 'MARITIMO' ? '#38bdf8' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Ship size={24} color={transportType === 'MARITIMO' ? 'var(--cyan-primary)' : '#94a3b8'} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: transportType === 'MARITIMO' ? '#f8fafc' : '#cbd5e1' }}>
                    🚢 Marítimo + Camión
                  </div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                    China / Ultramar ➔ Puerto ➔ Camión a Almacén
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('TERRESTRE')}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: transportType === 'TERRESTRE' ? '2px solid #f59e0b' : '1px solid var(--border-glass)',
                  background: transportType === 'TERRESTRE' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  color: transportType === 'TERRESTRE' ? '#fbbf24' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Truck size={24} color={transportType === 'TERRESTRE' ? '#f59e0b' : '#94a3b8'} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: transportType === 'TERRESTRE' ? '#f8fafc' : '#cbd5e1' }}>
                    🚛 Camión Directo
                  </div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                    Frontera / Nacional directo a Almacén
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Identification fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label className="form-label">
                {transportType === 'MARITIMO' ? 'N° Contenedor / BL *' : 'Placa Camión / N° Manifiesto *'}
              </label>
              <input
                type="text"
                className="form-input mono"
                placeholder={transportType === 'MARITIMO' ? 'MSCU9847120 / TGHU...' : '4021-XRP / GUIA-981'}
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">
                {transportType === 'MARITIMO' ? 'Naviera / Línea de Carga' : 'Empresa Transportista / Chofer'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={transportType === 'MARITIMO' ? 'MSC, Maersk, Evergreen, COSCO' : 'Trans Bol, Transportes San Juan...'}
                value={shippingLine}
                onChange={(e) => setShippingLine(e.target.value)}
              />
            </div>
          </div>

          {/* Route details */}
          <div style={{ display: 'grid', gridTemplateColumns: transportType === 'MARITIMO' ? '1fr 1fr' : '1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label className="form-label">Origen de la Mercadería</label>
              <input
                type="text"
                className="form-input"
                placeholder={transportType === 'MARITIMO' ? 'China (Ningbo / Yiwu / Shenzhen)' : 'Frontera Yacuiba / Desaguadero / Local'}
                value={originCountry}
                onChange={(e) => setOriginCountry(e.target.value)}
              />
            </div>
            {transportType === 'MARITIMO' && (
              <div>
                <label className="form-label">Puerto de Arribo / Desaduanaje</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Arica (Chile), Iquique o Callao"
                  value={portName}
                  onChange={(e) => setPortName(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Tramo Terrestre del Marítimo (Camión de conexión desde Puerto) */}
          {transportType === 'MARITIMO' && (
            <div style={{
              background: 'rgba(2, 132, 199, 0.08)',
              border: '1px solid rgba(2, 132, 199, 0.25)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--cyan-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={15} /> Tramo Terrestre de Enlace (Camión Puerto ➔ Almacén Bolivia):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Placa de Camión (Opcional)</label>
                  <input
                    type="text"
                    className="form-input mono"
                    placeholder="Ej. 2841-KLP"
                    value={truckPlate}
                    onChange={(e) => setTruckPlate(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Chofer / Transportista</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Don Carlos / Trans Andina"
                    value={truckDriver}
                    onChange={(e) => setTruckDriver(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Status selector */}
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Estado Inicial del Envío</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              {transportType === 'MARITIMO' ? (
                <>
                  <option value="mar_transito">🌊 En Altamar (Barco en navegación internacional)</option>
                  <option value="puerto_aduana">⚓ En Puerto / Proceso Aduanero</option>
                  <option value="camion_transito">🚛 En Camión (En tránsito terrestre hacia Almacén)</option>
                  <option value="recibido">✅ Recibido en Bodega / Descargado</option>
                </>
              ) : (
                <>
                  <option value="camion_transito">🚛 En Carretera / Tránsito Terrestre</option>
                  <option value="aduana_frontera">🛂 En Aduana de Frontera</option>
                  <option value="recibido">✅ Recibido en Bodega / Descargado</option>
                </>
              )}
            </select>
          </div>

          {/* Dates row */}
          <div style={{ display: 'grid', gridTemplateColumns: transportType === 'MARITIMO' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label className="form-label">{transportType === 'MARITIMO' ? 'Fecha Zarpe (China)' : 'Fecha Salida'}</label>
              <input
                type="date"
                className="form-input"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
              />
            </div>
            {transportType === 'MARITIMO' && (
              <div>
                <label className="form-label">Llegada a Puerto</label>
                <input
                  type="date"
                  className="form-input"
                  value={portArrivalDate}
                  onChange={(e) => setPortArrivalDate(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="form-label">Llegada Estimada Almacén</label>
              <input
                type="date"
                className="form-input"
                value={estimatedArrival}
                onChange={(e) => setEstimatedArrival(e.target.value)}
              />
            </div>
          </div>

          {/* Economic financials */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label className="form-label">FOB Mercancía ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="0.00"
                value={totalFob}
                onChange={(e) => setTotalFob(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Flete Total ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="0.00"
                value={totalFreight}
                onChange={(e) => setTotalFreight(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Aduana / Impuestos ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="0.00"
                value={totalTaxes}
                onChange={(e) => setTotalTaxes(e.target.value)}
              />
            </div>
          </div>

          {/* Excel Prelista File Upload Section */}
          <div style={{
            background: parsedItems.length > 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(6, 182, 212, 0.06)',
            border: parsedItems.length > 0 ? '1px solid rgba(16, 185, 129, 0.35)' : '1px dashed rgba(6, 182, 212, 0.4)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '18px',
            transition: 'all 0.2s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={18} color={parsedItems.length > 0 ? '#10b981' : 'var(--cyan-primary)'} />
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc' }}>
                  Adjuntar Prelista de Carga (Excel)
                </span>
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.2)', color: 'var(--cyan-primary)' }}>
                  Recomendado
                </span>
              </div>

              {parsedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearExcel}
                  className="btn btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '0.72rem', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)' }}
                >
                  <X size={12} /> Quitar
                </button>
              )}
            </div>

            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Sube la hoja Excel del embarque o camión con las columnas (Detalle, Código, Cajas, Costo, Precios). Al registrar, se cargarán todos los productos automáticamente.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls"
              onChange={handleExcelUpload}
              style={{ display: 'none' }}
            />

            {parsedItems.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1px dashed var(--border-glass)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Upload size={22} color="var(--cyan-primary)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
                  Hacer clic para seleccionar archivo Excel (.xlsx / .xls)
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Ejemplo: Tu hoja de cálculo con la prelista de importación
                </span>
              </div>
            ) : (
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="#10b981" />
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: '#f8fafc', display: 'block' }}>
                      {excelFile?.name}
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: '#34d399' }}>
                      {parsedItems.length} productos detectados • {parsedItems.reduce((acc, it) => acc + (Number(it.boxes) || 0), 0)} cajas en total
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                >
                  Cambiar archivo
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">Notas u Observaciones del Lote</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. Hoja 51 de importación, mercadería de herramientas UYUS, agente Juan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Error */}
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
              fontSize: '0.82rem',
              color: '#fb7185'
            }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ padding: '10px 24px' }}>
              {isSubmitting ? 'Guardando...' : 'Registrar Embarque'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
