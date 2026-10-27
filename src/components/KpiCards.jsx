import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ArrowLeftRight, 
  Boxes, 
  AlertTriangle, 
  Ship, 
  CheckCircle2, 
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

export default function KpiCards({ stats, onFilterAlerts }) {
  if (!stats) return null;

  const { financials, merchandiseFlow, inventory, containers } = stats;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '28px'
    }}>
      {/* 1. VENTAS Y RENTABILIDAD */}
      <div className="glass-panel glass-panel-interactive" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Facturación & Ventas
            </span>
            <h3 className="font-heading" style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
              {formatCurrency(financials.totalSales)}
            </h3>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cyan-primary)'
          }}>
            <DollarSign size={22} />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Utilidad Bruta:</span>
            <span style={{ fontWeight: 700, color: 'var(--emerald-success)' }}>
              {formatCurrency(financials.grossProfit)} ({formatPercent(financials.grossMarginPercent)})
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Utilidad Neta (tras gastos):</span>
            <span style={{ fontWeight: 700, color: financials.netProfit >= 0 ? '#38bdf8' : '#fb7185' }}>
              {formatCurrency(financials.netProfit)} ({formatPercent(financials.netMarginPercent)})
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Costo Landed de Ventas:</span>
            <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(financials.totalCogs)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. FLUJO DE MERCADERÍA (ENTRADAS VS SALIDAS) */}
      <div className="glass-panel glass-panel-interactive" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Mercadería Despachada
            </span>
            <h3 className="font-heading" style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
              {formatNumber(merchandiseFlow.unitsSold)} <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-muted)' }}>unid.</span>
            </h3>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--indigo-brand)'
          }}>
            <ArrowLeftRight size={22} />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowDownRight size={14} color="#10b981" /> Unidades Ingresadas:
            </span>
            <span style={{ fontWeight: 700, color: 'var(--emerald-success)' }}>
              +{formatNumber(merchandiseFlow.unitsInbound)} unid.
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={14} color="#38bdf8" /> Ventas Registradas:
            </span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
              {formatNumber(merchandiseFlow.salesTransactions)} despachos
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Variación Neta en Almacén:</span>
            <span style={{ fontWeight: 700, color: merchandiseFlow.netInventoryChange >= 0 ? '#34d399' : '#fbbf24' }}>
              {merchandiseFlow.netInventoryChange > 0 ? `+${formatNumber(merchandiseFlow.netInventoryChange)}` : formatNumber(merchandiseFlow.netInventoryChange)} unid.
            </span>
          </div>
        </div>
      </div>

      {/* 3. VALORACIÓN DE INVENTARIO EN BODEGA */}
      <div className="glass-panel glass-panel-interactive" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Capital en Bodega (Costo)
            </span>
            <h3 className="font-heading" style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
              {formatCurrency(inventory.totalValuationCost)}
            </h3>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--emerald-success)'
          }}>
            <Boxes size={22} />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Valor Venta Proyectado:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              {formatCurrency(inventory.totalValuationRetail)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Ganancia por Realizar:</span>
            <span style={{ fontWeight: 700, color: 'var(--cyan-primary)' }}>
              +{formatCurrency(inventory.expectedProfitInStock)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Stock Físico Disponible:</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
              {formatNumber(inventory.totalStockUnits)} unid. en {inventory.totalProductsCount} SKUs
            </span>
          </div>
        </div>
      </div>

      {/* 4. ESTADO DE STOCK & EMBARQUES */}
      <div className="glass-panel glass-panel-interactive" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Alertas & Embarques
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <h3 className="font-heading" style={{ fontSize: '1.9rem', fontWeight: 800, color: inventory.criticalStockCount > 0 ? '#fb7185' : '#34d399' }}>
                {inventory.criticalStockCount + inventory.outOfStockCount}
              </h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>SKUs con atención</span>
            </div>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: inventory.criticalStockCount > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${inventory.criticalStockCount > 0 ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: inventory.criticalStockCount > 0 ? '#fb7185' : '#34d399'
          }}>
            {inventory.criticalStockCount > 0 ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={14} color="#fb7185" /> Stock Crítico / Agotado:
            </span>
            <span className="badge badge-rose" style={{ padding: '2px 8px', cursor: 'pointer' }} onClick={() => onFilterAlerts('critical')}>
              {inventory.criticalStockCount + inventory.outOfStockCount} productos
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Ship size={14} color="#38bdf8" /> Contenedores Activos:
            </span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>
              {containers.in_transit} en tránsito | {containers.in_customs} en aduana
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Stock Óptimo:</span>
            <span style={{ color: 'var(--emerald-success)', fontWeight: 600 }}>
              {inventory.healthyStockCount} productos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
