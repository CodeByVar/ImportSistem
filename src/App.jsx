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

  // Success toast
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
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
    setActiveTab('inventory');
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
          setActiveTab={setActiveTab}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenCustomers={() => setIsCustomersModalOpen(true)}
          onOpenImporter={() => setIsImporterOpen(true)}
        />
      </div>

      {/* 2. RIGHT COLUMN: Fixed Top Header + Scrollable Middle Content */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden pr-4 sm:pr-8 pl-4 sm:pl-6">
        {/* FIXED HEADER (Permanece fijo en la parte superior) */}
        <div className="shrink-0 pt-4 pb-3 z-20 w-full">
          <ModernHeader
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            theme={theme}
            toggleTheme={toggleTheme}
            onOpenNewNote={() => {
              setEditNoteData(null);
              setIsNewNoteModalOpen(true);
            }}
            onOpenCustomers={() => setIsCustomersModalOpen(true)}
          />
        </div>

        {/* 3. SCROLLABLE MIDDLE CONTENT (SOLO ESTO SE MUEVE CON EL SCROLL - ESTILO DRIVE) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-1 pb-10 scroll-smooth">
          <main className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[36px] p-7 sm:p-10 lg:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.07)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] border-2 border-slate-200/90 dark:border-slate-800 transition-all mb-4">
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
                onSelectTab={setActiveTab}
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
                onNavigateToContainers={() => setActiveTab('containers')}
                refreshTrigger={notesRefreshTrigger}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryTable 
                products={products}
                initialFilter={inventoryInitialFilter}
                onOpenNewMovement={handleOpenNewMovement}
                onEditProduct={() => {}}
              />
            )}

            {activeTab === 'weekly' && (
              <WeeklyDispatchesTable 
                onStockUpdated={fetchData} 
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
              />
            )}
          </main>
        </div>
      </div>

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
    </div>
  );
}
