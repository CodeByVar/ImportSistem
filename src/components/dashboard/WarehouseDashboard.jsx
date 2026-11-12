import React from 'react';
import { 
  Box, 
  Truck, 
  Ship, 
  AlertTriangle, 
  CheckCircle2, 
  CalendarDays, 
  Calendar,
  ArrowRight, 
  MapPin, 
  Package, 
  Layers,
  FileSpreadsheet,
  FileText,
  ClipboardList
} from 'lucide-react';
import { formatNumber, formatDate } from '../../utils/formatters';

export default function WarehouseDashboard({ 
  products = [], 
  containers = [], 
  onSelectTab, 
  currentUser 
}) {
  // Compute warehouse metrics
  const totalBoxes = products.reduce((acc, p) => acc + (Number(p.boxes_count) || 0), 0);
  const totalUnits = products.reduce((acc, p) => acc + (Number(p.current_stock) || 0), 0);
  const inTransitContainers = containers.filter(c => c.status !== 'recibido');
  const receivedContainers = containers.filter(c => c.status === 'recibido');
  
  // Critical stock products (stock <= min_stock)
  const criticalProducts = products
    .filter(p => (Number(p.current_stock) || 0) <= (Number(p.min_stock) || 5))
    .slice(0, 8);

  const inStockCount = products.filter(p => (Number(p.current_stock) || 0) > 0).length;

  const todayLabel = new Date().toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Header con Saludo y Ubicación de Almacén */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-500/10 via-blue-500/5 to-transparent p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>Terminal de Operaciones & Logística</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hola, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Encargado'} 📦
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 capitalize">
            {todayLabel} • Almacén Central Cochabamba
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onSelectTab('notes')}
            className="btn btn-primary bg-orange-600 hover:bg-orange-700 w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold cursor-pointer text-white"
          >
            <ClipboardList size={17} />
            <span>Orden de Entregas Diario</span>
          </button>
        </div>
      </div>

      {/* 2. KPIs Operativos de Almacén */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Cajas en Bodega */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <Box size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Cajas en Bodega
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {formatNumber(totalBoxes)} cjs
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {formatNumber(totalUnits)} unidades físicas
            </span>
          </div>
        </div>

        {/* Embarques en Tránsito */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center shrink-0">
            <Ship size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              En Tránsito / Ruta
            </span>
            <div className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-0.5">
              {inTransitContainers.length} Embarques
            </div>
            <span className="text-[11px] text-cyan-600 font-semibold">
              Vía Puerto / Camión
            </span>
          </div>
        </div>

        {/* Productos con Stock */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              SKUs Disponibles
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatNumber(inStockCount)}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">
              Listos para despacho
            </span>
          </div>
        </div>

        {/* Alertas de Quiebre de Stock */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Stock Crítico / Bajo
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {criticalProducts.length} Alertas
            </div>
            <span className="text-[11px] text-rose-500 font-semibold">
              Verificar conteo físico
            </span>
          </div>
        </div>

      </div>

      {/* 3. Accesos Rápidos de Almacén */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => onSelectTab('notes')}
          className="p-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-left flex items-center justify-between transition-all shadow-md shadow-orange-600/20 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ClipboardList size={20} />
            </div>
            <div>
              <div className="text-sm font-black">Orden de Entregas</div>
              <div className="text-[11px] text-white/80">Control diario L-M-M-J-V-S</div>
            </div>
          </div>
          <ArrowRight size={18} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('weekly')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left flex items-center justify-between transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <CalendarDays size={18} />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-white">Planilla Semanal L-S</div>
              <div className="text-[11px] text-slate-500">Despacho automático de ventas</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('containers')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left flex items-center justify-between transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center">
              <Ship size={18} />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-white">Embarques & Prelistas</div>
              <div className="text-[11px] text-slate-500">Barcos, aduana y camiones</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('inventory')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left flex items-center justify-between transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Package size={18} />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-white">Stock en Bodega</div>
              <div className="text-[11px] text-slate-500">Consultar cajas físicas</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400" />
        </button>
      </div>

      {/* 4. Cuerpo Principal: Embarques en Ruta + Alertas Físicas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Embarques y Camiones en Camino (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ship size={18} className="text-cyan-600" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Embarques y Camiones por Llegar
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('containers')}
              className="text-xs font-bold text-cyan-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {containers.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No hay embarques registrados en tránsito.
            </div>
          ) : (
            <div className="space-y-3">
              {containers.slice(0, 4).map((c) => {
                const isReceived = c.status === 'recibido';
                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectTab('containers')}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 hover:border-cyan-400 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                          {c.tracking_number}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase">
                          {c.shipping_line || 'Naviera'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isReceived 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40'
                          : 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40'
                      }`}>
                        {isReceived ? '✅ EN BODEGA' : '🌊 EN TRÁNSITO'}
                      </span>
                    </div>

                    {/* Fecha de Llegada de Nueva Mercadería (Destacada) */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-xs">
                      <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-200 font-bold">
                        <Calendar size={14} className="text-cyan-600 dark:text-cyan-400" />
                        <span>
                          {isReceived ? 'Llegada a Bodega:' : 'Fecha Llegada Nueva Mercadería:'}
                        </span>
                      </div>
                      <span className="font-extrabold font-mono text-cyan-700 dark:text-cyan-300 text-xs">
                        {isReceived 
                          ? formatDate(c.actual_arrival || c.estimated_arrival)
                          : formatDate(c.estimated_arrival)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-cyan-500" />
                        <span>Origen: <strong className="text-slate-700 dark:text-slate-300">{c.origin_country || 'China'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Puerto: <strong className="text-slate-700 dark:text-slate-300">{c.port_name || 'Arica'}</strong></span>
                        {c.total_boxes > 0 && (
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            • {formatNumber(c.total_boxes)} cjs
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha: Alertas de Quiebre de Stock en Bodega (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-500" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Alertas de Stock en Bodega
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('inventory')}
              className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver inventario</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {criticalProducts.length === 0 ? (
            <div className="py-12 text-center text-xs text-emerald-600 font-bold">
              ✅ Todos los productos tienen stock saludable en bodega.
            </div>
          ) : (
            <div className="space-y-2.5">
              {criticalProducts.map((p) => {
                const stock = Number(p.current_stock) || 0;
                const isZero = stock <= 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectTab('inventory')}
                    className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between gap-3 hover:border-rose-400 transition-all cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] font-bold text-rose-600 uppercase">
                        {p.sku}
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {p.name}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        📍 {p.warehouse || 'CASA CUBANO'}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`px-2 py-1 rounded-lg text-xs font-black font-mono ${
                        isZero 
                          ? 'bg-rose-600 text-white' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {isZero ? 'AGOTADO' : `${stock} u`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

