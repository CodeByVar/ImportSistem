import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  UploadCloud,
  Package,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ArrowDownLeft,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function BatchLotImportModal({ isOpen, onClose, onBatchSuccess, containers = [] }) {
  const [step, setStep] = useState('upload');
  const [items, setItems] = useState([]);
  const [fileName, setFileName] = useState('');
  const [reference, setReference] = useState('');
  const [partyName, setPartyName] = useState('Proveedor / Fábrica');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [containerId, setContainerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [batchResult, setBatchResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [showSkipped, setShowSkipped] = useState(false);

  if (!isOpen) return null;

  const processExcelFile = (file) => {
    setErrorMsg('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', raw: false });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
        if (!rows || rows.length < 2) { setErrorMsg('Archivo vacío o sin suficientes filas.'); return; }
        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          if (rows[i].filter(c => c && c.toString().trim()).length >= 3) { headerRowIdx = i; break; }
        }
        const headers = rows[headerRowIdx].map(h => (h || '').toString().toLowerCase().trim());
        const findCol = (...kws) => { for (const kw of kws) { const idx = headers.findIndex(h => h.includes(kw)); if (idx !== -1) return idx; } return -1; };
        const skuCol = findCol('codigo', 'código', 'sku', 'cod', 'code', 'referencia');
        const nameCol = findCol('detalle', 'nombre', 'producto', 'descrip', 'item', 'name');
        const qtyBoxesCol = findCol('cant', 'caja', 'box', 'qty', 'q.l', 'cantidad');
        const upbCol = findCol('u/', 'unid', 'pza', 'por caja', 'x caja', 'u/cj', 'upb');
        const costCol = findCol('costo', 'cost', 'precio fob', 'fob', 'landed');
        const totalUnitsCol = findCol('total uni', 'total unit', 'unidades totales');
        const parsed = [];
        for (let r = headerRowIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          const sku = skuCol >= 0 ? row[skuCol] : '';
          const name = nameCol >= 0 ? row[nameCol] : '';
          if (!sku && !name) continue;
          const s = (sku || '').toString().toLowerCase();
          if (s.includes('total') || s.includes('subtotal')) continue;
          const boxes = parseInt(qtyBoxesCol >= 0 ? row[qtyBoxesCol] : 0, 10) || 0;
          const upb = parseInt(upbCol >= 0 ? row[upbCol] : 1, 10) || 1;
          let totalUnits = totalUnitsCol >= 0 ? parseInt(row[totalUnitsCol], 10) || 0 : 0;
          if (!totalUnits) totalUnits = boxes * upb || 1;
          const cost = parseFloat((costCol >= 0 ? row[costCol] : '0') || '0') || 0;
          parsed.push({ _rowIdx: r, sku: (sku || '').toString().trim().toUpperCase(), name: (name || '').toString().trim(), boxes, upb, quantity: totalUnits, unit_cost: cost, notes: '' });
        }
        if (parsed.length === 0) { setErrorMsg('No se encontraron filas válidas.'); return; }
        setItems(parsed);
        setStep('preview');
      } catch (err) { setErrorMsg('Error al leer el archivo: ' + err.message); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileInput = (e) => { const f = e.target.files[0]; if (f) processExcelFile(f); };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) processExcelFile(f); };
  const updateItem = (idx, field, value) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleConfirm = async () => {
    const validItems = items.filter(it => it.quantity > 0 && (it.sku || it.name));
    if (!validItems.length) { setErrorMsg('No hay ítems válidos.'); return; }
    setIsSubmitting(true); setErrorMsg('');
    try {
      const res = await fetch('/api/movements/batch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: validItems.map(it => ({ sku: it.sku || null, quantity: Number(it.quantity), unit_cost: Number(it.unit_cost), notes: it.notes || '' })),
          reference: reference || `LOTE-EXCEL-${Date.now().toString().slice(-6)}`,
          party_name: partyName, date: entryDate,
          container_id: containerId ? Number(containerId) : null
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error al procesar lote');
      setBatchResult(data.data); setStep('result');
      if (onBatchSuccess) onBatchSuccess();
    } catch (err) { setErrorMsg(err.message); } finally { setIsSubmitting(false); }
  };

  const handleReset = () => { setStep('upload'); setItems([]); setFileName(''); setErrorMsg(''); setBatchResult(null); setReference(''); setPartyName('Proveedor / Fábrica'); setEntryDate(new Date().toISOString().split('T')[0]); setContainerId(''); };

  const totalInversion = items.reduce((s, it) => s + (it.quantity * it.unit_cost), 0);
  const totalUnitsPreview = items.reduce((s, it) => s + Number(it.quantity || 0), 0);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '820px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-card,#0f1829)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
              <ArrowDownLeft size={22} />
            </div>
            <div>
              <h3 className="font-heading" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Entrada Masiva de Lote — Desde Excel</h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
                {step === 'upload' && 'Sube tu prelista de contenedor para ingresar todo el stock de una vez'}
                {step === 'preview' && `${items.length} productos detectados — Revisa y confirma`}
                {step === 'result' && '¡Lote procesado con éxito! ✅'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px', border: 'none' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '24px' }}>
          {step === 'upload' && (
            <div>
              <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
                style={{ border: `2px dashed ${dragOver ? '#34d399' : 'rgba(16,185,129,0.4)'}`, borderRadius: '16px', padding: '48px 24px', textAlign: 'center', background: dragOver ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.04)', transition: 'all 0.2s ease', cursor: 'pointer', marginBottom: '24px' }}
                onClick={() => document.getElementById('batch-file-input').click()}>
                <FileSpreadsheet size={48} color={dragOver ? '#34d399' : 'rgba(16,185,129,0.5)'} style={{ marginBottom: '16px' }} />
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>Arrastra tu Excel de prelista aquí</div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px' }}>o haz clic para seleccionar (.xlsx, .xls, .csv)</div>
                <div className="btn btn-emerald" style={{ display: 'inline-flex', gap: '8px', padding: '10px 24px' }}><UploadCloud size={18} />Seleccionar Archivo</div>
                <input id="batch-file-input" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileInput} style={{ display: 'none' }} />
              </div>
              <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <Info size={18} color="var(--cyan-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--cyan-primary)' }}>Columnas detectadas automáticamente:</strong><br />
                  Busca columnas de <strong>CÓDIGO/SKU</strong>, <strong>DETALLE/NOMBRE</strong>, <strong>CANTIDAD EN CAJAS</strong>, <strong>U/CAJA</strong> y <strong>COSTO</strong>.<br />
                  Compatible con tu Excel de Inventario UYUS, prelistas y cualquier formato estándar.
                </div>
              </div>
              {errorMsg && <div style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '10px', padding: '12px 16px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#fb7185' }}><AlertCircle size={16} /><span>{errorMsg}</span></div>}
            </div>
          )}

          {step === 'preview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div><label className="form-label">N° Referencia / BL</label><input type="text" className="form-input" placeholder="BL-9847" value={reference} onChange={e => setReference(e.target.value)} /></div>
                <div><label className="form-label">Proveedor / Origen</label><input type="text" className="form-input" value={partyName} onChange={e => setPartyName(e.target.value)} /></div>
                <div><label className="form-label">Fecha de Ingreso</label><input type="date" className="form-input" value={entryDate} onChange={e => setEntryDate(e.target.value)} /></div>
              </div>
              {containers.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <label className="form-label">Vincular a Embarque (opcional)</label>
                  <select className="form-select" value={containerId} onChange={e => setContainerId(e.target.value)}>
                    <option value="">— Sin contenedor asociado —</option>
                    {containers.map(c => <option key={c.id} value={c.id}>{c.tracking_number} — {c.status}</option>)}
                  </select>
                </div>
              )}
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '12px 18px', marginBottom: '14px', display: 'flex', gap: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Productos</div><div style={{ fontWeight: 800, color: '#34d399', fontFamily: 'monospace', fontSize: '1.15rem' }}>{items.length}</div></div>
                <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Unidades</div><div style={{ fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace', fontSize: '1.15rem' }}>{totalUnitsPreview.toLocaleString()}</div></div>
                <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inversión Total ($)</div><div style={{ fontWeight: 800, color: 'var(--cyan-primary)', fontFamily: 'monospace', fontSize: '1.15rem' }}>${totalInversion.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></div>
                <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>📄 {fileName}</div>
              </div>
              <div className="data-table-container" style={{ marginBottom: '18px', maxHeight: '340px', overflowY: 'auto' }}>
                <table className="data-table" style={{ fontSize: '0.8rem' }}>
                  <thead><tr>
                    <th style={{ width: '120px' }}>SKU / CÓDIGO</th>
                    <th>DETALLE / NOMBRE</th>
                    <th style={{ textAlign: 'center', width: '90px' }}>CANT. (u)</th>
                    <th style={{ textAlign: 'center', width: '100px' }}>COSTO ($)</th>
                    <th style={{ textAlign: 'right', width: '95px' }}>SUBTOTAL</th>
                    <th style={{ width: '36px' }}></th>
                  </tr></thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx}>
                        <td><input type="text" className="form-input" value={it.sku} onChange={e => updateItem(idx, 'sku', e.target.value.toUpperCase())} style={{ fontFamily: 'monospace', fontSize: '0.76rem', padding: '4px 8px', width: '100%' }} placeholder="SKU" /></td>
                        <td><input type="text" className="form-input" value={it.name} onChange={e => updateItem(idx, 'name', e.target.value)} style={{ fontSize: '0.76rem', padding: '4px 8px', width: '100%' }} placeholder="Nombre" /></td>
                        <td><input type="number" min="1" className="form-input" value={it.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} style={{ textAlign: 'center', padding: '4px 6px', fontFamily: 'monospace', fontWeight: 700, width: '80px' }} /></td>
                        <td><input type="number" min="0" step="0.01" className="form-input" value={it.unit_cost} onChange={e => updateItem(idx, 'unit_cost', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center', padding: '4px 6px', fontFamily: 'monospace', width: '90px' }} /></td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'var(--cyan-primary)' }}>${(it.quantity * it.unit_cost).toFixed(2)}</td>
                        <td><button type="button" onClick={() => removeItem(idx)} className="btn btn-secondary" style={{ padding: '4px 6px', color: '#fb7185' }}><Trash2 size={13} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {errorMsg && <div style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#fb7185' }}><AlertCircle size={16} /><span>{errorMsg}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" onClick={handleReset} className="btn btn-secondary" style={{ gap: '6px' }}><RefreshCw size={15} />Cargar otro archivo</button>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>Cancelar</button>
                  <button type="button" onClick={handleConfirm} className="btn btn-emerald" disabled={isSubmitting || items.length === 0} style={{ padding: '10px 28px', gap: '8px' }}>
                    {isSubmitting ? 'Procesando...' : <><ArrowDownLeft size={16} />Confirmar Entrada — {items.length} productos</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'result' && batchResult && (
            <div>
              <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
                <CheckCircle2 size={48} color="#34d399" style={{ marginBottom: '12px' }} />
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399', marginBottom: '8px' }}>¡Lote ingresado al inventario!</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{batchResult.okCount} productos · {batchResult.totalUnits.toLocaleString()} unidades · ${batchResult.totalInversion.toFixed(2)} inversión</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Productos OK</div><div style={{ fontSize: '2rem', fontWeight: 900, color: '#34d399', fontFamily: 'monospace' }}>{batchResult.okCount}</div></div>
                <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unidades Totales</div><div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--cyan-primary)', fontFamily: 'monospace' }}>{batchResult.totalUnits.toLocaleString()}</div></div>
                <div style={{ background: batchResult.notFoundCount > 0 ? 'rgba(251,113,133,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${batchResult.notFoundCount > 0 ? 'rgba(251,113,133,0.25)' : 'rgba(16,185,129,0.2)'}`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>No Encontrados</div><div style={{ fontSize: '2rem', fontWeight: 900, color: batchResult.notFoundCount > 0 ? '#fb7185' : '#34d399', fontFamily: 'monospace' }}>{batchResult.notFoundCount}</div></div>
              </div>
              {batchResult.notFoundCount > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <button type="button" onClick={() => setShowSkipped(!showSkipped)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between', padding: '10px 16px', color: '#fb7185' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={15} />{batchResult.notFoundCount} SKU(s) no encontrados en catálogo</span>
                    {showSkipped ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  {showSkipped && <div style={{ background: 'rgba(251,113,133,0.06)', border: '1px solid rgba(251,113,133,0.2)', borderRadius: '0 0 12px 12px', padding: '12px 16px' }}>
                    {batchResult.results.filter(r => r.status === 'NOT_FOUND').map((r, i) => <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '4px 0', fontSize: '0.82rem', borderBottom: '1px solid rgba(251,113,133,0.1)' }}><Package size={14} color="#fb7185" /><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#fb7185' }}>{r.sku}</span><span style={{ color: 'var(--text-muted)' }}>— No existe. Créalo en "+ Nuevo Producto"</span></div>)}
                  </div>}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button type="button" onClick={handleReset} className="btn btn-secondary" style={{ gap: '6px' }}><RefreshCw size={15} />Ingresar otro lote</button>
                <button type="button" onClick={onClose} className="btn btn-emerald" style={{ padding: '10px 28px' }}>Cerrar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
