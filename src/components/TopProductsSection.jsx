import React, { useState } from 'react';
import { 
  Trophy, 
  Crown, 
  Award, 
  Medal, 
  Flame, 
  Sparkles, 
  ArrowUpRight, 
  Boxes,
  HelpCircle,
  TrendingUp,
  Percent
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

export default function TopProductsSection({ topProducts = [], abcAnalysis = [] }) {
  const [viewMode, setViewMode] = useState('ranking'); // 'ranking' o 'abc'
  const [metricFilter, setMetricFilter] = useState('revenue'); // 'revenue' o 'volume'

  // Sort top products depending on metric filter
  const sortedProducts = [...topProducts].sort((a, b) => {
    if (metricFilter === 'revenue') return b.total_revenue - a.total_revenue;
    return b.units_sold - a.units_sold;
  });

  const top1 = sortedProducts[0];
  const top2 = sortedProducts[1];
  const top3 = sortedProducts[2];
  const remaining = sortedProducts.slice(3);

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
      {/* Header */}
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
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(234, 88, 12, 0.2))',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24'
          }}>
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Productos Más Vendidos & Análisis de Demanda
              <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                <Flame size={12} /> Top Sellers
              </span>
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Identifica la mercadería más demandada y la clasificación 80/20 de rentabilidad
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {viewMode === 'ranking' && (
            <div style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: '3px',
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                onClick={() => setMetricFilter('revenue')}
                className="btn"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: metricFilter === 'revenue' ? 'var(--cyan-primary)' : 'transparent',
                  color: metricFilter === 'revenue' ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                Por Dinero ($)
              </button>
              <button
                onClick={() => setMetricFilter('volume')}
                className="btn"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: metricFilter === 'volume' ? 'var(--cyan-primary)' : 'transparent',
                  color: metricFilter === 'volume' ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                Por Unidades
              </button>
            </div>
          )}

          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setViewMode('ranking')}
              className="btn"
              style={{
                padding: '4px 12px',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'ranking' ? 'var(--indigo-brand)' : 'transparent',
                color: viewMode === 'ranking' ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              Ranking
            </button>
            <button
              onClick={() => setViewMode('abc')}
              className="btn"
              style={{
                padding: '4px 12px',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'abc' ? 'var(--emerald-success)' : 'transparent',
                color: viewMode === 'abc' ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              Curva Pareto (ABC)
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: RANKING & PODIUM */}
      {viewMode === 'ranking' && (
        <div>
          {/* Podium Top 3 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* 1st Place */}
            {top1 && (
              <div style={{
                background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.7) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '16px',
                padding: '18px',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.15)'
              }}>
                <div style={{ position: 'absolute', top: '14px', right: '14px' }}>
                  <Crown size={28} color="#fbbf24" />
                </div>
                <span className="badge badge-amber" style={{ fontSize: '0.7rem', marginBottom: '8px' }}>
                  #1 MÁS VENDIDO
                </span>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px', paddingRight: '30px' }}>
                  {top1.name}
                </h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>
                  SKU: {top1.sku} • {top1.category}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ventas:</span>
                    <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '1.1rem' }}>
                      {formatCurrency(top1.total_revenue)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Despachadas:</span>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.1rem' }}>
                      {formatNumber(top1.units_sold)} <span style={{ fontSize: '0.75rem' }}>unid.</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--emerald-success)', fontWeight: 600 }}>
                    Margen: +{formatPercent(top1.margin_percent)}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Stock: {top1.current_stock} unid.
                  </span>
                </div>
              </div>
            )}

            {/* 2nd Place */}
            {top2 && (
              <div style={{
                background: 'linear-gradient(180deg, rgba(148, 163, 184, 0.1) 0%, rgba(15, 23, 42, 0.7) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '16px',
                padding: '18px',
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: '14px', right: '14px' }}>
                  <Award size={26} color="#94a3b8" />
                </div>
                <span className="badge" style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', fontSize: '0.7rem', marginBottom: '8px' }}>
                  #2 PUESTO
                </span>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px', paddingRight: '30px' }}>
                  {top2.name}
                </h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>
                  SKU: {top2.sku} • {top2.category}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ventas:</span>
                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.1rem' }}>
                      {formatCurrency(top2.total_revenue)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Despachadas:</span>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.1rem' }}>
                      {formatNumber(top2.units_sold)} <span style={{ fontSize: '0.75rem' }}>unid.</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--emerald-success)', fontWeight: 600 }}>
                    Margen: +{formatPercent(top2.margin_percent)}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Stock: {top2.current_stock} unid.
                  </span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3 && (
              <div style={{
                background: 'linear-gradient(180deg, rgba(217, 119, 6, 0.1) 0%, rgba(15, 23, 42, 0.7) 100%)',
                border: '1px solid rgba(217, 119, 6, 0.3)',
                borderRadius: '16px',
                padding: '18px',
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: '14px', right: '14px' }}>
                  <Medal size={26} color="#d97706" />
                </div>
                <span className="badge" style={{ background: 'rgba(217, 119, 6, 0.15)', color: '#f59e0b', fontSize: '0.7rem', marginBottom: '8px' }}>
                  #3 PUESTO
                </span>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px', paddingRight: '30px' }}>
                  {top3.name}
                </h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>
                  SKU: {top3.sku} • {top3.category}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ventas:</span>
                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.1rem' }}>
                      {formatCurrency(top3.total_revenue)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Despachadas:</span>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.1rem' }}>
                      {formatNumber(top3.units_sold)} <span style={{ fontSize: '0.75rem' }}>unid.</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--emerald-success)', fontWeight: 600 }}>
                    Margen: +{formatPercent(top3.margin_percent)}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Stock: {top3.current_stock} unid.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Table for remaining Top 4-10 */}
          {remaining.length > 0 && (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Producto & SKU</th>
                    <th>Categoría</th>
                    <th style={{ textAlign: 'right' }}>Unidades Vendidas</th>
                    <th style={{ textAlign: 'right' }}>Ingresos Totales</th>
                    <th style={{ textAlign: 'right' }}>Utilidad Generada</th>
                    <th style={{ textAlign: 'center' }}>Margen %</th>
                    <th style={{ textAlign: 'right' }}>Stock Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {remaining.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{idx + 4}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.sku}</div>
                      </td>
                      <td>
                        <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>{item.category}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatNumber(item.units_sold)} u.</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#f8fafc' }}>{formatCurrency(item.total_revenue)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--emerald-success)' }}>{formatCurrency(item.total_profit)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                          +{formatPercent(item.margin_percent)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{
                          fontWeight: 600,
                          color: item.current_stock <= 15 ? '#fb7185' : 'var(--text-main)'
                        }}>
                          {item.current_stock} unid.
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: PARETO ABC ANALYSIS */}
      {viewMode === 'abc' && (
        <div>
          {/* Explanation Banner */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <HelpCircle size={22} color="var(--indigo-brand)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.82rem', lineHeight: '1.5' }}>
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '4px' }}>
                ¿Qué es la Clasificación ABC para una Importadora?
              </strong>
              Permite optimizar tus compras internacionales y capital de trabajo:
              <ul style={{ marginTop: '6px', marginLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><strong style={{ color: '#34d399' }}>Clase A (80% del Dinero):</strong> Los productos estrella que mueven casi todo tu negocio. <em>¡Nunca deben quedarse sin stock en bodega!</em></li>
                <li><strong style={{ color: '#38bdf8' }}>Clase B (15% del Dinero):</strong> Productos de rotación intermedia que complementan el catálogo.</li>
                <li><strong style={{ color: '#fbbf24' }}>Clase C (5% del Dinero):</strong> Productos secundarios. Importar en lotes pequeños para no congelar capital en bodega.</li>
              </ul>
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>Clase ABC</th>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Categoría</th>
                  <th style={{ textAlign: 'right' }}>Ingresos ($)</th>
                  <th style={{ textAlign: 'right' }}>% del Total</th>
                  <th style={{ textAlign: 'right' }}>% Acumulado</th>
                  <th style={{ textAlign: 'right' }}>Stock Bodega</th>
                </tr>
              </thead>
              <tbody>
                {abcAnalysis.map((item) => {
                  let badgeClass = 'badge-emerald';
                  if (item.abcClass === 'B') badgeClass = 'badge-cyan';
                  if (item.abcClass === 'C') badgeClass = 'badge-amber';

                  return (
                    <tr key={item.id}>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${badgeClass}`} style={{ fontSize: '0.85rem', fontWeight: 800, padding: '4px 12px' }}>
                          Clase {item.abcClass}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#f8fafc' }}>{item.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.sku}</td>
                      <td><span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>{item.category}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#f8fafc' }}>{formatCurrency(item.total_revenue)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--cyan-primary)' }}>{item.revenueSharePercent}%</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{item.cumPercent}%</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.current_stock} unid.</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
