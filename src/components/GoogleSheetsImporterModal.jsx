import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  ClipboardCheck,
  Check,
  AlertCircle,
  Download,
  ArrowRight,
  Database,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { formatCurrency } from '../utils/formatters';

export default function GoogleSheetsImporterModal({ isOpen, onClose, onImportSuccess }) {
  const [activeTab, setActiveTab] = useState('file'); // 'file' o 'paste'
  const [pastedText, setPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    sku: '',
    name: '',
    category: '',
    fob: '',
    shipping: '',
    tariff: '',
    landed: '',
    price: '',
    stock: '',
    supplier: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  if (!isOpen) return null;

  // Auto detect columns from headers
  const autoMapHeaders = (foundHeaders) => {
    const mapping = { ...columnMapping };
    const lowerHeaders = foundHeaders.map(h => (h || '').toString().toLowerCase().trim());

    foundHeaders.forEach((h, idx) => {
      const lh = lowerHeaders[idx];
      if (!mapping.sku && (lh.includes('sku') || lh.includes('cod') || lh.includes('código') || lh.includes('referencia'))) {
        mapping.sku = h;
      } else if (!mapping.name && (lh.includes('nombre') || lh.includes('producto') || lh.includes('descrip') || lh.includes('item'))) {
        mapping.name = h;
      } else if (!mapping.category && (lh.includes('categ') || lh.includes('rubro') || lh.includes('tipo') || lh.includes('familia'))) {
        mapping.category = h;
      } else if (!mapping.fob && (lh.includes('fob') || lh.includes('fabrica') || lh.includes('origen'))) {
        mapping.fob = h;
      } else if (!mapping.shipping && (lh.includes('flete') || lh.includes('shipping') || lh.includes('envio') || lh.includes('transporte'))) {
        mapping.shipping = h;
      } else if (!mapping.tariff && (lh.includes('arancel') || lh.includes('aduana') || lh.includes('impuesto') || lh.includes('dai') || lh.includes('iva'))) {
        mapping.tariff = h;
      } else if (!mapping.landed && (lh.includes('landed') || lh.includes('costo_total') || lh.includes('costo total') || (lh.includes('costo') && !lh.includes('fob')))) {
        mapping.landed = h;
      } else if (!mapping.price && (lh.includes('precio') || lh.includes('venta') || lh.includes('pvp') || lh.includes('price'))) {
        mapping.price = h;
      } else if (!mapping.stock && (lh.includes('stock') || lh.includes('cant') || lh.includes('existencia') || lh.includes('unid'))) {
        mapping.stock = h;
      } else if (!mapping.supplier && (lh.includes('proveedor') || lh.includes('fabrica') || lh.includes('supplier') || lh.includes('contacto'))) {
        mapping.supplier = h;
      }
    });

    setColumnMapping(mapping);
  };

  // Handle Excel or CSV file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorMsg('');
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            setHeaders(results.meta.fields || Object.keys(results.data[0]));
            setParsedRows(results.data);
            autoMapHeaders(results.meta.fields || Object.keys(results.data[0]));
          } else {
            setErrorMsg('El archivo CSV está vacío.');
          }
        },
        error: (err) => setErrorMsg(`Error al leer archivo CSV: ${err.message}`)
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheet];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          if (jsonData.length > 1) {
            const fileHeaders = jsonData[0].map(h => (h || '').toString().trim());
            const rows = jsonData.slice(1).map(row => {
              const rowObj = {};
              fileHeaders.forEach((h, i) => {
                rowObj[h] = row[i];
              });
              return rowObj;
            });

            setHeaders(fileHeaders);
            setParsedRows(rows);
            autoMapHeaders(fileHeaders);
          } else {
            setErrorMsg('La hoja de cálculo no contiene suficientes datos.');
          }
        } catch (err) {
          setErrorMsg(`Error al procesar el archivo Excel: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setErrorMsg('Por favor selecciona un archivo con formato .xlsx, .xls o .csv');
    }
  };

  // Handle direct paste from Google Sheets (tab-delimited)
  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setErrorMsg('Por favor pega el texto copiado de tu Google Sheet');
      return;
    }

    try {
      const lines = pastedText.trim().split('\n');
      if (lines.length < 2) {
        setErrorMsg('El texto pegado debe contener al menos 1 fila de encabezados y 1 fila de datos.');
        return;
      }

      // Check delimiter (tab or comma)
      const delimiter = lines[0].includes('\t') ? '\t' : ',';
      const fileHeaders = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1).map(line => {
        const parts = line.split(delimiter).map(p => p.trim().replace(/^"|"$/g, ''));
        const obj = {};
        fileHeaders.forEach((h, idx) => {
          obj[h] = parts[idx] !== undefined ? parts[idx] : '';
        });
        return obj;
      });

      setHeaders(fileHeaders);
      setParsedRows(rows);
      autoMapHeaders(fileHeaders);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(`Error al procesar el texto: ${err.message}`);
    }
  };

  // Download sample template
  const downloadSampleTemplate = () => {
    const sample = [
      {
        'SKU': 'IMP-AUD-PRO',
        'Nombre_Producto': 'Auriculares Bluetooth Pro Hi-Fi',
        'Categoria': 'Electrónica',
        'Costo_FOB': 12.50,
        'Flete_Envio': 1.50,
        'Aranceles_Aduana': 2.00,
        'Precio_Venta': 35.00,
        'Stock_Actual': 150,
        'Stock_Minimo': 30,
        'Proveedor': 'Shenzhen Audio Tech'
      },
      {
        'SKU': 'IMP-CAM-WIFI',
        'Nombre_Producto': 'Cámara de Seguridad WiFi Exterior 1080P',
        'Categoria': 'Seguridad',
        'Costo_FOB': 25.00,
        'Flete_Envio': 3.20,
        'Aranceles_Aduana': 3.80,
        'Precio_Venta': 69.90,
        'Stock_Actual': 60,
        'Stock_Minimo': 20,
        'Proveedor': 'Hangzhou Vision Tech'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_SISCONTROL');
    XLSX.writeFile(wb, 'Plantilla_Importacion_SISCONTROL.xlsx');
  };

  // Execute Import
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;

    setIsProcessing(true);
    setErrorMsg('');

    try {
      // Map rows according to columnMapping
      const formattedRecords = parsedRows.map(row => {
        const fob = parseFloat(row[columnMapping.fob] || 0) || 0;
        const shipping = parseFloat(row[columnMapping.shipping] || 0) || 0;
        const tariff = parseFloat(row[columnMapping.tariff] || 0) || 0;
        const landedDirect = parseFloat(row[columnMapping.landed] || 0) || 0;
        const landed = landedDirect > 0 ? landedDirect : (fob + shipping + tariff);

        return {
          sku: row[columnMapping.sku] || `IMP-${Date.now().toString().slice(-4)}`,
          name: row[columnMapping.name] || 'Producto Sin Nombre',
          category: row[columnMapping.category] || 'General',
          fob_price: fob,
          shipping_cost: shipping,
          tariff_cost: tariff,
          landed_cost: landed,
          sale_price: parseFloat(row[columnMapping.price] || (landed * 1.5)) || (landed * 1.5),
          current_stock: parseInt(row[columnMapping.stock] || 0, 10) || 0,
          supplier: row[columnMapping.supplier] || 'Importación Google Sheets'
        };
      });

      const response = await fetch('/api/import/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: formattedRecords,
          filename: activeTab === 'file' ? 'Archivo Excel/CSV Subido' : 'Pegado Directo Google Sheets'
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Error al importar');
      }

      setSuccessResult(data.data);
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '820px' }}>
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
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(16, 185, 129, 0.2))',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--indigo-brand)'
            }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                Asistente de Migración: Google Sheets / Excel
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Importa tus hojas actuales a tu base de datos SQLite propia de forma rápida y segura
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '6px', borderRadius: '8px', border: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {/* Success state */}
          {successResult ? (
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#10b981'
              }}>
                <Check size={32} />
              </div>
              <h4 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
                ¡Datos Migrados con Éxito a tu Base de Datos!
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 24px' }}>
                Se procesaron {successResult.totalProcessed} filas: <strong>{successResult.importedCount} productos nuevos</strong> creados y <strong>{successResult.updatedCount} actualizados</strong>. Tu Dashboard ya refleja las cifras actualizadas.
              </p>
              <button
                onClick={onClose}
                className="btn btn-primary"
                style={{ padding: '10px 24px' }}
              >
                Volver al Dashboard
              </button>
            </div>
          ) : (
            <div>
              {/* Method Tabs */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '4px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)'
              }}>
                <button
                  onClick={() => { setActiveTab('file'); setErrorMsg(''); }}
                  className="btn"
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'file' ? 'var(--indigo-brand)' : 'transparent',
                    color: activeTab === 'file' ? '#ffffff' : 'var(--text-muted)'
                  }}
                >
                  <UploadCloud size={16} /> Subir Archivo (.xlsx / .csv)
                </button>
                <button
                  onClick={() => { setActiveTab('paste'); setErrorMsg(''); }}
                  className="btn"
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'paste' ? 'var(--indigo-brand)' : 'transparent',
                    color: activeTab === 'paste' ? '#ffffff' : 'var(--text-muted)'
                  }}
                >
                  <ClipboardCheck size={16} /> Copiar y Pegar Celdas de Drive
                </button>
              </div>

              {/* TAB 1: FILE UPLOAD */}
              {activeTab === 'file' && (
                <div>
                  <div style={{
                    border: '2px dashed var(--border-glass)',
                    borderRadius: '16px',
                    padding: '36px 20px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                    position: 'relative'
                  }}>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0,
                        cursor: 'pointer',
                        width: '100%',
                        height: '100%'
                      }}
                    />
                    <UploadCloud size={40} color="var(--cyan-primary)" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem', marginBottom: '4px' }}>
                      Arrastra tu archivo aquí o haz clic para seleccionarlo
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Formatos compatibles: Microsoft Excel (.xlsx, .xls) o CSV exportado de Google Sheets
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ¿Cómo descargar de Google Sheets? <strong>Archivo &gt; Descargar &gt; Microsoft Excel (.xlsx)</strong>
                    </span>
                    <button
                      type="button"
                      onClick={downloadSampleTemplate}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    >
                      <Download size={13} />
                      <span>Descargar Plantilla Modelo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: PASTE CELLS */}
              {activeTab === 'paste' && (
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <label className="form-label">
                      Pega aquí tus datos copiados desde Google Sheets (Ctrl + C en Drive, Ctrl + V aquí):
                    </label>
                    <textarea
                      rows={6}
                      className="form-textarea"
                      placeholder={`SKU\tProducto\tCategoria\tCosto_FOB\tFlete\tPrecio_Venta\tStock\nIMP-01\tAuriculares Pro\tElectrónica\t12.50\t1.50\t35.00\t100`}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
                    />
                  </div>

                  <button
                    onClick={handleParsePastedText}
                    className="btn btn-primary"
                    style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                  >
                    Procesar Celdas Pegadas
                  </button>
                </div>
              )}

              {/* Error Alert */}
              {errorMsg && (
                <div style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: '10px',
                  padding: '12px',
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.82rem',
                  color: '#fb7185'
                }}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* COLUMN MAPPER & PREVIEW */}
              {headers.length > 0 && parsedRows.length > 0 && (
                <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 className="font-heading" style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color="var(--cyan-primary)" />
                      Mapeador de Columnas ({parsedRows.length} filas detectadas)
                    </h4>
                    <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                      Auto-detección Activa
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '16px'
                  }}>
                    {/* SKU */}
                    <div>
                      <label className="form-label">Columna SKU / Código *</label>
                      <select
                        className="form-select"
                        value={columnMapping.sku}
                        onChange={(e) => setColumnMapping({ ...columnMapping, sku: e.target.value })}
                        style={{ fontSize: '0.8rem' }}
                      >
                        <option value="">-- Seleccionar --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Nombre */}
                    <div>
                      <label className="form-label">Nombre del Producto *</label>
                      <select
                        className="form-select"
                        value={columnMapping.name}
                        onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                        style={{ fontSize: '0.8rem' }}
                      >
                        <option value="">-- Seleccionar --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Categoría */}
                    <div>
                      <label className="form-label">Categoría</label>
                      <select
                        className="form-select"
                        value={columnMapping.category}
                        onChange={(e) => setColumnMapping({ ...columnMapping, category: e.target.value })}
                        style={{ fontSize: '0.8rem' }}
                      >
                        <option value="">-- Opcional (General) --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Costo FOB */}
                    <div>
                      <label className="form-label">Costo FOB (Fábrica)</label>
                      <select
                        className="form-select"
                        value={columnMapping.fob}
                        onChange={(e) => setColumnMapping({ ...columnMapping, fob: e.target.value })}
                        style={{ fontSize: '0.8rem' }}
                      >
                        <option value="">-- Opcional --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Flete */}
                    <div>
                      <label className="form-label">Flete / Envío</label>
                      <select
                        className="form-select"
                        value={columnMapping.shipping}
                        onChange={(e) => setColumnMapping({ ...columnMapping, shipping: e.target.value })}
                        style={{ fontSize: '0.8rem' }}
                      >
                        <option value="">-- Opcional --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Arancel / Aduana */}
                    <div>
                      <label className="form-label">Arancel / Aduana</label>
                      <select
                        className="form-select"
                        value={columnMapping.tariff}
                        onChange={(e) => setColumnMapping({ ...columnMapping, tariff: e.target.value })}
                        style={{ fontSize: '0.8rem' }}
                      >
                        <option value="">-- Opcional --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Precio Venta */}
                    <div>
                      <label className="form-label">Precio de Venta</label>
                      <select
                        className="form-select"
                        value={columnMapping.price}
                        onChange={(e) => setColumnMapping({ ...columnMapping, price: e.target.value })}
                        style={{ fontSize: '0.8rem' }}
                      >
                        <option value="">-- Opcional (Sugerido) --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Stock */}
                    <div>
                      <label className="form-label">Cantidad / Stock</label>
                      <select
                        className="form-select"
                        value={columnMapping.stock}
                        onChange={(e) => setColumnMapping({ ...columnMapping, stock: e.target.value })}
                        style={{ fontSize: '0.8rem' }}
                      >
                        <option value="">-- Opcional (0) --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Preview Table (First 4 rows) */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Previsualización de los primeros datos:
                    </div>
                    <div className="data-table-container" style={{ maxHeight: '160px' }}>
                      <table className="data-table" style={{ fontSize: '0.75rem' }}>
                        <thead>
                          <tr>
                            <th>SKU Mapeado</th>
                            <th>Nombre Mapeado</th>
                            <th>FOB</th>
                            <th>Precio Venta</th>
                            <th>Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedRows.slice(0, 4).map((row, idx) => (
                            <tr key={idx}>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{row[columnMapping.sku] || '-'}</td>
                              <td style={{ fontWeight: 600 }}>{row[columnMapping.name] || '-'}</td>
                              <td>{row[columnMapping.fob] || '0.00'}</td>
                              <td>{row[columnMapping.price] || '0.00'}</td>
                              <td>{row[columnMapping.stock] || '0'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Submit Action */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                      onClick={onClose}
                      className="btn btn-secondary"
                      disabled={isProcessing}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleExecuteImport}
                      className="btn btn-emerald"
                      disabled={isProcessing}
                      style={{ padding: '10px 24px' }}
                    >
                      {isProcessing ? 'Importando a SQLite...' : `Confirmar e Importar ${parsedRows.length} Registros`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
