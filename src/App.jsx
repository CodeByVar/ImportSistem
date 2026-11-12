import React, { useState, useEffect, useCallback } from 'react';
import ModernSidebar from './components/ModernSidebar';
import ModernHeader from './components/ModernHeader';
import ModernDashboard from './components/ModernDashboard';
import KpiCards from './components/KpiCards';
import ChartsSection from './components/ChartsSection';
import TopProductsSection from './components/TopProductsSection';
import InventoryTable from './components/InventoryTable';
import MovementsTable from './components/MovementsTable';
import ContainersSection from './components/ContainersSection';
import GoogleSheetsImporterModal from './components/GoogleSheetsImporterModal';
import NewMovementModal from './components/NewMovementModal';
import NewProductModal from './components/NewProductModal';
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
  const [isContainerModalOpen, setIsContainerModalOpen] = useState(false);
  const [isBatchLotModalOpen, setIsBatchLotModalOpen] = useState(false);
  const [isPrelistModalOpen, setIsPrelistModalOpen] = useState(false);
  const [selectedContainerForPrelist, setSelectedContainerForPrelist] = useState(null);

  // Sales Notes states
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [isPrintNoteModalOpen, setIsPrintNoteModalOpen] = useState(false);
  const [printNoteData, setPrintNoteData] = useState(null);
  const [isCustomersModalOpen, setIsCustomersModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [addPaymentNoteData, setAddPaymentNoteData] = useState(null);
  const [editNoteData, setEditNoteData] = useState(null);
  const [notesRefreshTrigger, setNotesRefreshTrigger] = useState(0);

  // Authentication & Session State
  const [authSession, setAuthSession] = useState(() => {
    try {
      const saved = localStorage.getItem('siscontrol_auth_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // User & Roles states (Initialized from auth session or active user)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedAuth = localStorage.getItem('siscontrol_auth_session');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed && parsed.user) return parsed.user;
      }
      const saved = localStorage.getItem('siscontrol_active_user');
      return saved ? JSON.parse(saved) : null;
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

  const handleLoginSuccess = (user) => {
    const session = { user, loginAt: new Date().toISOString() };
    setAuthSession(session);
    setCurrentUser(user);
    localStorage.setItem('siscontrol_auth_session', JSON.stringify(session));
    localStorage.setItem('siscontrol_active_user', JSON.stringify(user));
    
    // Auto-redirigir a la pestaña por defecto del rol
    const perms = getPermissions(user.role);
    setActiveTab(perms.defaultTab);

    showToast(`¡Sesión iniciada! Bienvenido, ${user.name}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('siscontrol_auth_session');
    setAuthSession(null);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('siscontrol_theme_v2', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Fetch all data
  const fetchData = useCallback(async () => {
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
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    <div className="h-screen w-full bg-slate-100/70 dark:bg-slate-950 flex flex-row text-slate-900 dark:text-slate-100 transition-colors duration-200 antialiased overflow-hidden">
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
          />
        </div>

        {/* 3. SCROLLABLE MIDDLE CONTENT (SOLO ESTO SE MUEVE CON EL SCROLL - ESTILO DRIVE) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-1 pb-24 sm:pb-8 scroll-smooth">
          <main className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3 sm:p-7 lg:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-slate-800 transition-all mb-4">
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
                  setIsNewNoteModalOpen(true);
                }}
                onOpenNewProduct={() => setIsProductModalOpen(true)}
                onOpenNewContainer={() => setIsContainerModalOpen(true)}
                onOpenCustomers={() => setIsCustomersModalOpen(true)}
                onSelectTab={safeSetActiveTab}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'notes' && (
              <SalesNotesTab 
                onOpenNewNote={() => {
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
                onEditProduct={() => {}}
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
        }}
        noteToEdit={editNoteData}
        products={products}
        onNoteCreated={(newNote) => {
          fetchData();
          setNotesRefreshTrigger(prev => prev + 1);
          showToast(`¡Nota de venta ${newNote.note_code || ''} emitida con éxito!`);
          if (newNote && newNote.items) {
            setPrintNoteData(newNote);
            setIsPrintNoteModalOpen(true);
          }
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
          setIsNewNoteModalOpen(true);
        }}
        onOpenPrintNote={(note) => {
          setPrintNoteData(note);
          setIsPrintNoteModalOpen(true);
        }}
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
        onSwitchUser={(user) => {
          const session = { user, loginAt: new Date().toISOString() };
          setAuthSession(session);
          setCurrentUser(user);
          localStorage.setItem('siscontrol_auth_session', JSON.stringify(session));
          localStorage.setItem('siscontrol_active_user', JSON.stringify(user));
          // Redirigir a la pestaña por defecto del nuevo rol
          const perms = getPermissions(user.role);
          setActiveTab(perms.defaultTab);
          showToast(`Sesión cambiada a: ${user.name} (${user.role})`);
        }}
      />
    </div>
  );
}
