import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  ArrowLeftRight, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

export default function ChartsSection({ chartsData }) {
  const [activeTab, setActiveTab] = useState('financials'); // 'financials', 'flow', 'categories'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!chartsData) return null;

  const { monthlyTrends = [], categoryDistribution = [] } = chartsData;

  // Max value for scale calculation
  const maxSales = Math.max(...monthlyTrends.map(m => Math.max(m.sales, m.cogs, m.profit)), 1000);
  const maxUnits = Math.max(...monthlyTrends.map(m => Math.max(m.units_sold, m.units_inbound)), 10);
  const maxCategoryValue = Math.max(...categoryDistribution.map(c => c.inventory_value), 1000);

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
      {/* Header & Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(6, 182, 212, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cyan-primary)'
          }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              Análisis Visual & Evolución Temporal
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Comportamiento económico y rotación de stock de la importadora
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{
          display: 'flex',
          gap: '6px',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setActiveTab('financials')}
            className="btn"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              borderRadius: '8px',
              background: activeTab === 'financials' ? 'var(--cyan-primary)' : 'transparent',
              color: activeTab === 'financials' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              boxShadow: activeTab === 'financials' ? '0 2px 10px rgba(6, 182, 212, 0.4)' : 'none'
            }}
          >
            <TrendingUp size={14} />
            <span>Ventas vs Costos</span>
          </button>

          <button
            onClick={() => setActiveTab('flow')}
            className="btn"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              borderRadius: '8px',
              background: activeTab === 'flow' ? 'var(--indigo-brand)' : 'transparent',
              color: activeTab === 'flow' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              boxShadow: activeTab === 'flow' ? '0 2px 10px rgba(99, 102, 241, 0.4)' : 'none'
            }}
          >
            <ArrowLeftRight size={14} />
            <span>Entradas vs Salidas</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className="btn"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              borderRadius: '8px',
              background: activeTab === 'categories' ? 'var(--emerald-success)' : 'transparent',
              color: activeTab === 'categories' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              boxShadow: activeTab === 'categories' ? '0 2px 10px rgba(16, 185, 129, 0.4)' : 'none'
            }}
          >
            <PieChart size={14} />
            <span>Por Categorías</span>
          </button>
        </div>
      </div>

      {/* TAB 1: FINANCIALS (Ventas vs Costos vs Utilidad) */}
      {activeTab === 'financials' && (
        <div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(180deg, #06b6d4, #0284c7)' }}></span>
              Ventas Totales ($)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(180deg, #64748b, #334155)' }}></span>
              Costo Landed Vendido ($)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(180deg, #10b981, #059669)' }}></span>
              Utilidad Bruta Ganada ($)
            </span>
          </div>

          {/* SVG Interactive Bar Chart */}
          <div style={{ width: '100%', height: '280px', position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 800 240" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                <g key={i}>
                  <line 
                    x1="0" 
                    y1={200 - ratio * 180} 
                    x2="800" 
                    y2={200 - ratio * 180} 
                    stroke="rgba(255, 255, 255, 0.06)" 
                    strokeDasharray="4 4" 
                  />
                  <text 
                    x="5" 
                    y={195 - ratio * 180} 
                    fill="var(--text-faint)" 
                    fontSize="10" 
                    fontFamily="var(--font-mono)"
                  >
                    ${formatNumber(Math.round(ratio * maxSales))}
                  </text>
                </g>
              ))}

              {/* Bars per Month */}
              {monthlyTrends.map((monthData, idx) => {
                const totalMonths = monthlyTrends.length;
                const slotWidth = 800 / totalMonths;
                const barGroupX = idx * slotWidth + slotWidth * 0.15;
                const barWidth = slotWidth * 0.22;

                const hSales = (monthData.sales / maxSales) * 180;
                const hCogs = (monthData.cogs / maxSales) * 180;
                const hProfit = (monthData.profit / maxSales) * 180;

                const isHovered = hoveredIndex === idx;

                return (
                  <g 
                    key={monthData.month}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Hover highlight background */}
                    {isHovered && (
                      <rect 
                        x={idx * slotWidth} 
                        y="0" 
                        width={slotWidth} 
                        height="210" 
                        fill="rgba(6, 182, 212, 0.05)" 
                        rx="8" 
                      />
                    )}

                    {/* Sales Bar */}
                    <rect 
                      x={barGroupX} 
                      y={200 - hSales} 
                      width={barWidth} 
                      height={Math.max(hSales, 2)} 
                      rx="4" 
                      fill="url(#salesGrad)" 
                    />

                    {/* COGS Bar */}
                    <rect 
                      x={barGroupX + barWidth + 4} 
                      y={200 - hCogs} 
                      width={barWidth} 
                      height={Math.max(hCogs, 2)} 
                      rx="4" 
                      fill="url(#cogsGrad)" 
                    />

                    {/* Profit Bar */}
                    <rect 
                      x={barGroupX + (barWidth + 4) * 2} 
                      y={200 - hProfit} 
                      width={barWidth} 
                      height={Math.max(hProfit, 2)} 
                      rx="4" 
                      fill="url(#profitGrad)" 
                    />

                    {/* Month Label */}
                    <text 
                      x={barGroupX + (barWidth * 1.5)} 
                      y="225" 
                      textAnchor="middle" 
                      fill={isHovered ? 'var(--cyan-primary)' : 'var(--text-muted)'} 
                      fontSize="12" 
                      fontWeight="600"
                    >
                      {monthData.month}
                    </text>
                  </g>
                );
              })}

              {/* Gradients */}
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id="cogsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>

            {/* Floating Tooltip */}
            {hoveredIndex !== null && monthlyTrends[hoveredIndex] && (
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '20px',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid var(--border-glass)',
                padding: '12px 16px',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-modal)',
                fontSize: '0.8rem',
                minWidth: '200px'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--cyan-primary)', marginBottom: '6px' }}>
                  Período: {monthlyTrends[hoveredIndex].month}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Ventas:</span>
                  <span style={{ fontWeight: 600, color: '#f8fafc' }}>{formatCurrency(monthlyTrends[hoveredIndex].sales)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Costo Landed:</span>
                  <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(monthlyTrends[hoveredIndex].cogs)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px', marginTop: '4px' }}>
                  <span style={{ color: 'var(--emerald-success)', fontWeight: 600 }}>Utilidad:</span>
                  <span style={{ fontWeight: 700, color: 'var(--emerald-success)' }}>{formatCurrency(monthlyTrends[hoveredIndex].profit)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MERCHANDISE FLOW (Entradas vs Salidas) */}
      {activeTab === 'flow' && (
        <div>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }}></span>
              Entradas de Mercadería (Unidades Importadas)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#6366f1' }}></span>
              Salidas por Ventas (Unidades Despachadas)
            </span>
          </div>

          <div style={{ width: '100%', height: '280px', position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 800 240" preserveAspectRatio="none">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                <g key={i}>
                  <line x1="0" y1={200 - ratio * 180} x2="800" y2={200 - ratio * 180} stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="4 4" />
                  <text x="5" y={195 - ratio * 180} fill="var(--text-faint)" fontSize="10" fontFamily="var(--font-mono)">
                    {formatNumber(Math.round(ratio * maxUnits))} u.
                  </text>
                </g>
              ))}

              {monthlyTrends.map((monthData, idx) => {
                const totalMonths = monthlyTrends.length;
                const slotWidth = 800 / totalMonths;
                const barGroupX = idx * slotWidth + slotWidth * 0.22;
                const barWidth = slotWidth * 0.26;

                const hInbound = (monthData.units_inbound / maxUnits) * 180;
                const hOutbound = (monthData.units_sold / maxUnits) * 180;

                return (
                  <g key={monthData.month}>
                    {/* Inbound */}
                    <rect 
                      x={barGroupX} 
                      y={200 - hInbound} 
                      width={barWidth} 
                      height={Math.max(hInbound, 2)} 
                      rx="4" 
                      fill="#10b981" 
                    />
                    {/* Outbound */}
                    <rect 
                      x={barGroupX + barWidth + 6} 
                      y={200 - hOutbound} 
                      width={barWidth} 
                      height={Math.max(hOutbound, 2)} 
                      rx="4" 
                      fill="#6366f1" 
                    />

                    <text 
                      x={barGroupX + barWidth + 3} 
                      y="225" 
                      textAnchor="middle" 
                      fill="var(--text-muted)" 
                      fontSize="12" 
                      fontWeight="600"
                    >
                      {monthData.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORY DISTRIBUTION */}
      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {categoryDistribution.map((cat, index) => {
            const percentOfTotal = maxCategoryValue > 0 ? (cat.inventory_value / maxCategoryValue) * 100 : 0;
            const colors = ['#06b6d4', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];
            const color = colors[index % colors.length];

            return (
              <div 
                key={cat.category}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }}></span>
                    {cat.category}
                  </span>
                  <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                    {cat.product_count} productos
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span>Capital en Bodega: <strong style={{ color: 'var(--text-main)' }}>{formatCurrency(cat.inventory_value)}</strong></span>
                  <span>{formatNumber(cat.total_stock)} unidades</span>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '8px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${percentOfTotal}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.5s ease' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
