import React from 'react';
import { 
  ClipboardList, 
  Package, 
  CalendarDays, 
  LayoutDashboard, 
  Plus,
  Users
} from 'lucide-react';
import { getPermissions } from '../config/permissions';

export default function MobileBottomNav({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenNewNote,
  onOpenCustomers
}) {
  const perms = getPermissions(currentUser?.role);

  // Tabs permitidos para la barra inferior en celular
  const allowed = perms.allowedTabs || [];

  return (
    <nav 
      aria-label="Navegación móvil"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/98 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800/90 px-1.5 py-1.5 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.5)] select-none safe-area-pb transition-colors"
    >
      <div className="flex items-center justify-between w-full max-w-md mx-auto gap-0.5">
        {/* 1. Entregas del Día (Orden de Entregas) - Principal para Almacén & Ventas */}
        {allowed.includes('notes') && (
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'text-[#FF8C00] dark:text-[#FFC107] font-extrabold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'notes' ? 'bg-[#FF8C00]/15 dark:bg-[#FF8C00]/20 text-[#FF8C00] dark:text-[#FFC107]' : ''}`}>
              <ClipboardList size={19} strokeWidth={activeTab === 'notes' ? 2.5 : 1.8} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold truncate w-full text-center">Entregas</span>
          </button>
        )}

        {/* 2. Catálogo & Stock */}
        {allowed.includes('inventory') && (
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'text-[#FF8C00] dark:text-[#FFC107] font-extrabold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'inventory' ? 'bg-[#FF8C00]/15 dark:bg-[#FF8C00]/20 text-[#FF8C00] dark:text-[#FFC107]' : ''}`}>
              <Package size={19} strokeWidth={activeTab === 'inventory' ? 2.5 : 1.8} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold truncate w-full text-center">Stock</span>
          </button>
        )}

        {/* 3. Botón Central: NUEVA NOTA (Paleta Oficial Naranja #FF8C00 -> Dorado #FFC107) */}
        {onOpenNewNote && (
          <button
            type="button"
            onClick={onOpenNewNote}
            className="flex-1 min-w-0 flex flex-col items-center justify-center -mt-4 group cursor-pointer"
            title="Emitir nueva nota de despacho o venta"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#FF8C00] via-[#FFA000] to-[#FFC107] text-[#0D0D0D] flex items-center justify-center shadow-[0_4px_18px_rgba(255,140,0,0.48)] active:scale-95 transition-transform border-2 border-white dark:border-[#121212]">
              <Plus size={22} strokeWidth={3} />
            </div>
            <span className="text-[10px] text-[#FF8C00] dark:text-[#FFC107] font-black mt-0.5 truncate w-full text-center">Nueva Nota</span>
          </button>
        )}

        {/* 4. Clientes & Deudas (Opción 1 activada directo en barra móvil) */}
        {perms.showCustomers && onOpenCustomers ? (
          <button
            type="button"
            onClick={onOpenCustomers}
            className="flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-slate-500 hover:text-[#FF8C00] dark:text-slate-400 dark:hover:text-[#FFC107] transition-all cursor-pointer"
          >
            <div className="p-1 rounded-lg">
              <Users size={19} strokeWidth={2} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold truncate w-full text-center">Clientes</span>
          </button>
        ) : allowed.includes('weekly') ? (
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'weekly'
                ? 'text-[#FF8C00] dark:text-[#FFC107] font-extrabold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'weekly' ? 'bg-[#FF8C00]/15 dark:bg-[#FF8C00]/20 text-[#FF8C00] dark:text-[#FFC107]' : ''}`}>
              <CalendarDays size={19} strokeWidth={activeTab === 'weekly' ? 2.5 : 1.8} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold truncate w-full text-center">Reportes</span>
          </button>
        ) : null}

        {/* 5. Dashboard / Reportes */}
        {allowed.includes('dashboard') && (
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-[#FF8C00] dark:text-[#FFC107] font-extrabold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'dashboard' ? 'bg-[#FF8C00]/15 dark:bg-[#FF8C00]/20 text-[#FF8C00] dark:text-[#FFC107]' : ''}`}>
              <LayoutDashboard size={19} strokeWidth={activeTab === 'dashboard' ? 2.5 : 1.8} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold truncate w-full text-center">Dashboard</span>
          </button>
        )}

        {/* 6. Reportes (si el rol tiene weekly en móvil) */}
        {allowed.includes('weekly') && perms.showCustomers && (
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'weekly'
                ? 'text-[#FF8C00] dark:text-[#FFC107] font-extrabold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'weekly' ? 'bg-[#FF8C00]/15 dark:bg-[#FF8C00]/20 text-[#FF8C00] dark:text-[#FFC107]' : ''}`}>
              <CalendarDays size={19} strokeWidth={activeTab === 'weekly' ? 2.5 : 1.8} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold truncate w-full text-center">Reportes</span>
          </button>
        )}
      </div>
    </nav>
  );
}
