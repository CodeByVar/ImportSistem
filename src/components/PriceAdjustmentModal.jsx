import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Sliders, 
  ArrowRight, 
  Eye, 
  Check, 
  Info, 
  Layers,
  Sparkles,
  Lock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatNumber } from '../utils/formatters';

export default function PriceAdjustmentModal({ isOpen, onClose, onPricesAdjusted }) {
  const [options, setOptions] = useState({
    brands: [],
    categories: [],
    defaultExchangeRate: 11.5,
    totalProducts: 0
  });
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Form State
  const [scopeBrand, setScopeBrand] = useState('ALL');
  const [scopeCategory, setScopeCategory] = useState('ALL');
  const [adjustmentType, setAdjustmentType] = useState('RATE'); // 'RATE' or 'PERCENT'
  const [baseRate, setBaseRate] = useState('11.50');
  const [newRate, setNewRate] = useState('12.50');
  const [percentValue, setPercentValue] = useState('10');
  const [roundMode, setRoundMode] = useState('WHOLE'); // 'WHOLE', 'NEAREST_5', 'DECIMAL'
  const [applyWholesale, setApplyWholesale] = useState(true);
  const [applyBox, setApplyBox] = useState(true);
  const [applySpecial, setApplySpecial] = useState(true);

  // Simulation & Applying State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch options when opened
  useEffect(() => {
    if (!isOpen) {
      setSimulationData(null);
      setConfirmStep(false);
      setSuccessResult(null);
      setErrorMsg('');
      return;
    }

    const fetchOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const res = await fetch('/api/products/price-adjustment-options', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('siscontrol_token') || ''}`
          }
        }).then(r => r.json());

        if (res.success && res.data) {
          setOptions(res.data);
          if (res.data.defaultExchangeRate) {
            setBaseRate(Number(res.data.defaultExchangeRate).toFixed(2));
            setNewRate((Number(res.data.defaultExchangeRate) * 1.05).toFixed(2));
          }
        }
      } catch (err) {
        console.error('Error fetching adjustment options:', err);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [isOpen]);

  // Run simulation
  const handleSimulate = async () => {
    setErrorMsg('');
    setIsSimulating(true);
    setSimulationData(null);
    setConfirmStep(false);

    try {
      const payload = {
        scopeBrand,
        scopeCategory,
        adjustmentType,
        baseRate: parseFloat(baseRate) || 11.5,
        newRate: parseFloat(newRate) || 11.5,
        percentValue: parseFloat(percentValue) || 0,
        roundMode,
        applyWholesale,
        applyBox,
        applySpecial
      };

      const res = await fetch('/api/products/simulate-price-adjustment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('siscontrol_token') || ''}`
        },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (res.success && res.data) {
        setSimulationData(res.data);
      } else {
        setErrorMsg(res.error || 'No se pudo generar la simulación de precios');
      }
    } catch (err) {
      setErrorMsg('Error de conexión al simular precios: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  // Run actual bulk adjustment
  const handleApplyAdjustment = async () => {
    setErrorMsg('');
    setIsApplying(true);

    try {
      const payload = {
        scopeBrand,
        scopeCategory,
        adjustmentType,
        baseRate: parseFloat(baseRate) || 11.5,
        newRate: parseFloat(newRate) || 11.5,
        percentValue: parseFloat(percentValue) || 0,
        roundMode,
        applyWholesale,
        applyBox,
        applySpecial
      };

      const res = await fetch('/api/products/bulk-price-adjustment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('siscontrol_token') || ''}`
        },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (res.success) {
        setSuccessResult(res);
        if (onPricesAdjusted) {
          onPricesAdjusted();
        }
      } else {
        setErrorMsg(res.error || 'No se pudo aplicar el reajuste');
        setConfirmStep(false);
      }
    } catch (err) {
      setErrorMsg('Error al aplicar el reajuste: ' + err.message);
      setConfirmStep(false);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  // Multiplier helper for quick UI preview
  const bRate = Math.max(0.01, parseFloat(baseRate) || 11.5);
  const nRate = Math.max(0.01, parseFloat(newRate) || 11.5);
  const quickPercentDiff = adjustmentType === 'RATE'
    ? (((nRate - bRate) / bRate) * 100).toFixed(1)
    : (parseFloat(percentValue) || 0).toFixed(1);

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[94dvh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#FF8C00] text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20 font-black">
              <TrendingUp size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Reajuste Masivo de Precios</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Dólar / Rubro
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Ajuste seguro por tipo de cambio de divisa (Bs/$us) o porcentaje con vista previa y respaldo automático.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2.5">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successResult ? (
            /* Pantalla de éxito tras aplicar */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  ¡Reajuste Aplicado Exitosamente!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  {successResult.message}
                </p>
              </div>

              {successResult.backupFile && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono font-bold">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>Respaldo de seguridad creado: {successResult.backupFile}</span>
                </div>
              )}

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessResult(null);
                    setSimulationData(null);
                  }}
                  className="btn btn-secondary px-4 py-2 text-xs font-bold"
                >
                  Realizar otro ajuste
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-primary bg-[#FF8C00] text-slate-950 font-black px-6 py-2 text-xs"
                >
                  Entendido y Volver al Inventario
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* PASO 1: ALCANCE / FILTROS */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-black flex items-center justify-center">1</span>
                    <span>Alcance del Reajuste (Marca o Rubro)</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-bold">
                    Total catálogo: {options.totalProducts.toLocaleString()} productos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Marca */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Filtrar por Marca
                    </label>
                    <select
                      className="form-select w-full text-xs font-bold py-2"
                      value={scopeBrand}
                      onChange={(e) => {
                        setScopeBrand(e.target.value);
                        setSimulationData(null);
                      }}
                    >
                      <option value="ALL">Todas las marcas (Catálogo completo)</option>
                      {options.brands.map(b => (
                        <option key={b.brand} value={b.brand}>
                          {b.brand} ({b.count} productos)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rubro / Categoría */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Filtrar por Rubro / Herramienta
                    </label>
                    <select
                      className="form-select w-full text-xs font-bold py-2"
                      value={scopeCategory}
                      onChange={(e) => {
                        setScopeCategory(e.target.value);
                        setSimulationData(null);
                      }}
                    >
                      <option value="ALL">Todos los rubros (Eléctricos, manuales, etc.)</option>
                      {options.categories.map(c => (
                        <option key={c.category} value={c.category}>
                          {c.category} ({c.count} productos)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* PASO 2: MÉTODO DE CÁLCULO */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-black flex items-center justify-center">2</span>
                  <span>Fórmula de Reajuste</span>
                </span>

                {/* Switch Tipo de Cambio vs Porcentaje */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl max-w-md">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustmentType('RATE');
                      setSimulationData(null);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      adjustmentType === 'RATE'
                        ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <DollarSign size={13} />
                    <span>Por Tipo de Cambio Dólar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustmentType('PERCENT');
                      setSimulationData(null);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      adjustmentType === 'PERCENT'
                        ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Percent size={13} />
                    <span>Por Porcentaje (+/- %)</span>
                  </button>
                </div>

                {/* Controles según el tipo */}
                {adjustmentType === 'RATE' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Tipo de Cambio Base Actual (Bs/$us)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        className="form-input w-full font-mono font-bold text-xs"
                        value={baseRate}
                        onChange={(e) => {
                          setBaseRate(e.target.value);
                          setSimulationData(null);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Nuevo Tipo de Cambio (Bs/$us)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        className="form-input w-full font-mono font-bold text-xs border-[#FF8C00] focus:ring-[#FF8C00]"
                        value={newRate}
                        onChange={(e) => {
                          setNewRate(e.target.value);
                          setSimulationData(null);
                        }}
                      />
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      {Number(quickPercentDiff) >= 0 ? <ArrowUpRight size={16} className="text-emerald-500" /> : <ArrowDownRight size={16} className="text-rose-500" />}
                      <span>Variación resultante: <strong>{Number(quickPercentDiff) > 0 ? `+${quickPercentDiff}%` : `${quickPercentDiff}%`}</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Porcentaje a Aplicar (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          placeholder="Ej. 10 para aumentar un 10%"
                          className="form-input w-full font-mono font-bold text-xs pl-8"
                          value={percentValue}
                          onChange={(e) => {
                            setPercentValue(e.target.value);
                            setSimulationData(null);
                          }}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                          %
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
                      Usa números positivos para incremento (ej. <strong>10</strong>) o negativos para rebaja (ej. <strong>-5</strong>).
                    </div>
                  </div>
                )}
              </div>

              {/* PASO 3: TARIFAS Y REDONDEO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Listas a Modificar */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-black flex items-center justify-center">3</span>
                    <span>Precios a Modificar</span>
                  </span>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={applyWholesale}
                      onChange={(e) => {
                        setApplyWholesale(e.target.checked);
                        setSimulationData(null);
                      }}
                      className="rounded border-slate-300 text-[#FF8C00] focus:ring-[#FF8C00] w-4 h-4"
                    />
                    <span>Precio por Mayor (Wholesale)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={applyBox}
                      onChange={(e) => {
                        setApplyBox(e.target.checked);
                        setSimulationData(null);
                      }}
                      className="rounded border-slate-300 text-[#FF8C00] focus:ring-[#FF8C00] w-4 h-4"
                    />
                    <span>Precio por Caja Cerrada</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={applySpecial}
                      onChange={(e) => {
                        setApplySpecial(e.target.checked);
                        setSimulationData(null);
                      }}
                      className="rounded border-slate-300 text-[#FF8C00] focus:ring-[#FF8C00] w-4 h-4"
                    />
                    <span>Precio Especial (Ferretero / Volumen)</span>
                  </label>
                </div>

                {/* Redondeo Inteligente */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Sliders size={14} className="text-[#FF8C00]" />
                    <span>Regla de Redondeo</span>
                  </span>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        name="roundMode"
                        value="WHOLE"
                        checked={roundMode === 'WHOLE'}
                        onChange={() => {
                          setRoundMode('WHOLE');
                          setSimulationData(null);
                        }}
                        className="text-[#FF8C00] focus:ring-[#FF8C00]"
                      />
                      <span>Redondear a Bolivianos enteros (Recomendado, sin centavos)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        name="roundMode"
                        value="NEAREST_5"
                        checked={roundMode === 'NEAREST_5'}
                        onChange={() => {
                          setRoundMode('NEAREST_5');
                          setSimulationData(null);
                        }}
                        className="text-[#FF8C00] focus:ring-[#FF8C00]"
                      />
                      <span>Redondear a múltiplos de 5 Bs (ej. 80, 85, 90 Bs)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        name="roundMode"
                        value="DECIMAL"
                        checked={roundMode === 'DECIMAL'}
                        onChange={() => {
                          setRoundMode('DECIMAL');
                          setSimulationData(null);
                        }}
                        className="text-[#FF8C00] focus:ring-[#FF8C00]"
                      />
                      <span>Mantener centavos con 2 decimales (ej. 87.40 Bs)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* BOTÓN GENERAR VISTA PREVIA */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleSimulate}
                  disabled={isSimulating || (!applyWholesale && !applyBox && !applySpecial)}
                  className="btn btn-secondary px-6 py-2.5 text-xs font-extrabold inline-flex items-center gap-2 shadow-sm cursor-pointer hover:border-[#FF8C00] hover:text-[#FF8C00] transition-all"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Calculando simulación...</span>
                    </>
                  ) : (
                    <>
                      <Eye size={15} />
                      <span>Ver Muestra en Vivo ("Antes vs Después")</span>
                    </>
                  )}
                </button>
              </div>

              {/* TABLA DE VISTA PREVIA ("ANTES VS DESPUÉS") */}
              {simulationData && (
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/25 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
                        <Check size={14} className="text-emerald-500" />
                        <span>Vista Previa del Reajuste</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Se actualizarán <strong>{simulationData.totalMatched.toLocaleString()}</strong> productos con factor <strong>x{simulationData.multiplier}</strong> ({simulationData.percentDiff > 0 ? `+${simulationData.percentDiff}%` : `${simulationData.percentDiff}%`}).
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-500/15 text-amber-800 dark:text-amber-300">
                      Muestra de 15 productos
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-60 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0">
                        <tr>
                          <th className="p-2 font-mono">SKU</th>
                          <th className="p-2">Producto / Marca</th>
                          {applyWholesale && <th className="p-2 text-right">P. Mayor</th>}
                          {applyBox && <th className="p-2 text-right">P. Caja</th>}
                          {applySpecial && <th className="p-2 text-right">P. Especial</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                        {simulationData.samples.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                            <td className="p-2 font-bold text-cyan-600 dark:text-cyan-400">{p.sku}</td>
                            <td className="p-2 font-sans font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                              <div>{p.name}</div>
                              <span className="text-[10px] text-slate-400 font-sans">{p.brand}</span>
                            </td>
                            {applyWholesale && (
                              <td className="p-2 text-right whitespace-nowrap">
                                <span className="text-slate-400 line-through mr-1.5">{p.old_wholesale}</span>
                                <span className="font-black text-emerald-600 dark:text-emerald-400 font-sans">
                                  Bs {p.new_wholesale}
                                </span>
                              </td>
                            )}
                            {applyBox && (
                              <td className="p-2 text-right whitespace-nowrap">
                                <span className="text-slate-400 line-through mr-1.5">{p.old_box}</span>
                                <span className="font-black text-amber-600 dark:text-amber-400 font-sans">
                                  Bs {p.new_box}
                                </span>
                              </td>
                            )}
                            {applySpecial && (
                              <td className="p-2 text-right whitespace-nowrap">
                                <span className="text-slate-400 line-through mr-1.5">{p.old_special}</span>
                                <span className="font-black text-indigo-600 dark:text-indigo-400 font-sans">
                                  Bs {p.new_special}
                                </span>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* PANEL DE CONFIRMACIÓN CON RESPALDO */}
                  <div className="pt-2">
                    {!confirmStep ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-bold">
                          <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                          <span>Se creará un respaldo de seguridad automático de la base de datos antes de aplicar.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setConfirmStep(true)}
                          className="btn btn-primary bg-[#FF8C00] text-slate-950 font-black px-5 py-2 text-xs shrink-0 cursor-pointer shadow-md"
                        >
                          Continuar a Aplicar Reajuste
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                        <div className="flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-bold">
                          <AlertTriangle size={18} className="shrink-0 text-rose-500 mt-0.5" />
                          <div>
                            <p className="font-black">¿Confirmas la actualización masiva de precios?</p>
                            <p className="text-[11px] font-normal mt-0.5">
                              Esta acción actualizará los precios en el catálogo para <strong>{simulationData.totalMatched.toLocaleString()} productos</strong> ({scopeBrand === 'ALL' ? 'todas las marcas' : scopeBrand}, {scopeCategory === 'ALL' ? 'todos los rubros' : scopeCategory}).
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => setConfirmStep(false)}
                            className="btn btn-secondary px-3.5 py-1.5 text-xs font-bold"
                          >
                            Volver / Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleApplyAdjustment}
                            disabled={isApplying}
                            className="btn btn-primary bg-rose-600 hover:bg-rose-700 text-white font-black px-5 py-1.5 text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer"
                          >
                            {isApplying ? (
                              <>
                                <RefreshCw size={13} className="animate-spin" />
                                <span>Aplicando y respaldando...</span>
                              </>
                            ) : (
                              <>
                                <Check size={14} />
                                <span>Sí, Aplicar Reajuste Ahora</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-3 shrink-0 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock size={12} className="text-emerald-500" />
            <span>Exclusivo para Super Administrador con auditoría</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary px-4 py-1.5 text-xs font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

