import React, { useState, useEffect, useCallback } from 'react';
import ModernSidebar from './components/ModernSidebar';
import ModernHeader from './components/ModernHeader';
import ModernDashboard from './components/ModernDashboard';
import InventoryTable from './components/InventoryTable';
import MovementsTable from './components/MovementsTable';
import ContainersSection from './components/ContainersSection';
import GoogleSheetsImporterModal from './components/GoogleSheetsImporterModal';
import NewMovementModal from './components/NewMovementModal';
import NewProductModal from './components/NewProductModal';
import EditProductModal from './components/EditProductModal';
import CashClosingModal from './components/CashClosingModal';
import NewContainerModal from './components/NewContainerModal';
import WeeklyDispatchesTable from './components/WeeklyDispatchesTable';
import SalesNotesTab from './components/SalesNotesTab';
import NewSalesNoteModal from './components/NewSalesNoteModal';
import PrintSalesNoteModal from './components/PrintSalesNoteModal';
import CustomersModal from './components/CustomersModal';
import AddPaymentModal from './components/AddPaymentModal';
import BatchLotImportModal from './components/BatchLotImportModal';
import ContainerPrelistaModal from './components/ContainerPrelistaModal';
import UsersModal from './components/UsersModal';
import SuperLogin from './components/SuperLogin';
import MobileBottomNav from './components/MobileBottomNav';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  Ship, 
  Calendar, 
  CalendarDays,
  FileText,
  Sparkles,
  RefreshCw,
  Database,
  CheckCircle2
} from 'lucide-react';
import { getPermissions, canAccessTab } from './config/permissions';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('siscontrol_theme_v2') || 'light';
  });
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'inventory', 'movements', 'containers'
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'month', 'quarter', 'year'

  // Sync theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Data states
  const [stats, setStats] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [containers, setContainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryInitialFilter, setInventoryInitialFilter] = useState('all');

  // Modals state
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementModalType, setMovementModalType] = useState('SALIDA');
  const [movementModalProduct, setMovementModalProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCashClosingOpen, setIsCashClosingOpen] = useState(false);
  const [isContainerModalOpen, setIsContainerModalOpen] = useState(false);
  const [isBatchLotModalOpen, setIsBatchLotModalOpen] = useState(false);
  const [isPrelistModalOpen, setIsPrelistModalOpen] = useState(false);
  const [selectedContainerForPrelist, setSelectedContainerForPrelist] = useState(null);

  // Sales Notes states
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [newNoteInitialType, setNewNoteInitialType] = useState('VENTA'); // 'VENTA' | 'REPOSICION_TIENDA'
  const [isPrintNoteModalOpen, setIsPrintNoteModalOpen] = useState(false);
  const [printNoteData, setPrintNoteData] = useState(null);
  const [isCustomersModalOpen, setIsCustomersModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [addPaymentNoteData, setAddPaymentNoteData] = useState(null);
  const [editNoteData, setEditNoteData] = useState(null);
  const [notesRefreshTrigger, setNotesRefreshTrigger] = useState(0);

  // Authentication & Session State (requires signed JWT token)
  const [authSession, setAuthSession] = useState(() => {
    try {
      const saved = localStorage.getItem('siscontrol_auth_session');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return parsed && parsed.token && parsed.user ? parsed : null;
    } catch (e) {
      return null;
    }
  });

  // User & Roles states (Initialized from authenticated session)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedAuth = localStorage.getItem('siscontrol_auth_session');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed && parsed.token && parsed.user) return parsed.user;
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

  // Success toast
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleLoginSuccess = (user, token) => {
    const session = { user, token, loginAt: new Date().toISOString() };
    // Persist token BEFORE updating state so immediate API requests attach Authorization header
    localStorage.setItem('siscontrol_auth_session', JSON.stringify(session));
    localStorage.setItem('siscontrol_active_user', JSON.stringify(user));
    setAuthSession(session);
    setCurrentUser(user);
    
    // Auto-redirigir a la pestaña por defecto del rol
    const perms = getPermissions(user.role);
    setActiveTab(perms.defaultTab);

    showToast(`¡Sesión iniciada! Bienvenido, ${user.name}`);
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('siscontrol_auth_session');
    localStorage.removeItem('siscontrol_active_user');
    setAuthSession(null);
    setCurrentUser(null);
  }, []);

  // Listen for global 401 session expiration events from authFetch
  useEffect(() => {
    const onExpired = () => {
      handleLogout();
    };
    window.addEventListener('siscontrol:session-expired', onExpired);
    return () => window.removeEventListener('siscontrol:session-expired', onExpired);
  }, [handleLogout]);

  // Cierre automático por Horario Laboral (07:00 AM a 07:00 PM / 19:00) para colaboradores (excepto SUPER_ADMIN)
  useEffect(() => {
    if (!authSession || !currentUser || currentUser.role === 'SUPER_ADMIN') return;

    const checkSchedule = async () => {
      try {
        const res = await fetch('/api/system/work-schedule').then(r => r.json());
        if (res.success && res.data && res.data.enabled && !res.data.isWithinHours) {
          alert(`🔒 Horario Laboral Finalizado (${res.data.scheduleLabel} hrs).\nEl sistema se cerrará automáticamente por seguridad.`);
          handleLogout();
        }
      } catch {
        // Fallback por reloj local si no hay red
        const h = new Date().getHours();
        if (h < 7 || h >= 19) {
          alert('🔒 Horario Laboral Finalizado (07:00 AM - 07:00 PM).\nEl sistema se cerrará automáticamente por seguridad.');
          handleLogout();
        }
      }
    };

    checkSchedule();
    const timer = setInterval(checkSchedule, 30000);
    return () => clearInterval(timer);
  }, [authSession, currentUser, handleLogout]);

  // Verify token against backend and sync authoritative user role on load
  useEffect(() => {
    if (!authSession?.token) return;
    let cancelled = false;
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(res => {
        if (cancelled) return;
        if (res.success && res.data) {
          setCurrentUser(res.data);
          const updatedSession = { ...authSession, user: res.data };
          localStorage.setItem('siscontrol_auth_session', JSON.stringify(updatedSession));
          localStorage.setItem('siscontrol_active_user', JSON.stringify(res.data));
        }
      })
      .catch(() => {
        // Network error — keep current local state until server responds
      });
    return () => { cancelled = true; };
  }, [authSession?.token]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('siscontrol_theme_v2', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Fetch all data (only when authenticated with a valid JWT token)
  const fetchData = useCallback(async () => {
    if (!authSession?.token) return;
    setIsLoading(true);
    try {
      const [statsRes, chartsRes, prodsRes, movsRes, contsRes] = await Promise.all([
        fetch(`/api/dashboard/stats?timeRange=${timeRange}`).then(r => r.json()),
        fetch('/api/dashboard/charts').then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
        fetch('/api/movements?limit=150').then(r => r.json()),
        fetch('/api/containers').then(r => r.json())
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (chartsRes.success) setChartsData(chartsRes.data);
      if (prodsRes.success) setProducts(prodsRes.data);
      if (movsRes.success) setMovements(movsRes.data);
      if (contsRes.success) setContainers(contsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, authSession?.token]);

  useEffect(() => {
    if (authSession?.token) {
      fetchData();
    }
  }, [fetchData, authSession?.token]);

  // Open movement modal — ENTRADA opens the Excel batch modal; SALIDA opens the single manual modal
  const handleOpenNewMovement = (type = 'SALIDA', product = null) => {
    if (type === 'ENTRADA' && !product) {
      // Open batch lot import modal for container/lot entries (no specific product)
      setIsBatchLotModalOpen(true);
    } else {
      setMovementModalType(type);
      setMovementModalProduct(product);
      setIsMovementModalOpen(true);
    }
  };

  // Filter alerts click handler from KPI card
  const handleFilterAlerts = (filterType) => {
    setInventoryInitialFilter(filterType);
    if (canAccessTab(currentUser?.role, 'inventory')) {
      setActiveTab('inventory');
    }
  };

  // Delete container handler
  const handleDeleteContainer = async (id) => {
    if (!confirm('¿Seguro de eliminar este embarque/camión y su prelista asociada?')) return;
    try {
      const res = await fetch(`/api/containers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
        showToast('Embarque eliminado correctamente');
      }
    } catch (err) {
      console.error('Error deleting container:', err);
    }
  };

  // If not authenticated, display Super Login
  if (!authSession) {
    return <SuperLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // setActiveTab seguro: solo cambia si el rol tiene permiso
  const safeSetActiveTab = (tab) => {
    if (canAccessTab(currentUser?.role, tab)) {
      setActiveTab(tab);
    }
  };

  return (
    <div className="h-screen w-full bg-[#F8F8FA] dark:bg-[#121212] flex flex-row text-[#0D0D0D] dark:text-slate-100 transition-colors duration-200 antialiased overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 font-bold text-sm animate-fade-in">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. FIXED LEFT SIDEBAR (No se mueve con el scroll - Estilo Drive) */}
      <div className="hidden sm:flex flex-col shrink-0 justify-start select-none z-30 h-full">
        <ModernSidebar
          activeTab={activeTab}
          setActiveTab={safeSetActiveTab}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenCustomers={() => setIsCustomersModalOpen(true)}
          onOpenImporter={() => setIsImporterOpen(true)}
          onOpenUsersModal={() => setIsUsersModalOpen(true)}
          onLogout={handleLogout}
          currentUser={currentUser}
        />
      </div>

      {/* 2. RIGHT COLUMN: Fixed Top Header + Scrollable Middle Content */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden px-2 sm:pr-8 sm:pl-6">
        {/* FIXED HEADER (Permanece fijo en la parte superior) */}
        <div className="shrink-0 pt-2 sm:pt-4 pb-2 sm:pb-3 z-20 w-full">
          <ModernHeader
            activeTab={activeTab}
            setActiveTab={safeSetActiveTab}
            theme={theme}
            toggleTheme={toggleTheme}
            currentUser={currentUser}
            products={products}
            onUpdateCurrentUser={(updatedUser) => {
              setCurrentUser(updatedUser);
              localStorage.setItem('siscontrol_active_user', JSON.stringify(updatedUser));
              try {
                const savedAuth = localStorage.getItem('siscontrol_auth_session');
                if (savedAuth) {
                  const parsed = JSON.parse(savedAuth);
                  parsed.user = updatedUser;
                  localStorage.setItem('siscontrol_auth_session', JSON.stringify(parsed));
                }
              } catch (e) {}
              showToast('¡Perfil y credenciales actualizados!');
            }}
            onOpenUsersModal={() => {
              if (currentUser?.role === 'SUPER_ADMIN') {
                setIsUsersModalOpen(true);
              }
            }}
            onLogout={handleLogout}
            onOpenNewNote={() => {
              setEditNoteData(null);
              setIsNewNoteModalOpen(true);
            }}
            onOpenCustomers={() => setIsCustomersModalOpen(true)}
            onOpenCashClosing={() => setIsCashClosingOpen(true)}
          />
        </div>

        {/* 3. SCROLLABLE MIDDLE CONTENT (SOLO ESTO SE MUEVE CON EL SCROLL - ESTILO DRIVE) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-1 pb-24 sm:pb-8 scroll-smooth">
          <main className="bg-white dark:bg-[#1E1E1E] rounded-2xl sm:rounded-3xl p-3 sm:p-7 lg:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.45)] border border-slate-200/80 dark:border-[#2E2E2E] transition-all mb-4">
            {activeTab === 'dashboard' && (
              <ModernDashboard
                stats={stats}
                chartsData={chartsData}
                products={products}
                movements={movements}
                containers={containers}
                onOpenNewMovement={handleOpenNewMovement}
                onOpenNewNote={() => {
                  setEditNoteData(null);
                  setNewNoteInitialType('VENTA');
                  setIsNewNoteModalOpen(true);
                }}
                onOpenNewRestock={() => {
                  setEditNoteData(null);
                  setNewNoteInitialType('REPOSICION_TIENDA');
                  setIsNewNoteModalOpen(true);
                }}
                onOpenEditNote={(note) => {
                  setEditNoteData(note);
                  setIsNewNoteModalOpen(true);
                }}
                onOpenPrintNote={(note) => {
                  setPrintNoteData(note);
                  setIsPrintNoteModalOpen(true);
                }}
                onOpenAddPayment={(note) => {
                  setAddPaymentNoteData(note);
                  setIsAddPaymentModalOpen(true);
                }}
                onOpenNewProduct={() => setIsProductModalOpen(true)}
                onOpenNewContainer={() => setIsContainerModalOpen(true)}
                onOpenCustomers={() => setIsCustomersModalOpen(true)}
                onSelectTab={safeSetActiveTab}
                refreshTrigger={notesRefreshTrigger}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'notes' && (
              <SalesNotesTab 
                onOpenNewNote={() => {
                  setEditNoteData(null);
                  setNewNoteInitialType('VENTA');
                  setIsNewNoteModalOpen(true);
                }}
                onOpenNewRestock={() => {
                  setEditNoteData(null);
                  setNewNoteInitialType('REPOSICION_TIENDA');
                  setIsNewNoteModalOpen(true);
                }}
                onOpenEditNote={(note) => {
                  setEditNoteData(note);
                  setIsNewNoteModalOpen(true);
                }}
                onOpenPrintNote={(note) => {
                  setPrintNoteData(note);
                  setIsPrintNoteModalOpen(true);
                }}
                onOpenCustomers={() => setIsCustomersModalOpen(true)}
                onOpenAddPayment={(note) => {
                  setAddPaymentNoteData(note);
                  setIsAddPaymentModalOpen(true);
                }}
                onNavigateToContainers={() => safeSetActiveTab('containers')}
                onNavigateToWeekly={() => safeSetActiveTab('weekly')}
                refreshTrigger={notesRefreshTrigger}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryTable 
                products={products}
                initialFilter={inventoryInitialFilter}
                onOpenNewMovement={handleOpenNewMovement}
                onEditProduct={(product) => setEditingProduct(product)}
                userRole={currentUser?.role || 'VENTAS'}
              />
            )}

            {activeTab === 'weekly' && (
              <WeeklyDispatchesTable 
                onStockUpdated={fetchData} 
                userRole={currentUser?.role}
              />
            )}

            {activeTab === 'movements' && (
              <MovementsTable movements={movements} />
            )}

            {activeTab === 'containers' && (
              <ContainersSection 
                containers={containers} 
                onNewContainer={() => setIsContainerModalOpen(true)}
                onOpenPrelista={(c) => {
                  setSelectedContainerForPrelist(c);
                  setIsPrelistModalOpen(true);
                }}
                onDeleteContainer={handleDeleteContainer}
                currentUser={currentUser}
                userRole={currentUser?.role}
              />
            )}
          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (Solo en celular sm:hidden) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={safeSetActiveTab}
        currentUser={currentUser}
        onOpenNewNote={() => {
          setEditNoteData(null);
          setIsNewNoteModalOpen(true);
        }}
        onOpenCustomers={() => setIsCustomersModalOpen(true)}
      />

      {/* MODALS */}
      {/* 1. Google Sheets / Excel Importer */}
      <GoogleSheetsImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportSuccess={() => {
          fetchData();
          showToast('¡Hojas importadas exitosamente a la base de datos!');
        }}
      />

      {/* 2. New Movement (Entrada o Salida) */}
      <NewMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        initialType={movementModalType}
        initialProduct={movementModalProduct}
        products={products}
        containers={containers}
        onMovementSuccess={() => {
          fetchData();
          showToast('Movimiento registrado en la base de datos');
        }}
      />

      {/* 3. New Product */}
      <NewProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onProductCreated={() => {
          fetchData();
          showToast('Nuevo producto registrado en el catálogo');
        }}
      />

      {/* 4. New Container */}
      <NewContainerModal
        isOpen={isContainerModalOpen}
        onClose={() => setIsContainerModalOpen(false)}
        onContainerCreated={(newContainerId) => {
          fetchData();
          showToast('Embarque registrado con su prelista correctamente');
          if (newContainerId) {
            fetch('/api/containers')
              .then(r => r.json())
              .then(d => {
                if (d.success && d.data) {
                  const created = d.data.find(x => x.id === newContainerId) || d.data[0];
                  if (created) {
                    setSelectedContainerForPrelist(created);
                    setIsPrelistModalOpen(true);
                  }
                }
              })
              .catch(err => console.error(err));
          }
        }}
      />

      {/* 4b. Batch Lot Import from Excel */}
      <BatchLotImportModal
        isOpen={isBatchLotModalOpen}
        onClose={() => setIsBatchLotModalOpen(false)}
        containers={containers}
        onBatchSuccess={() => {
          fetchData();
          showToast('¡Lote ingresado al inventario exitosamente!');
        }}
      />

      {/* 4c. Container Prelista & Reservations Modal */}
      <ContainerPrelistaModal
        isOpen={isPrelistModalOpen}
        onClose={() => {
          setIsPrelistModalOpen(false);
          setSelectedContainerForPrelist(null);
        }}
        container={selectedContainerForPrelist}
        onUpdateContainer={() => {
          fetchData();
        }}
        userRole={currentUser?.role}
        currentUser={currentUser}
      />

      {/* 5. New / Edit Sales Note Modal */}
      <NewSalesNoteModal
        isOpen={isNewNoteModalOpen}
        onClose={() => {
          setIsNewNoteModalOpen(false);
          setEditNoteData(null);
          setNewNoteInitialType('VENTA');
        }}
        noteToEdit={editNoteData}
        initialNoteType={newNoteInitialType}
        products={products}
        onStockQuickAdded={() => {
          fetchData();
          showToast('Ingreso rápido de stock cargado al inventario');
        }}
        onNoteCreated={(newNote) => {
          fetchData();
          setNotesRefreshTrigger(prev => prev + 1);
          const isRestockCreated = newNote?.note_type === 'REPOSICION_TIENDA' || newNote?.noteType === 'REPOSICION_TIENDA';
          showToast(
            isRestockCreated
              ? `Pedido de reposición ${newNote.note_code || ''} enviado a Almacén (En Curso y editable).`
              : `¡Nota de venta ${newNote.note_code || ''} emitida con éxito!`
          );
        }}
        onNoteUpdated={(updatedNote) => {
          fetchData();
          setNotesRefreshTrigger(prev => prev + 1);
          showToast(`¡Nota de venta ${updatedNote.note_code || ''} actualizada y stock sincronizado!`);
        }}
        onOpenPrintNote={(note) => {
          setPrintNoteData(note);
          setIsPrintNoteModalOpen(true);
        }}
      />

      {/* 6. Print / WhatsApp Sales Note Modal */}
      <PrintSalesNoteModal
        isOpen={isPrintNoteModalOpen}
        onClose={() => setIsPrintNoteModalOpen(false)}
        note={printNoteData}
      />

      {/* 7. Customers / Cartera (Resumen 2026) Modal */}
      <CustomersModal
        isOpen={isCustomersModalOpen}
        onClose={() => setIsCustomersModalOpen(false)}
        onSelectCustomerForNewNote={(customer) => {
          setEditNoteData(null);
          setIsNewNoteModalOpen(true);
        }}
        onOpenEditNote={(note) => {
          setEditNoteData(note);
          setIsNewNoteModalOpen(true);
        }}
        onOpenPrintNote={(note) => {
          setPrintNoteData(note);
          setIsPrintNoteModalOpen(true);
        }}
        onOpenAddPayment={(note) => {
          setAddPaymentNoteData(note);
          setIsAddPaymentModalOpen(true);
        }}
        refreshTrigger={notesRefreshTrigger}
      />

      {/* 8. Add Payment / Abono Modal */}
      <AddPaymentModal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        note={addPaymentNoteData}
        onPaymentSuccess={() => {
          fetchData();
          setNotesRefreshTrigger(prev => prev + 1);
          showToast('Abono registrado con éxito');
        }}
      />

      {/* 9. Workers & Roles Management Modal */}
      <UsersModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        currentUser={currentUser}
        onSwitchUser={async (user) => {
          try {
            const res = await fetch('/api/users/impersonate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id })
            }).then(r => r.json());

            if (!res.success || !res.token || !res.data) {
              showToast(res.error || 'No se pudo cambiar de perfil');
              return;
            }

            const session = { user: res.data, token: res.token, loginAt: new Date().toISOString() };
            localStorage.setItem('siscontrol_auth_session', JSON.stringify(session));
            localStorage.setItem('siscontrol_active_user', JSON.stringify(res.data));
            setAuthSession(session);
            setCurrentUser(res.data);
            const perms = getPermissions(res.data.role);
            setActiveTab(perms.defaultTab);
            setIsUsersModalOpen(false);
            showToast(`Sesión segura cambiada a: ${res.data.name} (${res.data.role})`);
          } catch (err) {
            showToast('Error cambiando de perfil: ' + err.message);
          }
        }}
      />

      {/* 10. Quick Product & Wholesale Pricing Editor (Admin / Super Admin) */}
      <EditProductModal
        isOpen={Boolean(editingProduct)}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onProductUpdated={() => {
          fetchData();
          showToast('Producto y precios actualizados correctamente');
        }}
      />

      {/* 11. Daily Cash Closing & Expenses (Cierre de Caja Diario + Caja Chica) */}
      <CashClosingModal
        isOpen={isCashClosingOpen}
        onClose={() => setIsCashClosingOpen(false)}
        currentUser={currentUser}
        onDataChanged={() => {
          fetchData();
          setNotesRefreshTrigger(prev => prev + 1);
        }}
      />
    </div>
  );
}
