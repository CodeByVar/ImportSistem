import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  CalendarDays, 
  History, 
  Ship, 
  Users, 
  Sliders, 
  LogOut 
} from 'lucide-react';

export default function ModernSidebar({ 
  activeTab, 
  setActiveTab, 
  theme, 
  toggleTheme, 
  onOpenCustomers,
  onOpenImporter
}) {
  const navItems = [
    { key: 'dashboard', label: 'General', icon: LayoutDashboard },
    { key: 'notes', label: 'Notas de Despacho & Venta', icon: FileText },
    { key: 'inventory', label: 'Catálogo & Stock', icon: Package },
    { key: 'weekly', label: 'Planilla Despacho Diario', icon: CalendarDays },
    { key: 'movements', label: 'Kardex / Movimientos', icon: History },
    { key: 'containers', label: 'Embarques & Contenedores', icon: Ship },
  ];

  return (
    <aside 
      style={{ marginTop: '6.5rem' }}
      className="hidden sm:flex shrink-0 pl-4 sm:pl-6 pr-3 select-none self-start"
    >
      <div className="w-14 sm:w-15 bg-white dark:bg-slate-900 rounded-3xl sm:rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)] border-2 border-slate-200/90 dark:border-slate-800 flex flex-col items-center py-5 px-1.5 gap-2 transition-all">
        
        {/* Navigation Icons (Compact & Centered) */}
        <nav className="flex flex-col gap-4 items-center w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                title={item.label}
                className={`w-10 h-10 rounded-xl sm:rounded-full flex items-center justify-center transition-all duration-200 relative group cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/25 dark:bg-[#EA580C] dark:shadow-orange-600/30'
                    : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />

                {/* Floating tooltip */}
                <span className="pointer-events-none absolute left-14 scale-0 group-hover:scale-100 transition-all origin-left bg-slate-900 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Clientes button */}
          <button
            type="button"
            onClick={onOpenCustomers}
            title="Cartera de Clientes"
            className="w-10 h-10 rounded-xl sm:rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200 relative group cursor-pointer"
          >
            <Users size={19} strokeWidth={1.8} />
            <span className="pointer-events-none absolute left-14 scale-0 group-hover:scale-100 transition-all origin-left bg-slate-900 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50">
              Cartera de Clientes
            </span>
          </button>
        </nav>

        {/* Subtle Divider */}
        <div className="w-7 h-px bg-slate-200 dark:bg-slate-800 my-1" />

        {/* Bottom Actions: Importer & Reload */}
        <div className="flex flex-col gap-1.5 items-center w-full">
          <button 
            type="button"
            onClick={onOpenImporter}
            title="Importador Google Sheets & Excel"
            className="w-10 h-10 rounded-xl sm:rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group relative cursor-pointer"
          >
            <Sliders size={18} strokeWidth={1.8} />
            <span className="pointer-events-none absolute left-14 scale-0 group-hover:scale-100 transition-all origin-left bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50">
              Importador Excel / Sheets
            </span>
          </button>
          
          <button 
            type="button"
            onClick={() => {
              if (window.confirm('¿Deseas recargar la aplicación para sincronizar los datos?')) {
                window.location.reload();
              }
            }}
            title="Recargar Sistema"
            className="w-10 h-10 rounded-xl sm:rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all group relative cursor-pointer"
          >
            <LogOut size={18} strokeWidth={1.8} />
            <span className="pointer-events-none absolute left-14 scale-0 group-hover:scale-100 transition-all origin-left bg-rose-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50">
              Recargar
            </span>
          </button>
        </div>

      </div>
    </aside>
  );
}
