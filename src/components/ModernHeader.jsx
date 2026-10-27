import React from 'react';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';

export default function ModernHeader({ 
  activeTab, 
  setActiveTab, 
  theme,
  toggleTheme,
  onOpenNewNote,
  onOpenCustomers 
}) {
  return (
    <header 
      className="w-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)] border-2 border-slate-200/90 dark:border-slate-800 px-8 sm:px-14 lg:px-18 py-3.5 min-h-[72px] flex items-center justify-between gap-6 transition-all"
    >
      {/* Left: Brand Logo con Aire Real de la Curva (ml-4 sm:ml-8) */}
      <div className="flex items-center gap-3 shrink-0 ml-3 sm:ml-6 lg:ml-8">
        <div className="bg-slate-950 dark:bg-slate-800 text-white font-black px-5 py-2.5 rounded-2xl flex items-center gap-4 shadow-md border-2 border-slate-800 dark:border-slate-700 select-none">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-[#EA580C] text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
            R
          </div>
          <div className="flex flex-col leading-none hidden sm:flex pr-1">
            <span className="text-[10px] tracking-[0.22em] text-orange-400 font-extrabold uppercase">
              IMPORTADORA
            </span>
            <span className="text-sm font-black tracking-wider text-white mt-1">
              RIVERO
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions & User Capsule con Aire Real de la Curva Derecha (mr-4 sm:mr-8) */}
      <div className="flex items-center gap-3 sm:gap-3.5 shrink-0 mr-3 sm:mr-6 lg:mr-8">
        {/* Circular Search Button */}
        <button 
          type="button"
          title="Buscar en catálogo e inventario"
          onClick={() => setActiveTab && setActiveTab('inventory')}
          className="w-9.5 h-9.5 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
        >
          <Search size={15} strokeWidth={2.2} />
        </button>

        {/* Circular Notification Bell with Orange Dot */}
        <button 
          type="button"
          title="Notificaciones de despachos y llegadas"
          onClick={() => setActiveTab && setActiveTab('containers')}
          className="w-9.5 h-9.5 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative cursor-pointer shadow-2xs"
        >
          <Bell size={15} strokeWidth={2.2} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EA580C] ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* Circular Help Button */}
        <button 
          type="button"
          title="Información y Ayuda"
          onClick={() => alert('SisControl ERP - Sistema de Gestión de Importaciones y Despachos')}
          className="w-9.5 h-9.5 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
        >
          <HelpCircle size={15} strokeWidth={2.2} />
        </button>

        {/* Circular Theme Toggle Button */}
        {toggleTheme && (
          <button 
            type="button"
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            onClick={toggleTheme}
            className="w-9.5 h-9.5 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
          </button>
        )}

        {/* User Profile Capsule con Margen Real y Totalmente Separado del Borde */}
        <div 
          onClick={onOpenCustomers}
          title="Perfil de Usuario"
          className="flex items-center gap-3 pl-2 pr-4.5 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200/90 dark:border-slate-700 hover:border-[#EA580C]/60 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all cursor-pointer select-none shadow-xs ml-1"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-[#EA580C] text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
            CR
          </div>
          <div className="flex flex-col text-left leading-tight hidden lg:flex">
            <span className="text-xs font-black text-slate-900 dark:text-white">
              Carlos Rivero V.
            </span>
            <span className="text-[10px] font-bold text-slate-400 mt-0.5">
              Gerente General
            </span>
          </div>
          <ChevronDown size={14} className="text-slate-400 shrink-0" />
        </div>
      </div>
    </header>
  );
}
