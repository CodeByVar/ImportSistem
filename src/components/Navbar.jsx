import { 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  PlusCircle, 
  FileSpreadsheet, 
  FileText,
  Database, 
  Sun, 
  Moon,
  Sparkles
} from 'lucide-react';

export default function Navbar({ 
  theme, 
  toggleTheme, 
  onOpenNewMovement, 
  onOpenNewProduct, 
  onOpenImporter,
  onOpenNewNote
}) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-glass)',
      background: 'var(--bg-header, rgba(10, 16, 30, 0.85))',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
          }}>
            <Package size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)', letterSpacing: '-0.03em' }}>
                SIS<span style={{ color: 'var(--cyan-primary)' }}>CONTROL</span>
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                IMPORTADORA ERP
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                  display: 'inline-block'
                }}></span>
                SQLite Local Propia Activa
              </span>
              <span>•</span>
              <span>Control Económico & Mercadería</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

          {/* Import from Google Sheets Button */}
          <button 
            onClick={onOpenImporter}
            className="btn btn-indigo"
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          >
            <FileSpreadsheet size={16} />
            <span>Importar Hojas / Sheets</span>
          </button>

          {/* New Entry (Inbound Reception) */}
          <button 
            onClick={() => onOpenNewMovement('ENTRADA')}
            className="btn btn-emerald"
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          >
            <ArrowDownLeft size={16} />
            <span>+ Entrada (Contenedor/Lote)</span>
          </button>

          {/* New Sales Note (Con Cajas / Unidades, Clientes y Abonos) */}
          <button 
            onClick={onOpenNewNote}
            className="btn btn-primary"
            style={{ 
              fontSize: '0.82rem', 
              padding: '8px 14px', 
              background: 'linear-gradient(135deg, #06b6d4, #0284c7)', 
              border: 'none', 
              boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)', 
              fontWeight: 700 
            }}
          >
            <FileText size={16} />
            <span>+ Nota de Venta</span>
          </button>

          {/* New Sale (Outbound Dispatch Direct) */}
          <button 
            onClick={() => onOpenNewMovement('SALIDA')}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          >
            <ArrowUpRight size={16} />
            <span>+ Venta Rápida</span>
          </button>

          {/* New Product */}
          <button 
            onClick={onOpenNewProduct}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          >
            <PlusCircle size={16} />
            <span>+ Producto</span>
          </button>

          {/* Theme toggle */}
          <button 
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{ padding: '8px 10px', borderRadius: '10px' }}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} color="#6366f1" />}
          </button>
        </div>
      </div>
    </header>
  );
}
