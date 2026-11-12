import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  ChevronDown,
  Sun,
  Moon,
  Lock,
  X,
  Truck,
  AlertCircle,
  FileText,
  Package,
  Calendar,
  Ship,
  Users,
  LayoutDashboard,
  Plus,
  Camera,
  User,
  KeyRound,
  Phone,
  Check,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  Clock
} from 'lucide-react';

const AVATAR_COLORS = [
  '#EA580C', // Orange
  '#0284c7', // Cyan/Blue
  '#059669', // Emerald
  '#7c3aed', // Purple
  '#e11d48', // Rose
  '#d97706', // Amber
  '#0f172a'  // Slate
];

export default function ModernHeader({ 
  activeTab, 
  setActiveTab, 
  theme,
  toggleTheme,
  onOpenNewNote,
  onOpenCustomers,
  currentUser,
  products = [],
  onUpdateCurrentUser,
  onOpenUsersModal,
  onLogout
}) {
  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [recentNotes, setRecentNotes] = useState([]);

  // Notifications state
  const [notifFilter, setNotifFilter] = useState('ALL'); // 'ALL', 'ORDERS', 'DEBTS'
  const [dailyOrdersList, setDailyOrdersList] = useState([]);
  const [debtNotesList, setDebtNotesList] = useState([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  // Profile form state
  const [profName, setProfName] = useState('');
  const [profUsername, setProfUsername] = useState('');
  const [profPin, setProfPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [profPhone, setProfPhone] = useState('');
  const [profColor, setProfColor] = useState('#EA580C');
  const [profAvatarUrl, setProfAvatarUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profError, setProfError] = useState('');
  const fileInputRef = useRef(null);

  // Helper for initials
  const getInitials = (name) => {
    if (!name) return 'CR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // Helper for role label
  const getRoleLabel = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Administrador';
      case 'ADMIN': return 'Administrador';
      case 'VENTAS': return 'Ventas & Despachos';
      case 'ALMACEN': return 'Almacén & Logística';
      case 'CAJA': return 'Caja & Cobranzas';
      default: return 'Gerente General';
    }
  };

  const activeUser = currentUser || {
    id: 1,
    name: 'Carlos Rivero V.',
    username: 'carlos',
    role: 'SUPER_ADMIN',
    avatar_color: '#EA580C'
  };

  const localToday = useMemo(() => {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  }, []);

  // Load notifications (daily orders + pending debt notes)
  const fetchNotificationsData = async () => {
    setIsLoadingNotifs(true);
    try {
      const [ordersRes, notesRes] = await Promise.all([
        fetch(`/api/daily-orders?date=${localToday}`).then(r => r.json()),
        fetch('/api/sales-notes?status=PENDIENTE&limit=40').then(r => r.json())
      ]);
      if (ordersRes.success && ordersRes.data) {
        const orders = ordersRes.data.orders || [];
        setDailyOrdersList(orders.filter(o => o.status !== 'CANCELADO'));
      }
      if (notesRes.success && notesRes.data) {
        setDebtNotesList(notesRes.data.filter(n => Number(n.balance_amount) > 0 && n.status !== 'ANULADO'));
        setRecentNotes(notesRes.data);
      }
    } catch (e) {
      console.error('Error loading notifications:', e);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotificationsData();
  }, [activeTab]);

  // Open search modal
  const handleOpenSearch = () => {
    setSearchQuery('');
    setIsSearchOpen(true);
    fetch('/api/sales-notes?limit=30')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) setRecentNotes(res.data);
      })
      .catch(() => {});
  };

  // Open notifications modal
  const handleOpenNotifs = () => {
    fetchNotificationsData();
    setIsNotifOpen(true);
  };

  // Open profile modal and load user details from backend
  const handleOpenProfile = async () => {
    setProfError('');
    setProfName(activeUser.name || '');
    setProfUsername(activeUser.username || '');
    setProfPin('');
    setProfPhone(activeUser.phone || '');
    setProfColor(activeUser.avatar_color || '#EA580C');
    setProfAvatarUrl(activeUser.avatar_url || '');
    setIsProfileOpen(true);

    if (activeUser.id) {
      try {
        const res = await fetch(`/api/users/${activeUser.id}`).then(r => r.json());
        if (res.success && res.data) {
          setProfName(res.data.name || '');
          setProfUsername(res.data.username || '');
          setProfPin(res.data.pin_code || '');
          setProfPhone(res.data.phone || '');
          setProfColor(res.data.avatar_color || '#EA580C');
          setProfAvatarUrl(res.data.avatar_url || '');
        }
      } catch (e) {
        // ignore
      }
    }
  };

  // Handle photo upload & resize to compact base64
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 200;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > MAX_SIZE) { h = Math.round((h * MAX_SIZE) / w); w = MAX_SIZE; }
        } else {
          if (h > MAX_SIZE) { w = Math.round((w * MAX_SIZE) / h); h = MAX_SIZE; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setProfAvatarUrl(dataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profName.trim()) {
      setProfError('El nombre no puede estar vacío.');
      return;
    }
    if (!profUsername.trim()) {
      setProfError('El usuario de acceso no puede estar vacío.');
      return;
    }
    setIsSavingProfile(true);
    setProfError('');
    try {
      const payload = {
        name: profName.trim(),
        username: profUsername.trim().toLowerCase(),
        phone: profPhone.trim(),
        avatar_color: profColor,
        avatar_url: profAvatarUrl || null
      };
      if (profPin && String(profPin).trim()) {
        payload.pin_code = String(profPin).trim();
      }

      if (activeUser.id) {
        const res = await fetch(`/api/users/${activeUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(r => r.json());

        if (!res.success) {
          throw new Error(res.error || 'No se pudo actualizar el perfil');
        }

        const updatedUser = {
          ...activeUser,
          ...res.data,
          avatar_url: profAvatarUrl || null
        };
        onUpdateCurrentUser && onUpdateCurrentUser(updatedUser);
      } else {
        const updatedUser = {
          ...activeUser,
          ...payload
        };
        onUpdateCurrentUser && onUpdateCurrentUser(updatedUser);
      }
      setIsProfileOpen(false);
    } catch (err) {
      setProfError(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // System sections for quick search
  const systemModules = useMemo(() => [
    {
      id: 'notes',
      title: 'Orden de Entregas Diario & Notas',
      subtitle: 'Control L-S de despachos, turnos mañana/tarde y cobros',
      icon: Truck,
      color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/15',
      action: () => { setActiveTab && setActiveTab('notes'); setIsSearchOpen(false); }
    },
    {
      id: 'new-note',
      title: 'Crear Nueva Nota de Venta',
      subtitle: 'Emitir nuevo pedido con precios por caja o unidad',
      icon: Plus,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15',
      action: () => { setIsSearchOpen(false); onOpenNewNote && onOpenNewNote(); }
    },
    {
      id: 'inventory',
      title: 'Catálogo de Stock e Inventario',
      subtitle: 'Consultar stock en Almacén, Tienda, Casa Cubano y precios',
      icon: Package,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15',
      action: () => { setActiveTab && setActiveTab('inventory'); setIsSearchOpen(false); }
    },
    {
      id: 'weekly',
      title: 'Planilla de Despachos Semanal',
      subtitle: 'Resumen consolidado de entregas de toda la semana',
      icon: Calendar,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/15',
      action: () => { setActiveTab && setActiveTab('weekly'); setIsSearchOpen(false); }
    },
    {
      id: 'containers',
      title: 'Contenedores & Camiones en Tránsito',
      subtitle: 'Prelistas de llegada, reservas de clientes y embarques',
      icon: Ship,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/15',
      action: () => { setActiveTab && setActiveTab('containers'); setIsSearchOpen(false); }
    },
    {
      id: 'customers',
      title: 'Cartera de Clientes & Deudas',
      subtitle: 'Directorio de clientes, ubicaciones GPS y saldos pendientes',
      icon: Users,
      color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/15',
      action: () => { setIsSearchOpen(false); onOpenCustomers && onOpenCustomers(); }
    },
    {
      id: 'dashboard',
      title: 'Dashboard & Indicadores',
      subtitle: 'Vista general operativa y financiera',
      icon: LayoutDashboard,
      color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/15',
      action: () => { setActiveTab && setActiveTab('dashboard'); setIsSearchOpen(false); }
    }
  ], [setActiveTab, onOpenNewNote, onOpenCustomers]);

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return systemModules;
    return systemModules.filter(m =>
      m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q)
    );
  }, [searchQuery, systemModules]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 5);
    return products.filter(p =>
      (p.sku || '').toLowerCase().includes(q) ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery, products]);

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recentNotes.slice(0, 4);
    return recentNotes.filter(n =>
      (n.note_code || '').toLowerCase().includes(q) ||
      (n.customer_name || '').toLowerCase().includes(q) ||
      (n.delivery_destination || '').toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery, recentNotes]);

  // Notifications count
  const pendingDailyOrders = useMemo(() => {
    return dailyOrdersList.filter(o => o.status !== 'ENTREGADO' && o.status !== 'CANCELADO');
  }, [dailyOrdersList]);

  const totalNotifCount = pendingDailyOrders.length + debtNotesList.length;

  const formatBs = (v) => Number(v || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      <header 
        className="w-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)] border-2 border-slate-200/90 dark:border-slate-800 px-3 sm:px-8 lg:px-12 py-2.5 sm:py-3.5 min-h-[60px] sm:min-h-[72px] flex items-center justify-between gap-2 sm:gap-6 transition-all"
      >
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-1 sm:ml-4">
          <div className="bg-slate-950 dark:bg-slate-800 text-white font-black px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center gap-2.5 sm:gap-4 shadow-md border-2 border-slate-800 dark:border-slate-700 select-none">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-[#EA580C] text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-sm shrink-0">
              R
            </div>
            <div className="flex flex-col leading-none hidden xs:flex sm:flex pr-1">
              <span className="text-[9px] sm:text-[10px] tracking-[0.22em] text-orange-400 font-extrabold uppercase">
                IMPORTADORA
              </span>
              <span className="text-xs sm:text-sm font-black tracking-wider text-white mt-0.5 sm:mt-1">
                RIVERO
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions & User Capsule */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 mr-1 sm:mr-4">
          {/* 1. Circular Search Button */}
          <button 
            type="button"
            title="Buscador rápido del sistema (Módulos, Notas, Productos)"
            onClick={handleOpenSearch}
            className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            <Search size={14} strokeWidth={2.2} />
          </button>

          {/* 2. Circular Notification Bell with Live Badge */}
          <button 
            type="button"
            title="Notificaciones de Orden del Día y Notas con Deuda"
            onClick={handleOpenNotifs}
            className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative cursor-pointer shadow-2xs"
          >
            <Bell size={14} strokeWidth={2.2} />
            {totalNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#EA580C] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {totalNotifCount > 99 ? '99+' : totalNotifCount}
              </span>
            )}
          </button>

          {/* Circular Help Button (hidden on mobile) */}
          <button 
            type="button"
            title="Buscador de Módulos y Ayuda"
            onClick={handleOpenSearch}
            className="hidden sm:flex w-9.5 h-9.5 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200/90 dark:border-slate-700 items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            <HelpCircle size={15} strokeWidth={2.2} />
          </button>

          {/* Circular Theme Toggle Button */}
          {toggleTheme && (
            <button 
              type="button"
              title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              onClick={toggleTheme}
              className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              {theme === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
            </button>
          )}

          {/* 3. User Profile Capsule (Opens Profile & Credentials Modal) */}
          <div 
            onClick={handleOpenProfile}
            title={`Mi Perfil: ${activeUser.name} (${getRoleLabel(activeUser.role)}) - Toca para editar foto, nombre o contraseña`}
            className="flex items-center gap-2 sm:gap-3 pl-1.5 sm:pl-2 pr-2.5 sm:pr-4.5 py-1 sm:py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200/90 dark:border-slate-700 hover:border-[#EA580C]/60 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all cursor-pointer select-none shadow-xs ml-0.5 sm:ml-1 group"
          >
            {activeUser.avatar_url ? (
              <img 
                src={activeUser.avatar_url} 
                alt={activeUser.name}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shadow-xs shrink-0 ring-2 ring-orange-500/30"
              />
            ) : (
              <div 
                style={{ backgroundColor: activeUser.avatar_color || '#EA580C' }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0 ring-2 ring-white/20"
              >
                {getInitials(activeUser.name)}
              </div>
            )}
            <div className="flex flex-col text-left leading-tight hidden lg:flex">
              <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                {activeUser.name}
              </span>
              <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 mt-0.5">
                {getRoleLabel(activeUser.role)}
              </span>
            </div>
            <ChevronDown size={13} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 shrink-0 transition-transform group-hover:translate-y-0.5 hidden sm:block" />
          </div>

          {/* Lock Terminal / Logout Button */}
          {onLogout && (
            <button 
              type="button"
              title="Bloquear terminal / Cerrar sesión"
              onClick={onLogout}
              className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-400/50 transition-colors cursor-pointer shadow-2xs"
            >
              <Lock size={14} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </header>

      {/* =====================================================================
          MODAL 1: BUSCADOR GLOBAL DEL SISTEMA (Módulos, Notas, Productos)
         ===================================================================== */}
      {isSearchOpen && createPortal(
        <div 
          onClick={() => setIsSearchOpen(false)}
          className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-xs flex items-start justify-center p-2.5 sm:p-6 overflow-y-auto"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden mt-4 sm:mt-12 flex flex-col max-h-[88vh]"
          >
            {/* Search Input Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/70 dark:bg-slate-800/50">
              <Search size={18} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar partes del sistema, nota (IR15AV), cliente o producto..."
                className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Body */}
            <div className="p-3.5 sm:p-4 overflow-y-auto space-y-4">
              {/* 1. Partes / Módulos del Sistema */}
              {filteredModules.length > 0 && (
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                    Partes y Módulos del Sistema
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredModules.map(mod => {
                      const Icon = mod.icon;
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={mod.action}
                          className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all text-left cursor-pointer group"
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${mod.color}`}>
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                              {mod.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {mod.subtitle}
                            </div>
                          </div>
                          <ArrowRight size={14} className="text-slate-300 group-hover:text-cyan-500 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Notas de Venta / Pedidos */}
              {filteredNotes.length > 0 && (
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                    Notas de Venta & Pedidos ({filteredNotes.length})
                  </div>
                  <div className="space-y-1.5">
                    {filteredNotes.map(n => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setActiveTab && setActiveTab('notes');
                          setIsSearchOpen(false);
                        }}
                        className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-cyan-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-black text-cyan-600 dark:text-cyan-400">
                              {n.note_code}
                            </span>
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                              {n.customer_name}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {n.delivery_destination || 'Sin destino'} • Encargado: {n.seller_name || 'General'}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-black text-slate-900 dark:text-white">
                            Bs {formatBs(n.total_amount)}
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            n.status === 'PAGADO'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                          }`}>
                            {n.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Productos en Stock */}
              {filteredProducts.length > 0 && (
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                    Productos en Stock ({filteredProducts.length})
                  </div>
                  <div className="space-y-1.5">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setActiveTab && setActiveTab('inventory');
                          setIsSearchOpen(false);
                        }}
                        className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-amber-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {p.sku}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {p.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Categoría: {p.category || 'General'} • {p.units_per_box || 1} u/caja
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`text-xs font-mono font-black ${
                            Number(p.current_stock) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                          }`}>
                            Stock: {p.current_stock} u.
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            Bs {formatBs(p.box_price || p.sale_price)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =====================================================================
          MODAL 2: CENTRO DE NOTIFICACIONES (Orden del Día & Notas con Deuda)
         ===================================================================== */}
      {isNotifOpen && createPortal(
        <div 
          onClick={() => setIsNotifOpen(false)}
          className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-xs flex items-start justify-center p-2.5 sm:p-6 overflow-y-auto"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden mt-4 sm:mt-12 flex flex-col max-h-[88vh]"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white m-0">
                    Centro de Notificaciones
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                    Pedidos en Orden del Día y Notas con Saldo Pendiente
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNotifOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setNotifFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all shrink-0 ${
                  notifFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                Todas ({totalNotifCount})
              </button>
              <button
                type="button"
                onClick={() => setNotifFilter('ORDERS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all shrink-0 flex items-center gap-1.5 ${
                  notifFilter === 'ORDERS'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300'
                }`}
              >
                <Truck size={13} />
                <span>Orden del Día ({pendingDailyOrders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setNotifFilter('DEBTS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all shrink-0 flex items-center gap-1.5 ${
                  notifFilter === 'DEBTS'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                }`}
              >
                <AlertCircle size={13} />
                <span>Notas con Deuda ({debtNotesList.length})</span>
              </button>
            </div>

            {/* Notifications List */}
            <div className="p-3.5 sm:p-4 overflow-y-auto space-y-2.5 flex-1">
              {isLoadingNotifs ? (
                <div className="py-10 text-center text-xs text-slate-400 font-bold">
                  Actualizando notificaciones en vivo...
                </div>
              ) : totalNotifCount === 0 ? (
                <div className="py-10 text-center">
                  <div className="text-sm font-black text-slate-700 dark:text-slate-200">
                    ¡Todo al día!
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    No hay entregas pendientes hoy ni notas con deuda activa.
                  </div>
                </div>
              ) : (
                <>
                  {/* Section A: Pedidos en Orden del Día (Especial Almacén) */}
                  {(notifFilter === 'ALL' || notifFilter === 'ORDERS') && pendingDailyOrders.map(order => (
                    <div
                      key={`ord-${order.id}`}
                      onClick={() => {
                        setActiveTab && setActiveTab('notes');
                        setIsNotifOpen(false);
                      }}
                      className="p-3 rounded-xl border border-cyan-200 dark:border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-500/10 hover:bg-cyan-100/60 dark:hover:bg-cyan-500/20 transition-all cursor-pointer flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Truck size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                            Pedido en Orden del Día • {order.morning_shift ? 'Turno Mañana' : 'Turno Tarde'}
                          </span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-cyan-200/70 dark:bg-cyan-500/30 text-cyan-900 dark:text-cyan-200">
                            {order.status || 'PENDIENTE'}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5 truncate">
                          {order.activity_or_customer}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-2 flex-wrap">
                          {order.sales_note_code && (
                            <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">
                              Nota: {order.sales_note_code}
                            </span>
                          )}
                          {order.note_seller_name && (
                            <span>• Encargado: <strong>{order.note_seller_name}</strong></span>
                          )}
                          {order.observations && (
                            <span>• Destino: {order.observations}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Section B: Notas con Deuda / Saldo por Cobrar */}
                  {(notifFilter === 'ALL' || notifFilter === 'DEBTS') && debtNotesList.map(note => (
                    <div
                      key={`debt-${note.id}`}
                      onClick={() => {
                        setActiveTab && setActiveTab('notes');
                        setIsNotifOpen(false);
                      }}
                      className="p-3 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/10 hover:bg-rose-100/60 dark:hover:bg-rose-500/20 transition-all cursor-pointer flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">
                            Nota con Saldo Pendiente ({note.note_code})
                          </span>
                          <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400">
                            Debe: Bs {formatBs(note.balance_amount)}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5 truncate">
                          {note.customer_name}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>Fecha: {note.date}</span>
                          {note.due_date && (
                            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 font-bold">
                              <Clock size={11} /> Vence: {note.due_date}
                            </span>
                          )}
                          <span>• Encargado: <strong>{note.seller_name || 'DANIEL'}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =====================================================================
          MODAL 3: AJUSTES DE PERFIL (Foto, Nombre, Teléfono y Credenciales)
         ===================================================================== */}
      {isProfileOpen && createPortal(
        <div 
          onClick={() => setIsProfileOpen(false)}
          className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white m-0">
                    Ajustes de Mi Perfil
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                    Foto de perfil, nombre y credenciales de acceso
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveProfile} className="p-4 overflow-y-auto space-y-4">
              {profError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{profError}</span>
                </div>
              )}

              {/* Avatar & Photo Upload */}
              <div className="flex flex-col items-center gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                <div className="relative">
                  {profAvatarUrl ? (
                    <img 
                      src={profAvatarUrl} 
                      alt={profName}
                      className="w-20 h-20 rounded-full object-cover shadow-md ring-4 ring-white dark:ring-slate-700"
                    />
                  ) : (
                    <div 
                      style={{ backgroundColor: profColor }}
                      className="w-20 h-20 rounded-full text-white font-black text-2xl flex items-center justify-center shadow-md ring-4 ring-white dark:ring-slate-700"
                    >
                      {getInitials(profName)}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center shadow-md cursor-pointer ring-2 ring-white dark:ring-slate-900"
                    title="Subir foto desde celular o PC"
                  >
                    <Camera size={14} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 border border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-extrabold cursor-pointer"
                  >
                    Cambiar Foto
                  </button>
                  {profAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setProfAvatarUrl('')}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 text-xs font-bold cursor-pointer"
                    >
                      Quitar Foto
                    </button>
                  )}
                </div>

                {/* Color Picker when no photo */}
                <div className="flex items-center gap-2 pt-1">
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setProfColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-5 h-5 rounded-full cursor-pointer transition-transform ${
                        profColor === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-900 dark:ring-white' : 'opacity-75 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Nombre Completo */}
              <div>
                <label className="form-label text-[11px] font-bold mb-1">
                  Nombre Completo (Aparece como Encargado / Cobrador) *
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={profName}
                    onChange={e => setProfName(e.target.value)}
                    className="form-input text-xs font-bold h-10 w-full"
                    style={{ paddingLeft: '34px' }}
                    placeholder="Ej. ERICK ZURITA"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="form-label text-[11px] font-bold mb-1">
                  Teléfono / Celular
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={profPhone}
                    onChange={e => setProfPhone(e.target.value)}
                    className="form-input text-xs font-bold h-10 w-full"
                    style={{ paddingLeft: '34px' }}
                    placeholder="Ej. 70000000"
                  />
                </div>
              </div>

              {/* Credenciales: Usuario y PIN / Contraseña */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
                  <KeyRound size={14} />
                  <span>Credenciales de Inicio de Sesión</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="form-label text-[10px] font-bold mb-1">
                      Usuario (Login) *
                    </label>
                    <input
                      type="text"
                      required
                      value={profUsername}
                      onChange={e => setProfUsername(e.target.value)}
                      className="form-input text-xs font-bold h-10 w-full"
                      placeholder="Ej. erick"
                    />
                  </div>

                  <div>
                    <label className="form-label text-[10px] font-bold mb-1">
                      PIN / Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        value={profPin}
                        onChange={e => setProfPin(e.target.value)}
                        className="form-input text-xs font-black font-mono h-10 w-full pr-9"
                        placeholder="••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(s => !s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      >
                        {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Si es Super Admin: Botón para abrir Gestión General de Trabajadores */}
              {activeUser.role === 'SUPER_ADMIN' && onOpenUsersModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenUsersModal();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-indigo-100 cursor-pointer transition-colors"
                >
                  <Shield size={15} />
                  <span>Administrar Todos los Trabajadores y Roles</span>
                </button>
              )}

              {/* Footer Actions */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-extrabold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex-[1.5] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Check size={16} />
                  <span>{isSavingProfile ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
