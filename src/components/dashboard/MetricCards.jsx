import React from 'react';
import { 
  Coins, 
  Package, 
  BarChart3, 
  Ship, 
  ArrowUpRight, 
  ArrowRight 
} from 'lucide-react';

export default function MetricCards({ 
  totalSalesBob, 
  totalStockValuationCostBob, 
  totalStockUnits, 
  grossProfitBob, 
  grossMarginPercent, 
  unitsSold, 
  inTransitContainers, 
  formatMoney, 
  onSelectTab 
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
      gap: '16px'
    }}>
      {/* KPI 1: Ventas Facturadas */}
      <div className="glass-panel" style={{
        padding: '18px 20px',
        borderRadius: '14px',
        borderLeft: '4px solid #EA580C',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Ventas Facturadas
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(234, 88, 12, 0.1)',
              color: '#EA580C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Coins size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '8px' }}>
            <div className="mono" style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
              {formatMoney(totalSalesBob)}
            </div>
            {/* Sparkline */}
            <svg width="54" height="22" viewBox="0 0 54 22" fill="none" style={{ opacity: 0.85 }}>
              <path d="M2 18 L12 14 L22 16 L32 9 L42 11 L52 3" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-glass)' }}>
          <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <ArrowUpRight size={13} /> +{unitsSold} uds. vendidas
          </span>
          <button 
            type="button" 
            onClick={() => onSelectTab('notes')}
            style={{ fontSize: '0.72rem', color: '#EA580C', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
          >
            Ver Notas <ArrowRight size={11} />
          </button>
        </div>
      </div>

      {/* KPI 2: Inventario en Bodega (Costo) */}
      <div className="glass-panel" style={{
        padding: '18px 20px',
        borderRadius: '14px',
        borderLeft: '4px solid #0284c7',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Inventario en Bodega (Costo)
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(2, 132, 199, 0.1)',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '8px' }}>
            <div className="mono" style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
              {formatMoney(totalStockValuationCostBob)}
            </div>
            {/* Sparkline */}
            <svg width="54" height="22" viewBox="0 0 54 22" fill="none" style={{ opacity: 0.85 }}>
              <path d="M2 12 L12 11 L22 13 L32 8 L42 9 L52 6" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-glass)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {totalStockUnits.toLocaleString()} unidades físicas
          </span>
          <button 
            type="button" 
            onClick={() => onSelectTab('inventory')}
            style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
          >
            Ver Catálogo <ArrowRight size={11} />
          </button>
        </div>
      </div>

      {/* KPI 3: Utilidad Bruta */}
      <div className="glass-panel" style={{
        padding: '18px 20px',
        borderRadius: '14px',
        borderLeft: '4px solid #059669',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Utilidad Comercial Bruta
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(5, 150, 105, 0.1)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart3 size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '8px' }}>
            <div className="mono" style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
              {formatMoney(grossProfitBob)}
            </div>
            {/* Sparkline */}
            <svg width="54" height="22" viewBox="0 0 54 22" fill="none" style={{ opacity: 0.85 }}>
              <path d="M2 19 L12 15 L22 14 L32 8 L42 6 L52 2" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-glass)' }}>
          <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
            {grossMarginPercent.toFixed(1)}% margen neto
          </span>
          <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
            Saludable
          </span>
        </div>
      </div>

      {/* KPI 4: Embarques en Tránsito */}
      <div className="glass-panel" style={{
        padding: '18px 20px',
        borderRadius: '14px',
        borderLeft: '4px solid #7c3aed',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Logística & Embarques
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(124, 58, 237, 0.1)',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Ship size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '8px' }}>
            <div className="mono" style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
              {inTransitContainers} en Camino
            </div>
            {/* Transit dots timeline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', paddingBottom: '3px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ width: '12px', height: '2px', background: '#10b981' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1.5s infinite' }} />
              <span style={{ width: '12px', height: '2px', background: 'var(--border-glass)' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--border-glass)' }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-glass)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Marítimo Arica & Terrestre
          </span>
          <button 
            type="button" 
            onClick={() => onSelectTab('containers')}
            style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
          >
            Ver Barcos <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
