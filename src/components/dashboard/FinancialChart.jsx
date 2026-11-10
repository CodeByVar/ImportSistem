import React, { useState } from 'react';
import { TrendingUp, BarChart2, Activity, Ship, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function FinancialChart({ 
  monthlyFlowData = [], 
  chartFilter, 
  setChartFilter, 
  hoveredMonthIdx, 
  setHoveredMonthIdx, 
  formatShortMoney, 
  activeShipment, 
  onSelectTab 
}) {
  const [viewMode, setViewMode] = useState('bar'); // 'bar' or 'area'

  // Max scale calculation for Y-axis (max around 100K)
  const maxVal = 100000;
  const chartHeight = 160;
  const chartWidth = 520;

  // Active hover info
  const activeMonth = hoveredMonthIdx !== null ? monthlyFlowData[hoveredMonthIdx] : null;

  // Area Path generators for smooth curves
  const getCoordinates = (key) => {
    const step = chartWidth / (monthlyFlowData.length - 1);
    return monthlyFlowData.map((d, i) => {
      const val = key === 'ventas' ? d.ventasValBob : d.costosValBob;
      const x = i * step;
      const y = chartHeight - (val / maxVal) * (chartHeight - 20) - 10;
      return { x, y };
    });
  };

  const createCurvedPath = (points) => {
    if (!points.length) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const ventasPoints = getCoordinates('ventas');
  const costosPoints = getCoordinates('costos');
  const ventasPath = createCurvedPath(ventasPoints);
  const costosPath = createCurvedPath(costosPoints);
  const ventasArea = ventasPath ? `${ventasPath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z` : '';
  const costosArea = costosPath ? `${costosPath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z` : '';

  return (
    <div className="glass-panel" style={{
      padding: '22px',
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '18px'
    }}>
      <div>
        {/* Header del Panel */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(5, 150, 105, 0.1)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 className="font-heading" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Rendimiento Financiero Semestral
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Evolución de ventas facturadas vs costos de mercadería
              </span>
            </div>
          </div>

          {/* Controles: Vista (Barras / Área) y Filtros */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              background: 'rgba(15, 23, 42, 0.05)',
              padding: '2px',
              borderRadius: '8px',
              border: '1px solid var(--border-glass)'
            }}>
              <button
                type="button"
                onClick={() => setViewMode('bar')}
                title="Vista de Barras"
                style={{
                  padding: '3px 7px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'bar' ? 'var(--bg-dark-card)' : 'transparent',
                  color: viewMode === 'bar' ? 'var(--text-main)' : 'var(--text-muted)'
                }}
              >
                <BarChart2 size={13} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('area')}
                title="Vista de Curva / Área"
                style={{
                  padding: '3px 7px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'area' ? 'var(--bg-dark-card)' : 'transparent',
                  color: viewMode === 'area' ? 'var(--text-main)' : 'var(--text-muted)'
                }}
              >
                <Activity size={13} />
              </button>
            </div>

            {/* Filter Buttons */}
            <div style={{
              display: 'flex',
              gap: '3px',
              background: 'rgba(15, 23, 42, 0.05)',
              padding: '2px',
              borderRadius: '8px',
              border: '1px solid var(--border-glass)'
            }}>
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'VENTAS', label: 'Ventas' },
                { id: 'COSTOS', label: 'Costos' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setChartFilter(f.id)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: chartFilter === f.id ? (f.id === 'VENTAS' ? '#EA580C' : f.id === 'COSTOS' ? '#1e293b' : 'var(--bg-dark-card)') : 'transparent',
                    color: chartFilter === f.id ? (f.id === 'ALL' ? 'var(--text-main)' : '#ffffff') : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Tooltip Pill */}
        <div style={{
          minHeight: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '0.74rem'
        }}>
          {activeMonth ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(15, 23, 42, 0.05)',
              padding: '3px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-glass)'
            }}>
              <span style={{ fontWeight: 800, color: '#EA580C' }}>{activeMonth.month}:</span>
              <span>Ventas <strong>Bs {activeMonth.ventasValBob.toLocaleString()}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span>Costos <strong>Bs {activeMonth.costosValBob.toLocaleString()}</strong></span>
              <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                {activeMonth.margen} margen
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: '#EA580C' }} /> Ventas Facturadas
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: '#334155' }} /> Costos Landed
              </span>
              <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>(Pasa el cursor para ver detalles)</span>
            </div>
          )}

          <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
            Escala máxima: <strong>Bs 100K</strong>
          </span>
        </div>

        {/* High-Definition Interactive Chart SVG */}
        <div style={{
          width: '100%',
          height: `${chartHeight + 25}px`,
          position: 'relative',
          paddingBottom: '4px'
        }}>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight + 25}`}
            style={{ width: '100%', height: '100%', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="ventasBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
              <linearGradient id="costosBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <linearGradient id="ventasAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EA580C" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#EA580C" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="costosAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#334155" stopOpacity="0.20" />
                <stop offset="100%" stopColor="#334155" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines with Y-Axis Labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = chartHeight - ratio * (chartHeight - 20) - 10;
              const label = ratio === 0 ? '0' : `${Math.round(ratio * 100)}K`;
              return (
                <g key={i}>
                  <line
                    x1="32"
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="var(--border-glass)"
                    strokeDasharray={ratio === 0 ? 'none' : '3 3'}
                    strokeWidth="1"
                  />
                  <text
                    x="24"
                    y={y + 3}
                    textAnchor="end"
                    fill="var(--text-muted)"
                    fontSize="9"
                    fontFamily="var(--font-mono)"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* MODE 1: AREA CURVE */}
            {viewMode === 'area' && (
              <>
                {(chartFilter === 'ALL' || chartFilter === 'COSTOS') && (
                  <>
                    <path d={costosArea} fill="url(#costosAreaGrad)" />
                    <path d={costosPath} fill="none" stroke="#475569" strokeWidth="2.5" />
                    {costosPoints.map((pt, i) => (
                      <circle
                        key={i}
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredMonthIdx === i ? 5 : 3.5}
                        fill="#334155"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    ))}
                  </>
                )}
                {(chartFilter === 'ALL' || chartFilter === 'VENTAS') && (
                  <>
                    <path d={ventasArea} fill="url(#ventasAreaGrad)" />
                    <path d={ventasPath} fill="none" stroke="#EA580C" strokeWidth="2.5" />
                    {ventasPoints.map((pt, i) => (
                      <circle
                        key={i}
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredMonthIdx === i ? 5.5 : 4}
                        fill="#EA580C"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    ))}
                  </>
                )}
              </>
            )}

            {/* MODE 2: MODERN ROUNDED BARS */}
            {viewMode === 'bar' && (
              monthlyFlowData.map((d, i) => {
                const totalSlots = monthlyFlowData.length;
                const slotWidth = (chartWidth - 40) / totalSlots;
                const slotX = 40 + i * slotWidth;
                const isHovered = hoveredMonthIdx === i;

                const hVentas = (d.ventasValBob / maxVal) * (chartHeight - 20);
                const hCostos = (d.costosValBob / maxVal) * (chartHeight - 20);
                const barW = Math.min(18, slotWidth * 0.28);
                const gap = 4;

                const yVentas = chartHeight - 10 - hVentas;
                const yCostos = chartHeight - 10 - hCostos;

                return (
                  <g key={d.month}>
                    {/* Hover column background */}
                    {isHovered && (
                      <rect
                        x={slotX - 4}
                        y="10"
                        width={slotWidth}
                        height={chartHeight - 5}
                        fill="rgba(234, 88, 12, 0.05)"
                        rx="6"
                      />
                    )}

                    {/* Costos Bar */}
                    {(chartFilter === 'ALL' || chartFilter === 'COSTOS') && (
                      <rect
                        x={chartFilter === 'COSTOS' ? slotX + (slotWidth / 2) - barW / 2 : slotX + (slotWidth / 2) - barW - (gap / 2)}
                        y={yCostos}
                        width={barW}
                        height={Math.max(4, hCostos)}
                        fill="url(#costosBarGrad)"
                        rx="3"
                        style={{
                          opacity: isHovered ? 1 : 0.8,
                          transition: 'all 0.2s ease',
                          filter: isHovered ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))' : 'none'
                        }}
                      />
                    )}

                    {/* Ventas Bar */}
                    {(chartFilter === 'ALL' || chartFilter === 'VENTAS') && (
                      <rect
                        x={chartFilter === 'VENTAS' ? slotX + (slotWidth / 2) - barW / 2 : slotX + (slotWidth / 2) + (gap / 2)}
                        y={yVentas}
                        width={barW}
                        height={Math.max(4, hVentas)}
                        fill="url(#ventasBarGrad)"
                        rx="3"
                        style={{
                          opacity: isHovered ? 1 : 0.95,
                          transition: 'all 0.2s ease',
                          filter: isHovered ? 'drop-shadow(0 4px 8px rgba(234, 88, 12, 0.35))' : 'none'
                        }}
                      />
                    )}
                  </g>
                );
              })
            )}

            {/* X-Axis Month Labels */}
            {monthlyFlowData.map((d, i) => {
              const totalSlots = monthlyFlowData.length;
              const slotWidth = (chartWidth - 40) / totalSlots;
              const centerX = 40 + i * slotWidth + slotWidth / 2;
              const isHovered = hoveredMonthIdx === i;

              return (
                <g
                  key={d.month}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredMonthIdx(i)}
                  onMouseLeave={() => setHoveredMonthIdx(null)}
                >
                  {/* Invisible hit zone for smooth hovering */}
                  <rect
                    x={40 + i * slotWidth}
                    y="0"
                    width={slotWidth}
                    height={chartHeight + 25}
                    fill="transparent"
                  />
                  <text
                    x={centerX}
                    y={chartHeight + 16}
                    textAnchor="middle"
                    fill={isHovered ? '#EA580C' : 'var(--text-muted)'}
                    fontWeight={isHovered ? 800 : 600}
                    fontSize="11"
                    fontFamily="var(--font-sans)"
                  >
                    {d.month}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Summary Stats Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '10px',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-glass)',
          fontSize: '0.74rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Ventas Semestre:</span>
            <span className="mono" style={{ fontWeight: 800, color: 'var(--text-main)' }}>
              {formatShortMoney(448800)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Margen Promedio:</span>
            <span style={{ color: '#059669', fontWeight: 800 }}>
              +41.8% comercial
            </span>
          </div>
        </div>

        {/* Embarque en Ruta (Visual checkpoints) */}
        {activeShipment && (
          <div style={{
            marginTop: '16px',
            padding: '14px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border-glass)',
            background: 'rgba(15, 23, 42, 0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-amber" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                    🚢 {activeShipment.transport_type === 'TERRESTRE' ? 'CAMIÓN DIRECTO' : 'MARÍTIMO + CAMIÓN'}
                  </span>
                  <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                    🌊 En Altamar / Arica
                  </span>
                </div>
                <div className="mono" style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                  {activeShipment.tracking_number} • <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{activeShipment.shipping_line}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectTab('containers')}
                className="btn"
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-glass)',
                  background: 'var(--bg-dark-card)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Ver Embarques</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Checkpoints Visual Progress */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              padding: '6px 4px 2px'
            }}>
              {/* Stage 1 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.70rem' }}>
                <CheckCircle2 size={13} color="#10b981" />
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>China (Ningbo)</span>
              </div>

              <div style={{ flex: 1, height: '2px', background: '#10b981', margin: '0 8px' }} />

              {/* Stage 2 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.70rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1.5s infinite' }} />
                <span style={{ fontWeight: 700, color: '#f59e0b' }}>Puerto Arica</span>
              </div>

              <div style={{ flex: 1, height: '2px', background: 'var(--border-glass)', margin: '0 8px' }} />

              {/* Stage 3 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border-glass)' }} />
                <span>Bodega Central</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
