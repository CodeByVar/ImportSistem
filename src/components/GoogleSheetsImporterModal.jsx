import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Download,
  Database,
  Link2,
  Users,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export default function GoogleSheetsImporterModal({ isOpen, onClose, onImportSuccess }) {
  const [mainMode, setMainMode] = useState('workbook'); // 'workbook' | 'customers' | 'clean'
  const [googleUrl, setGoogleUrl] = useState('');
  const [replaceCatalog, setReplaceCatalog] = useState(false);
  const [selectedWorkbookFile, setSelectedWorkbookFile] = useState(null);
  const [workbookBase64, setWorkbookBase64] = useState('');
  const [detectedSheets, setDetectedSheets] = useState([]);

  // Customers & Debts state
  const [custPasteText, setCustPasteText] = useState('');
  const [custPreviewRows, setCustPreviewRows] = useState([]);

  // Status
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  if (!isOpen) return null;

  const resetMessages = () => {
    setErrorMsg('');
    setSuccessResult(null);
  };

  // Read multi-sheet .xlsx file into base64 + preview sheet names
  const handleWorkbookFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    resetMessages();
    setSelectedWorkbookFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const dataUrl = evt.target.result;
        setWorkbookBase64(dataUrl);
        const base64Part = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        const wb = XLSX.read(base64Part, { type: 'base64', bookSheets: true });
        setDetectedSheets(wb.SheetNames || []);
      } catch (err) {
        setErrorMsg('No se pudo leer el archivo Excel (.xlsx): ' + err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImportWorkbook = async (sourceType, preset = 'all') => {
    setIsProcessing(true);
    resetMessages();
    try {
      const res = await fetch('/api/import/google-drive-workbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: sourceType,
          googleUrl: googleUrl.trim(),
          base64Data: workbookBase64,
          filename: selectedWorkbookFile?.name || 'Inventario_GoogleDrive.xlsx',
          preset,
          replaceCatalog
        })
      }).then(r => r.json());

      if (!res.success) {
        throw new Error(res.error || 'No se pudo completar la migración');
      }

      setSuccessResult({
        type: 'workbook',
        ...res.data
      });
      onImportSuccess && onImportSuccess();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse pasted or uploaded customers & debts
  const parseCustomersRows = (rawObjects) => {
    const mapped = rawObjects.map((row) => {
      const keys = Object.keys(row);
      const findVal = (...terms) => {
        const k = keys.find(key => terms.some(t => key.toLowerCase().includes(t)));
        return k ? row[k] : '';
      };
      return {
        customer_name: String(findVal('cliente', 'nombre', 'name') || '').trim().toUpperCase(),
        phone: String(findVal('tel', 'cel', 'phone', 'whatsapp') || '').trim(),
        address: String(findVal('direc', 'mercado', 'ubic', 'address') || '').trim(),
        note_code: String(findVal('nota', 'cod', 'code') || '').trim().toUpperCase(),
        total_amount: parseFloat(String(findVal('total', 'monto') || '0').replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0,
        paid_amount: parseFloat(String(findVal('cuenta', 'a/c', 'pagado', 'abono') || '0').replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0,
        balance_amount: parseFloat(String(findVal('saldo', 'deuda', 'pendiente', 'por cobrar') || '0').replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0,
        date: String(findVal('fecha', 'date') || '').trim(),
        notes: String(findVal('obs', 'detalle', 'nota') || '').trim()
      };
    }).filter(r => r.customer_name);

    setCustPreviewRows(mapped);
  };

  const handleCustomerFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    resetMessages();
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        parseCustomersRows(rows);
      } catch (err) {
        setErrorMsg('Error leyendo archivo de clientes: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCustomerPasteChange = (text) => {
    setCustPasteText(text);
    resetMessages();
    if (!text.trim()) {
      setCustPreviewRows([]);
      return;
    }
    const parsed = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
    if (parsed.data && parsed.data.length > 0) {
      parseCustomersRows(parsed.data);
    }
  };

  const handleDownloadCustomersTemplate = () => {
    const sample = [
      {
        Cliente: 'FERRETERÍA CENTRAL',
        Telefono: '70712345',
        Direccion: 'MERCADO LA PAMPA PASILLO 3',
        Codigo_Nota: 'IR01FC',
        Total_Bs: 4500,
        A_Cuenta_Bs: 1500,
        Saldo_Deuda_Bs: 3000,
        Fecha: '2026-11-20',
        Observaciones: 'Saldo pendiente migrado de Drive'
      },
      {
        Cliente: 'COMERCIAL BOLIVIA',
        Telefono: '71234567',
        Direccion: 'AV. AYACUCHO',
        Codigo_Nota: '',
        Total_Bs: 0,
        A_Cuenta_Bs: 0,
        Saldo_Deuda_Bs: 0,
        Fecha: '2026-11-20',
        Observaciones: 'Cliente sin deuda inicial'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes_y_Saldos');
    XLSX.writeFile(wb, 'Plantilla_Clientes_y_Deudas_SISCONTROL.xlsx');
  };

  const handleImportCustomersDebts = async () => {
    if (custPreviewRows.length === 0) {
      setErrorMsg('Sube un archivo o pega las filas de clientes desde tu Google Sheets.');
      return;
    }
    setIsProcessing(true);
    resetMessages();
    try {
      const res = await fetch('/api/import/customers-debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: custPreviewRows })
      }).then(r => r.json());

      if (!res.success) throw new Error(res.error || 'Error importando clientes y saldos');
      setSuccessResult({
        type: 'customers',
        ...res.data
      });
      setCustPreviewRows([]);
      setCustPasteText('');
      onImportSuccess && onImportSuccess();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCleanTestData = async () => {
    const ok = window.confirm(
      '¿Estás seguro de LIMPIAR TODOS LOS REGISTROS DE PRUEBA (notas de prueba, clientes de prueba, pagos y movimientos de prueba)?\n\n• Se creará un RESPALDO AUTOMÁTICO antes de borrar.\n• Tus 5.418 productos y tus 5 usuarios se conservarán intactos.\n• Los stocks negativos se pondrán en 0.'
    );
    if (!ok) return;

    setIsProcessing(true);
    resetMessages();
    try {
      const res = await fetch('/api/system/clean-test-data', { method: 'POST' }).then(r => r.json());
      if (!res.success) throw new Error(res.error || 'No se pudo ejecutar la limpieza');
      setSuccessResult({
        type: 'clean',
        backup: res.data?.backup,
        message: res.message
      });
      onImportSuccess && onImportSuccess();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[94dvh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/25">
              <FileSpreadsheet size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white m-0 truncate">
                Centro de Migración: Google Drive → SISCONTROL
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 m-0 truncate">
                Carga tu inventario real multi-hoja, clientes/deudas y limpia los datos de prueba
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 pt-3 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex gap-2 flex-wrap bg-white dark:bg-slate-900 shrink-0 pb-2.5">
          <button
            type="button"
            onClick={() => { setMainMode('workbook'); resetMessages(); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              mainMode === 'workbook'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Layers size={14} />
            <span>1. Inventario Google Drive (Multi-Hoja)</span>
          </button>

          <button
            type="button"
            onClick={() => { setMainMode('customers'); resetMessages(); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              mainMode === 'customers'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Users size={14} />
            <span>2. Clientes & Saldos / Deudas</span>
          </button>

          <button
            type="button"
            onClick={() => { setMainMode('clean'); resetMessages(); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              mainMode === 'clean'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Trash2 size={14} />
            <span>3. Limpiar Datos de Prueba</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-500/40 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 space-y-1.5">
              <div className="flex items-center gap-2 font-black text-emerald-700 dark:text-emerald-300">
                <Check size={18} />
                <span>¡Operación Completada con Éxito!</span>
              </div>
              {successResult.type === 'workbook' && (
                <p className="m-0">
                  Archivo <strong>{successResult.filename}</strong> ({successResult.totalSheets} pestañas procesadas):{' '}
                  <strong>{successResult.createdCount} productos nuevos</strong> y <strong>{successResult.updatedCount} productos actualizados</strong> con sus precios Mayor, Caja, Especial y Stock real.
                </p>
              )}
              {successResult.type === 'customers' && (
                <p className="m-0">
                  Se registraron <strong>{successResult.customersCreated} clientes nuevos</strong>,{' '}
                  <strong>{successResult.customersUpdated} actualizados</strong> y{' '}
                  <strong>{successResult.notesCreated} notas/saldos iniciales</strong>.
                </p>
              )}
              {successResult.type === 'clean' && (
                <p className="m-0">
                  {successResult.message} Tus productos y usuarios reales quedaron listos para empezar.
                </p>
              )}
            </div>
          )}

          {/* ===============================================================
              TAB 1: INVENTARIO MULTI-HOJA DESDE GOOGLE DRIVE
             =============================================================== */}
          {mainMode === 'workbook' && (
            <div className="space-y-4">
              {/* Opción A: Subir archivo .xlsx descargado de Google Drive */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <UploadCloud size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <span>Opción A (Recomendada): Subir tu Excel (.xlsx) descargado de Google Drive</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                      En tu Google Drive abre tu hoja (UYUS o VARIOS) → <strong>Archivo → Descargar → Microsoft Excel (.xlsx)</strong> y súbelo aquí. Procesa todas las pestañas de marcas de una sola vez.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleWorkbookFileSelect}
                    className="form-input text-xs py-2 px-3 flex-1 cursor-pointer"
                  />
                  <button
                    type="button"
                    disabled={!workbookBase64 || isProcessing}
                    onClick={() => handleImportWorkbook('file')}
                    className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Database size={14} />
                    <span>{isProcessing ? 'Importando...' : 'Cargar Todas las Pestañas'}</span>
                  </button>
                </div>

                {detectedSheets.length > 0 && (
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30">
                    <strong>{detectedSheets.length} pestañas detectadas:</strong> {detectedSheets.join(', ')}
                  </div>
                )}
              </div>

              {/* Opción B: Pegar Link directo de Google Sheets */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Link2 size={16} className="text-cyan-600 dark:text-cyan-400" />
                  <span>Opción B: Pegar Enlace Directo de Google Sheets</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                  Si tu hoja en Google Drive tiene permiso <em>"Cualquier persona con el enlace (Lector)"</em>, pega el link aquí y sincroniza directo sin descargar:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={googleUrl}
                    onChange={e => setGoogleUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1ABC.../edit"
                    className="form-input text-xs h-10 flex-1"
                  />
                  <button
                    type="button"
                    disabled={!googleUrl.trim() || isProcessing}
                    onClick={() => handleImportWorkbook('url')}
                    className="py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-black inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''} />
                    <span>Sincronizar por Link</span>
                  </button>
                </div>
              </div>

              {/* Opción C: Recargar desde los archivos Excel ya presentes en la carpeta */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="text-xs">
                  <strong className="text-emerald-900 dark:text-emerald-200 block">
                    Recarga Rápida Local (INVENTARIO UYUS 26 + INVENTARIO VARIOS 26)
                  </strong>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Restaura el stock y precios originales de las 35 hojas guardadas en la carpeta del proyecto.
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleImportWorkbook('local', 'all')}
                  className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RefreshCw size={13} />
                  <span>Recargar 35 Hojas Locales</span>
                </button>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={replaceCatalog}
                  onChange={e => setReplaceCatalog(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span>Reemplazar todo el catálogo anterior (borra productos que ya no existan en el Excel)</span>
              </label>
            </div>
          )}

          {/* ===============================================================
              TAB 2: CLIENTES & SALDOS / DEUDAS REALES
             =============================================================== */}
          {mainMode === 'customers' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/25 border border-cyan-200 dark:border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="text-xs">
                  <strong className="text-slate-900 dark:text-white block">
                    Importa tu Cartera de Clientes y Saldos por Cobrar desde Google Sheets
                  </strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Reconoce columnas: <code>Cliente</code>, <code>Telefono</code>, <code>Direccion</code>, <code>Codigo_Nota</code>, <code>Total_Bs</code>, <code>A_Cuenta_Bs</code>, <code>Saldo_Deuda_Bs</code>, <code>Fecha</code>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCustomersTemplate}
                  className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-cyan-300 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-300 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Download size={13} />
                  <span>Descargar Plantilla</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <label className="form-label text-xs mb-1.5">Subir Excel / CSV de Clientes y Saldos</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleCustomerFileUpload}
                    className="form-input text-xs py-2 px-2.5 w-full cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <label className="form-label text-xs mb-1.5">O pega directo desde Google Sheets (con encabezados)</label>
                  <textarea
                    rows={2}
                    value={custPasteText}
                    onChange={e => handleCustomerPasteChange(e.target.value)}
                    placeholder={'Cliente\tTelefono\tDireccion\tTotal_Bs\tSaldo_Deuda_Bs\nFERRETERIA CENTRAL\t70712345\tLA PAMPA\t3500\t1200'}
                    className="form-input text-xs font-mono w-full"
                  />
                </div>
              </div>

              {custPreviewRows.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                      Vista previa ({custPreviewRows.length} fila(s) listas para cargar):
                    </span>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleImportCustomersDebts}
                      className="py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check size={14} />
                      <span>{isProcessing ? 'Cargando...' : `Confirmar e Importar (${custPreviewRows.length})`}</span>
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {custPreviewRows.slice(0, 15).map((r, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between gap-2 bg-white dark:bg-slate-800/60">
                        <div className="min-w-0">
                          <strong className="text-slate-900 dark:text-white">{r.customer_name}</strong>
                          {r.phone && <span className="text-slate-400"> • {r.phone}</span>}
                          {r.address && <span className="text-slate-400"> • {r.address}</span>}
                        </div>
                        <div className="font-mono font-bold shrink-0">
                          {r.balance_amount > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">Deuda: Bs {r.balance_amount.toFixed(2)}</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">Sin deuda</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===============================================================
              TAB 3: LIMPIAR DATOS DE PRUEBA (DEJAR SISTEMA EN CERO)
             =============================================================== */}
          {mainMode === 'clean' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/25 border-2 border-rose-200 dark:border-rose-500/40 space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white m-0">
                    Dejar SISCONTROL Limpio para Empezar con Datos Reales
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 m-0 leading-relaxed">
                    Este botón elimina todas las <strong>notas de venta de prueba, abonos de prueba, clientes de prueba (ej. CLIENTE TEST UBICACION), órdenes del día de prueba, gastos y contenedores de prueba</strong>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30">
                  <strong className="text-emerald-700 dark:text-emerald-400 block mb-1">Qué SE CONSERVA intacto:</strong>
                  <ul className="m-0 pl-4 space-y-0.5 text-slate-600 dark:text-slate-300">
                    <li>Tus <strong>5.418 productos</strong> y precios</li>
                    <li>Tus <strong>5 usuarios y PINs cifrados</strong></li>
                    <li>Crea un <strong>Respaldo Automático</strong> previo</li>
                    <li>Corrige cualquier stock negativo a <code>0</code></li>
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30">
                  <strong className="text-rose-700 dark:text-rose-400 block mb-1">Qué SE BORRA (Solo pruebas):</strong>
                  <ul className="m-0 pl-4 space-y-0.5 text-slate-600 dark:text-slate-300">
                    <li>Notas, pagos y deudas de prueba</li>
                    <li>Clientes y movimientos de prueba</li>
                    <li>Orden del día y embarques de prueba</li>
                  </ul>
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCleanTestData}
                className="w-full py-3 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-black inline-flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 cursor-pointer"
              >
                <Trash2 size={16} />
                <span>{isProcessing ? 'Creando respaldo y limpiando...' : 'Crear Respaldo y Borrar Todos los Datos de Prueba Ahora'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
