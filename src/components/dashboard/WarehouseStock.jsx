import React, { useState } from 'react';
import { Building2, ArrowRight, Layers } from 'lucide-react';

export default function WarehouseStock({ 
  totalStockValuationCostBob, 
  categoriesDistribution = [], 
  formatShortMoney, 
  onSelectTab 
}) {
  const [hoveredCatId, setHoveredCatId] = useState(null);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(2, 132, 199, 0.1)',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={18} />
            </div>
            <div>
              <h3 className="font-heading" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Almacenes & Puntos de Stock
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Ubicación física y capital valorizado
              </span>
            </div>
          </div>
          <span className="badge badge-cyan" style={{ fontSize: '0.70rem' }}>
            3 Ubicaciones
          </span>
        </div>

        {/* 3 Almacén Cards con Visual Share Bars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {/* Almacén Central */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.04)',
            border: '1px solid var(--border-glass)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                CASA CUBANO
              </div>
              <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                {formatShortMoney(totalStockValuationCostBob * 0.75)}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Central (75%)
              </div>
            </div>
            {/* Share bar */}
            <div style={{ width: '100%', height: '3px', background: 'rgba(2, 132, 199, 0.15)', borderRadius: '999px', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{ width: '75%', height: '100%', background: '#0284c7', borderRadius: '999px' }} />
            </div>
          </div>

          {/* Tienda La Pampa */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.04)',
            border: '1px solid var(--border-glass)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                LA PAMPA
              </div>
              <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                {formatShortMoney(totalStockValuationCostBob * 0.15)}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Mostrador (15%)
              </div>
            </div>
            {/* Share bar */}
            <div style={{ width: '100%', height: '3px', background: 'rgba(5, 150, 105, 0.15)', borderRadius: '999px', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{ width: '15%', height: '100%', background: '#059669', borderRadius: '999px' }} />
            </div>
          </div>

          {/* En Tránsito */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.04)',
            border: '1px solid var(--border-glass)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#EA580C', textTransform: 'uppercase' }}>
                EN TRÁNSITO
              </div>
              <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                {formatShortMoney(totalStockValuationCostBob * 0.10)}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Arica/Aduana (10%)
              </div>
            </div>
            {/* Share bar */}
            <div style={{ width: '100%', height: '3px', background: 'rgba(234, 88, 12, 0.15)', borderRadius: '999px', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{ width: '10%', height: '100%', background: '#EA580C', borderRadius: '999px' }} />
            </div>
          </div>
        </div>

        {/* Categorías Principales con Barra Proporcional Segmentada */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Categorías con Mayor Valorización
            </span>
            <button
              type="button"
              onClick={() => onSelectTab('inventory')}
              style={{ fontSize: '0.72rem', color: '#EA580C', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
            >
              Ver Catálogo <ArrowRight size={11} />
            </button>
          </div>

          {/* Segmented Proportion Stacked Bar (Estilo moderno Apple/GitHub) */}
          <div style={{
            width: '100%',
            height: '7px',
            display: 'flex',
            borderRadius: '999px',
            overflow: 'hidden',
            marginBottom: '14px',
            background: 'rgba(15, 23, 42, 0.06)'
          }}>
            {categoriesDistribution.map((cat) => (
              <div
                key={cat.id}
                title={`${cat.name}: ${cat.percentage}%`}
                onMouseEnter={() => setHoveredCatId(cat.id)}
                onMouseLeave={() => setHoveredCatId(null)}
                style={{
                  width: `${cat.percentage}%`,
                  height: '100%',
                  background: cat.color,
                  opacity: hoveredCatId && hoveredCatId !== cat.id ? 0.35 : 1,
                  transition: 'opacity 0.2s ease',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>

          {/* Category Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categoriesDistribution.map((cat) => {
              const isHovered = hoveredCatId === cat.id;
              return (
                <div 
                  key={cat.id}
                  onMouseEnter={() => setHoveredCatId(cat.id)}
                  onMouseLeave={() => setHoveredCatId(null)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: isHovered ? 'rgba(234, 88, 12, 0.05)' : 'rgba(15, 23, 42, 0.03)',
                    border: isHovered ? '1px solid rgba(234, 88, 12, 0.25)' : '1px solid var(--border-glass)',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {cat.name}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        ({cat.count} prods)
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="mono" style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {formatShortMoney(cat.amountBob)}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: cat.badgeBg,
                        color: cat.badgeColor,
                        border: `1px solid ${cat.badgeBorder}`
                      }}>
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                  {/* Progress Bar Fina con Glow */}
                  <div style={{ width: '100%', height: '3px', background: 'rgba(15, 23, 42, 0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${cat.percentage}%`, 
                      height: '100%', 
                      background: cat.color, 
                      borderRadius: '999px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
