import React, { useState, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  ShoppingCart, 
  Lock, 
  BarChart3, 
  Calendar, 
  Coins, 
  Search, 
  SlidersHorizontal, 
  MoreVertical, 
  Package, 
  Ship, 
  ShieldCheck, 
  Plane,
  ChevronDown,
  PieChart,
  Layers,
  TrendingUp,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function ModernDashboard({ 
  stats, 
  chartsData, 
  products = [], 
  movements = [], 
  containers = [],
  onOpenNewMovement, 
  onOpenNewNote, 
  onOpenNewProduct,
  onOpenNewContainer,
  onSelectTab 
}) {
  const [currency, setCurrency] = useState('USD'); // 'USD' or 'BOB'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [chartFilter, setChartFilter] = useState('ALL'); // 'ALL', 'VENTAS', 'COSTOS'
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState(null);
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(null);

  // Format currency helpers
  const formatMoney = (val, curr = currency) => {
    const num = Number(val || 0);
    if (curr === 'BOB') {
      return `Bs ${num.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Live capital calculations from ERP stock
  const capitalCostoUsd = useMemo(() => {
    if (stats?.totalValue) return Number(stats.totalValue);
    return 978040.00;
  }, [stats]);

  // Inventory distribution categories for the executive Donut Chart
  const categoriesDistribution = useMemo(() => {
    const total = capitalCostoUsd;
    return [
      {
        id: 'maquinaria',
        name: 'Maquinaria & Equipos Pesados',
        percentage: 38,
        amount: total * 0.38,
        color: '#EA580C',
        svgColor: '#EA580C',
        badgeBg: 'bg-orange-50 dark:bg-orange-950/40 text-[#EA580C] border border-orange-200/80 dark:border-orange-900',
        dotBg: 'bg-[#EA580C]',
        count: 428
      },
      {
        id: 'repuestos',
        name: 'Repuestos & Motores Diésel',
        percentage: 28,
        amount: total * 0.28,
        color: '#0F172A',
        svgColor: '#0F172A',
        badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700',
        dotBg: 'bg-slate-900 dark:bg-slate-200',
        count: 362
      },
      {
        id: 'sensores',
        name: 'Sensores & Sistemas Eléctricos',
        percentage: 20,
        amount: total * 0.20,
        color: '#F59E0B',
        svgColor: '#F59E0B',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900',
        dotBg: 'bg-amber-500',
        count: 245
      },
      {
        id: 'herramientas',
        name: 'Herramientas & Despachos',
        percentage: 14,
        amount: total * 0.14,
        color: '#10B981',
        svgColor: '#10B981',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900',
        dotBg: 'bg-emerald-500',
        count: 184
      }
    ];
  }, [capitalCostoUsd]);

  // Operations for the activities table
  const activities = useMemo(() => {
    return [
      {
        id: 'INV_009076',
        client: 'Lote Repuestos Maquinaria',
        category: 'repuestos',
        icon: Package,
        iconBg: 'bg-orange-50 text-orange-600 border border-orange-200/70 dark:bg-orange-950/50 dark:border-orange-900',
        amount: 25500.00,
        status: 'Completado',
        statusType: 'success',
        date: '17 Abr, 2026 03:45 PM'
      },
      {
        id: 'INV_009075',
        client: 'Flete Naviero Contenedor #40HC',
        category: 'naviero',
        icon: Ship,
        iconBg: 'bg-blue-50 text-blue-600 border border-blue-200/70 dark:bg-blue-950/50 dark:border-blue-900',
        amount: 32750.00,
        status: 'Pendiente Pago',
        statusType: 'danger',
        date: '15 Abr, 2026 11:30 AM'
      },
      {
        id: 'INV_009074',
        client: 'Despacho Aéreo Express - Sensores',
        category: 'aereo',
        icon: Plane,
        iconBg: 'bg-purple-50 text-purple-600 border border-purple-200/70 dark:bg-purple-950/50 dark:border-purple-900',
        amount: 40200.00,
        status: 'Completado',
        statusType: 'success',
        date: '15 Abr, 2026 12:00 PM'
      },
      {
        id: 'INV_009073',
        client: 'Distribuidora El Triunfo - NV 4410',
        category: 'distribuidora',
        icon: Activity,
        iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/70 dark:bg-amber-950/50 dark:border-amber-900',
        amount: 50200.00,
        status: 'En Progreso',
        statusType: 'warning',
        date: '14 Abr, 2026 09:15 PM'
      },
      {
        id: 'INV_009072',
        client: 'Póliza Seguro Internacional Carga',
        category: 'seguro',
        icon: ShieldCheck,
        iconBg: 'bg-teal-50 text-teal-600 border border-teal-200/70 dark:bg-teal-950/50 dark:border-teal-900',
        amount: 15900.00,
        status: 'Completado',
        statusType: 'success',
        date: '10 Abr, 2026 06:00 AM'
      }
    ];
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const matchSearch = a.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [activities, searchTerm, statusFilter]);

  // Enhanced monthly financial flow
  const monthlyFlowData = [
    { month: 'Nov', costos: 38, ventas: 58, costosVal: 38200, ventasVal: 58400, margen: '+34.5%' },
    { month: 'Dic', costos: 52, ventas: 84, costosVal: 52100, ventasVal: 84300, margen: '+38.2%' },
    { month: 'Ene', costos: 42, ventas: 68, costosVal: 42000, ventasVal: 68100, margen: '+38.3%' },
    { month: 'Feb', costos: 35, ventas: 54, costosVal: 35400, ventasVal: 54200, margen: '+34.7%' },
    { month: 'Mar', costos: 50, ventas: 88, costosVal: 50300, ventasVal: 88600, margen: '+43.2%' },
    { month: 'Abr', costos: 45, ventas: 95, costosVal: 45600, ventasVal: 95200, margen: '+52.1%' }
  ];

  // Donut SVG circumference calculation (r = 44 => C ≈ 276.46)
  const circumference = 276.46;
  let accumulatedOffset = 0;

  return (
    <div className="w-full space-y-10 pb-4">
      
      {/* ========================================================================= */}
      {/* HEADER CARD INTEGRADO: Saludo + Botones de Acción Gruesos y Sólidos       */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-7 pt-1 border-b-2 border-slate-200/90 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-[#EA580C]">
              Panel de Control General
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-1 font-heading">
            Buenos días, Carlos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Supervisa el flujo de importaciones, inventario valorizado y despachos en tiempo real.
          </p>
        </div>

        {/* Quick Header Actions con GROSOR y Presencia */}
        <div className="flex items-center gap-3.5 self-start sm:self-auto shrink-0">
          <button 
            type="button"
            onClick={() => onOpenNewMovement('ENTRADA')}
            className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold px-5 py-3 rounded-2xl shadow-md hover:shadow-lg cursor-pointer transition-all hover:scale-102 border-2 border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <Plus size={16} strokeWidth={2.8} />
            <span>Nueva Entrada</span>
          </button>

          <button 
            type="button"
            onClick={onOpenNewNote}
            className="flex items-center gap-2 bg-[#EA580C] hover:bg-orange-600 text-white text-xs sm:text-sm font-extrabold px-5 py-3 rounded-2xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/45 cursor-pointer transition-all hover:scale-102 border-2 border-orange-600"
          >
            <ShoppingCart size={16} strokeWidth={2.2} />
            <span>Generar Venta</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIER 1: 4 TARJETAS KPI PRINCIPALES (AMPLIAS, SIN COMPRESIÓN, GROSOR REAL)   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: VENTAS TOTALES (Naranja Vibrante con Grosor) */}
        <div className="bg-gradient-to-br from-orange-500 via-[#EA580C] to-orange-700 text-white rounded-3xl p-7 shadow-xl shadow-orange-500/20 border-2 border-orange-400/50 flex flex-col justify-between min-h-[185px] relative overflow-hidden group hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wide text-orange-100 uppercase">
              Ventas Totales
            </span>
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-xs shadow-inner">
              <Coins size={20} strokeWidth={2.2} />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-black tracking-tight font-heading">
              $24,492.00
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-white bg-white/20 mt-2.5">
              <ArrowUpRight size={14} strokeWidth={2.5} />
              <span>+8.5% este mes</span>
            </div>
          </div>
        </div>

        {/* KPI 2: COSTO MERCADERÍA */}
        <div className="bg-slate-50/90 dark:bg-slate-800/60 rounded-3xl p-7 border-2 border-slate-200/90 dark:border-slate-700/80 flex flex-col justify-between min-h-[185px] shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wide text-slate-500 dark:text-slate-400 uppercase">
              Costo Mercadería
            </span>
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-2xs">
              <Lock size={19} strokeWidth={2.2} />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
              $15,692.00
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900 mt-2.5">
              <ArrowDownRight size={14} strokeWidth={2.5} />
              <span>3.2% costos flete</span>
            </div>
          </div>
        </div>

        {/* KPI 3: UTILIDAD BRUTA */}
        <div className="bg-slate-50/90 dark:bg-slate-800/60 rounded-3xl p-7 border-2 border-slate-200/90 dark:border-slate-700/80 flex flex-col justify-between min-h-[185px] shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wide text-slate-500 dark:text-slate-400 uppercase">
              Utilidad Bruta
            </span>
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-2xs">
              <BarChart3 size={19} strokeWidth={2.2} />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
              $23,298.00
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900 mt-2.5">
              <ArrowUpRight size={14} strokeWidth={2.5} />
              <span>+11.2% margen neto</span>
            </div>
          </div>
        </div>

        {/* KPI 4: DESPACHOS ACTIVOS */}
        <div className="bg-slate-50/90 dark:bg-slate-800/60 rounded-3xl p-7 border-2 border-slate-200/90 dark:border-slate-700/80 flex flex-col justify-between min-h-[185px] shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wide text-slate-500 dark:text-slate-400 uppercase">
              Despachos Activos
            </span>
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-2xs">
              <Calendar size={19} strokeWidth={2.2} />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
              161 uds.
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900 mt-2.5">
              <ArrowUpRight size={14} strokeWidth={2.5} />
              <span>8 despachos en ruta</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* TIER 2: ANALYTICS Y GRÁFICOS MAESTROS (SIMETRÍA 50% / 50% BALANCEADA)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch">
        
        {/* COLUMNA IZQUIERDA (lg:col-span-6): Capital en Bodega & Distribución de Inventario */}
        <div className="lg:col-span-6 space-y-7 flex flex-col justify-between">
          
          {/* CARD 1: Capital en Bodega + Botones Cuadrados con GROSOR */}
          <div className="bg-slate-50/90 dark:bg-slate-800/60 rounded-3xl p-7 sm:p-8 border-2 border-slate-200/90 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
            <div>
              {/* Header: Title + Currency Dropdown */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  CAPITAL EN BODEGA (COSTO)
                </span>
                <button 
                  type="button"
                  onClick={() => setCurrency(c => c === 'USD' ? 'BOB' : 'USD')}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-700 text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors shadow-2xs"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>{currency}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
              </div>

              {/* Big Stat */}
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
                {formatMoney(capitalCostoUsd, currency)}
              </div>

              {/* Trend Indicator */}
              <div className="flex items-center gap-1.5 mt-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight size={16} strokeWidth={2.5} />
                <span>+12.4%</span>
                <span className="text-slate-400 font-semibold">vs mes anterior</span>
              </div>
            </div>

            {/* SECCIÓN DE BOTONES CUADRADOS: Almacenes & Moneda con GROSOR Y SÓLIDEZ */}
            <div className="mt-6 pt-5 border-t-2 border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Almacenes & Moneda
                </span>
                <span className="text-[11px] font-extrabold px-3 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  4 Unidades
                </span>
              </div>

              {/* 3 Botones Cuadrados Sólidos con Espacio Amplio */}
              <div className="grid grid-cols-3 gap-4">
                {/* Botón Cuadrado USD */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-700 shadow-xs hover:border-[#EA580C] hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-center justify-between text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>USD</span>
                    </div>
                    <MoreVertical size={14} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                  </div>
                  <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1.5 font-mono">
                    $124,670
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">B. Central</div>
                  <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">Activa</div>
                </div>

                {/* Botón Cuadrado BOB */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-700 shadow-xs hover:border-[#EA580C] hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-center justify-between text-[11px] font-black text-blue-600 dark:text-blue-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>BOB</span>
                    </div>
                    <MoreVertical size={14} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                  </div>
                  <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1.5 font-mono">
                    Bs 812,450
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">Sucursal 1</div>
                  <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">Activa</div>
                </div>

                {/* Botón Cuadrado CNY */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-700 shadow-xs hover:border-[#EA580C] hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-center justify-between text-[11px] font-black text-amber-600 dark:text-amber-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>CNY</span>
                    </div>
                    <MoreVertical size={14} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                  </div>
                  <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1.5 font-mono">
                    ¥49,200
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">Aduana Ext</div>
                  <div className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 mt-1">En Tránsito</div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: Distribución de Inventario Donut Chart (Amplia y Cómoda) */}
          <div className="bg-slate-50/90 dark:bg-slate-800/60 rounded-3xl p-7 sm:p-8 border-2 border-slate-200/90 dark:border-slate-700/80 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/70 border border-orange-200 dark:border-orange-900 flex items-center justify-center text-[#EA580C]">
                    <PieChart size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Distribución de Inventario
                    </h3>
                    <p className="text-xs text-slate-400">
                      Capital valorizado por categoría
                    </p>
                  </div>
                </div>
                
                <button 
                  type="button"
                  onClick={() => onSelectTab('inventory')}
                  className="flex items-center gap-1.5 text-xs font-extrabold text-[#EA580C] hover:underline cursor-pointer"
                >
                  <span>Ver Catálogo</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Donut Visual & Quick Stats */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-700 shadow-xs">
                
                {/* SVG Donut */}
                <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="11"
                      className="text-slate-100 dark:text-slate-800"
                    />
                    {categoriesDistribution.map((cat, idx) => {
                      const strokeDash = ((cat.percentage / 100) * circumference) - 3;
                      const strokeOffset = -accumulatedOffset;
                      accumulatedOffset += (cat.percentage / 100) * circumference;
                      const isHovered = activeCategoryIdx === idx;

                      return (
                        <circle
                          key={cat.id}
                          cx="50"
                          cy="50"
                          r="44"
                          fill="transparent"
                          stroke={cat.svgColor}
                          strokeWidth={isHovered ? 13 : 11}
                          strokeDasharray={`${strokeDash} ${circumference}`}
                          strokeDashoffset={strokeOffset}
                          strokeLinecap="round"
                          className="transition-all duration-300 cursor-pointer hover:opacity-90"
                          onMouseEnter={() => setActiveCategoryIdx(idx)}
                          onMouseLeave={() => setActiveCategoryIdx(null)}
                        />
                      );
                    })}
                  </svg>

                  {/* Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-1">
                    {activeCategoryIdx !== null ? (
                      <>
                        <span className="text-xs font-black tracking-tight text-[#EA580C]">
                          {categoriesDistribution[activeCategoryIdx].percentage}%
                        </span>
                        <span className="text-[8px] font-black text-slate-400 uppercase leading-none mt-0.5 truncate max-w-[65px]">
                          {categoriesDistribution[activeCategoryIdx].name.split(' ')[0]}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white font-heading">
                          $978K
                        </span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                          EN STOCK
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Highlight Info */}
                <div className="flex-1 space-y-1.5 w-full">
                  {activeCategoryIdx !== null ? (
                    <div>
                      <span className="text-slate-900 dark:text-white font-black text-xs block">
                        {categoriesDistribution[activeCategoryIdx].name}
                      </span>
                      <span className="text-[#EA580C] font-black text-sm font-mono block mt-0.5">
                        {formatMoney(categoriesDistribution[activeCategoryIdx].amount, currency)}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {categoriesDistribution[activeCategoryIdx].count} ítems en almacén ({categoriesDistribution[activeCategoryIdx].percentage}% del total)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-slate-900 dark:text-white font-black text-xs block">
                        4 Categorías Principales
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-xs block mt-1">
                        Pasa el cursor sobre los segmentos o las categorías para ver detalles valorizados.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Category Breakdown Progress Bars con Grosor */}
              <div className="space-y-3 mt-4">
                {categoriesDistribution.map((cat, idx) => (
                  <div 
                    key={cat.id}
                    onMouseEnter={() => setActiveCategoryIdx(idx)}
                    onMouseLeave={() => setActiveCategoryIdx(null)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      activeCategoryIdx === idx
                        ? 'bg-white dark:bg-slate-900 border-[#EA580C] shadow-sm scale-[1.01]'
                        : 'bg-transparent border-transparent hover:bg-white/70 dark:hover:bg-slate-900/70 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3 h-3 rounded-full ${cat.dotBg} shrink-0 shadow-2xs`} />
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-black text-slate-900 dark:text-white">
                          {formatMoney(cat.amount, currency)}
                        </span>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${cat.badgeBg}`}>
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Line Gruesa */}
                    <div className="h-2 w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.svgColor
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA (lg:col-span-6): Flujo Financiero Semestral + Presupuesto */}
        <div className="lg:col-span-6 space-y-7 flex flex-col justify-between">
          
          {/* CARD 3: Flujo Financiero Semestral (Espacioso, sin colisiones) */}
          <div className="bg-slate-50/90 dark:bg-slate-800/60 rounded-3xl p-7 sm:p-8 border-2 border-slate-200/90 dark:border-slate-700/80 shadow-sm flex-1 flex flex-col justify-between min-h-[410px]">
            <div>
              {/* Header con espacio generoso */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Flujo Financiero Semestral
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ventas facturadas vs Costos Landed de mercadería
                  </p>
                </div>

                {/* Filtros con botones gruesos y separados */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border-2 border-slate-200/90 dark:border-slate-700 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setChartFilter('ALL')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black min-w-[65px] text-center cursor-pointer transition-colors ${
                      chartFilter === 'ALL'
                        ? 'bg-slate-900 text-white dark:bg-slate-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartFilter('VENTAS')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black min-w-[65px] text-center cursor-pointer transition-colors ${
                      chartFilter === 'VENTAS'
                        ? 'bg-[#EA580C] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Ventas
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartFilter('COSTOS')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black min-w-[65px] text-center cursor-pointer transition-colors ${
                      chartFilter === 'COSTOS'
                        ? 'bg-slate-800 text-white dark:bg-slate-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Costos
                  </button>
                </div>
              </div>

              {/* Floating Tooltip Pill */}
              <div className="h-7 my-2 flex items-center">
                {hoveredMonthIdx !== null ? (
                  <div className="flex items-center gap-2.5 text-xs font-black bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-700 px-4 py-1 rounded-full text-slate-800 dark:text-slate-100 shadow-xs animate-fade-in">
                    <span className="text-[#EA580C]">{monthlyFlowData[hoveredMonthIdx].month}:</span>
                    <span>Ventas ${monthlyFlowData[hoveredMonthIdx].ventasVal.toLocaleString()}</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span>Costos ${monthlyFlowData[hoveredMonthIdx].costosVal.toLocaleString()}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">({monthlyFlowData[hoveredMonthIdx].margen})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-bold">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-slate-300" />
                      <span>Costos Landed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
                      <span>Ventas Facturadas</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Visual de Barras con GROSOR Real */}
            <div className="relative flex items-end justify-between gap-5 h-56 pt-8 pb-3 px-3">
              <div className="absolute inset-x-0 top-10 border-b border-dashed border-slate-200 dark:border-slate-700/60 pointer-events-none" />
              <div className="absolute inset-x-0 top-24 border-b border-dashed border-slate-200 dark:border-slate-700/60 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-10 border-b border-dashed border-slate-200 dark:border-slate-700/60 pointer-events-none" />

              {monthlyFlowData.map((item, idx) => (
                <div 
                  key={idx} 
                  onMouseEnter={() => setHoveredMonthIdx(idx)}
                  onMouseLeave={() => setHoveredMonthIdx(null)}
                  className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end group cursor-pointer z-10"
                >
                  <div className="w-full flex items-end justify-center gap-2.5 h-full">
                    {/* Costos Bar Gruesa */}
                    {(chartFilter === 'ALL' || chartFilter === 'COSTOS') && (
                      <div 
                        style={{ height: `${item.costos}%` }}
                        className={`w-5 sm:w-6 bg-slate-900 dark:bg-slate-400 rounded-t-lg transition-all duration-300 ${
                          hoveredMonthIdx === idx ? 'scale-y-105 opacity-100 shadow-md' : 'group-hover:opacity-90'
                        }`}
                      />
                    )}
                    {/* Ventas Bar Gruesa con Gradiente */}
                    {(chartFilter === 'ALL' || chartFilter === 'VENTAS') && (
                      <div 
                        style={{ height: `${item.ventas}%` }}
                        className={`w-5 sm:w-6 bg-gradient-to-t from-orange-600 to-[#EA580C] rounded-t-lg transition-all duration-300 shadow-sm shadow-orange-500/25 ${
                          hoveredMonthIdx === idx ? 'scale-y-105 brightness-110 shadow-lg' : 'group-hover:opacity-90'
                        }`}
                      />
                    )}
                  </div>
                  <span className={`text-xs font-black transition-colors ${
                    hoveredMonthIdx === idx ? 'text-[#EA580C]' : 'text-slate-400'
                  }`}>
                    {item.month}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Summary Bar */}
            <div className="pt-4 border-t-2 border-slate-200/80 dark:border-slate-800 flex flex-wrap justify-between items-center text-xs gap-3">
              <span className="text-slate-400 font-extrabold uppercase tracking-wide text-[11px]">
                Rendimiento Acumulado Q1-Q2
              </span>
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-slate-700 dark:text-slate-300">
                  Total Facturado: <strong className="text-slate-900 dark:text-white">$448.8K</strong>
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-900">
                  +28.4% margen neto
                </span>
              </div>
            </div>
          </div>

          {/* CARD 4: Presupuesto Mensual de Embarques */}
          <div className="bg-slate-50/90 dark:bg-slate-800/60 rounded-3xl p-7 sm:p-8 border-2 border-slate-200/90 dark:border-slate-700/80 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/70 border border-orange-200 dark:border-orange-900 flex items-center justify-center text-[#EA580C]">
                  <Ship size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Presupuesto Mensual de Embarques
                  </h3>
                  <p className="text-xs text-slate-400">
                    Límite asignado para aranceles y flete marítimo
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-[#EA580C] bg-orange-50 dark:bg-orange-950/60 px-3 py-1 rounded-full border border-orange-200/80 dark:border-orange-900">
                72% Ejecutado
              </span>
            </div>

            {/* Barra de Progreso Gruesa */}
            <div className="h-3.5 w-full bg-slate-200/90 dark:bg-slate-700/80 rounded-full overflow-hidden p-0.5 mb-3.5 border border-slate-200 dark:border-slate-600">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-[#EA580C] rounded-full transition-all duration-500 shadow-xs" 
                style={{ width: '72%' }}
              />
            </div>

            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="font-black text-slate-900 dark:text-white">
                $36,000.00 <span className="text-slate-400 font-bold text-xs">ejecutado</span>
              </span>
              <span className="font-extrabold text-slate-500">
                $50,000.00 <span className="font-bold text-xs">tope mensual</span>
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* TIER 3: TABLA MAESTRA FULL-WIDTH (ESPACIO TOTAL, SIN COMPRESIÓN)           */}
      {/* ========================================================================= */}
      <div className="bg-slate-50/90 dark:bg-slate-800/60 rounded-3xl p-7 sm:p-8 border-2 border-slate-200/90 dark:border-slate-700/80 w-full shadow-sm transition-colors">
        
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Actividades Recientes & Despachos
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Movimientos aduaneros, fletes internacionales y notas de venta registradas
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Bar Gruesa */}
            <div className="relative flex-1 sm:flex-initial">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar NV, factura o cliente..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-11 pr-5 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-700 rounded-2xl w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 text-slate-800 dark:text-slate-100 shadow-2xs font-medium"
              />
            </div>

            {/* Filtros Button Grueso */}
            <button 
              type="button"
              onClick={() => setStatusFilter(f => f === 'ALL' ? 'Completado' : 'ALL')}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold border-2 transition-colors cursor-pointer shadow-2xs shrink-0 ${
                statusFilter !== 'ALL'
                  ? 'bg-[#EA580C] text-white border-[#EA580C]'
                  : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>{statusFilter === 'ALL' ? 'Filtros' : statusFilter}</span>
            </button>
          </div>
        </div>

        {/* Contenedor de Tabla con Borde Grueso y Celdas Amplias */}
        <div className="overflow-x-auto rounded-2xl border-2 border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 shadow-xs">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b-2 border-slate-200/80 dark:border-slate-800 text-[11px] uppercase font-black text-slate-400 tracking-wider bg-slate-100/60 dark:bg-slate-800/50">
                <th className="py-4 px-5 w-12">
                  <input type="checkbox" className="rounded text-[#EA580C] focus:ring-orange-500 w-4 h-4" />
                </th>
                <th className="py-4 px-5">N° ORDEN / NV</th>
                <th className="py-4 px-5">ACTIVIDAD / CLIENTE</th>
                <th className="py-4 px-5">MONTO / VALOR</th>
                <th className="py-4 px-5">ESTADO</th>
                <th className="py-4 px-5">FECHA & HORA</th>
                <th className="py-4 px-5 text-right">ACCIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm font-semibold">
              {filteredActivities.map((row) => {
                const Icon = row.icon;
                return (
                  <tr 
                    key={row.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-4.5 px-5">
                      <input type="checkbox" className="rounded text-[#EA580C] focus:ring-orange-500 w-4 h-4" />
                    </td>
                    <td className="py-4.5 px-5 font-black text-slate-800 dark:text-slate-200 font-mono">
                      {row.id}
                    </td>
                    <td className="py-4.5 px-5">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${row.iconBg}`}>
                          <Icon size={18} />
                        </div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-100">
                          {row.client}
                        </span>
                      </div>
                    </td>
                    <td className="py-4.5 px-5 font-black text-slate-900 dark:text-white font-mono text-sm sm:text-base">
                      {formatMoney(row.amount, 'USD')}
                    </td>
                    <td className="py-4.5 px-5">
                      {row.statusType === 'success' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          {row.status}
                        </span>
                      )}
                      {row.statusType === 'danger' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-400">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          {row.status}
                        </span>
                      )}
                      {row.statusType === 'warning' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-400">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          {row.status}
                        </span>
                      )}
                    </td>
                    <td className="py-4.5 px-5 text-slate-500 dark:text-slate-400 text-xs">
                      {row.date}
                    </td>
                    <td className="py-4.5 px-5 text-right">
                      <button 
                        type="button"
                        onClick={() => onSelectTab('notes')}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer con Márgenes y Separación Limpia */}
      <footer className="mt-12 pt-6 pb-2 px-1 border-t-2 border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-3">
        <div>
          © 2026 SisControl ERP - Importadora Rivero. Todos los derechos reservados.
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Servidores Conectados • Zona Horaria America/La_Paz</span>
        </div>
      </footer>
    </div>
  );
}
