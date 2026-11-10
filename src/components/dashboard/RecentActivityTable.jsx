import React from 'react';
import { Search, ArrowRight } from 'lucide-react';

export default function RecentActivityTable({ 
  filteredActivities = [], 
  searchTerm, 
  setSearchTerm, 
  movementFilter, 
  setMovementFilter, 
  formatMoney, 
  onSelectTab 
}) {
  return (
    <div className="glass-panel" style={{
      padding: '22px',
      borderRadius: '16px'
    }}>
      {/* Table Controls Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '16px'
      }}>
        <div>
          <h3 className="font-heading" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Actividades Recientes & Movimientos
          </h3>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Últimas entradas de contenedores, lotes y despachos por nota de venta
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por NV, producto o cliente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                padding: '7px 12px 7px 30px',
                fontSize: '0.75rem',
                borderRadius: '9px',
                border: '1px solid var(--border-glass)',
                background: 'rgba(15, 23, 42, 0.04)',
                color: 'var(--text-main)',
                width: '240px',
                outline: 'none'
              }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{
            display: 'flex',
            gap: '4px',
            background: 'rgba(15, 23, 42, 0.05)',
            padding: '3px',
            borderRadius: '9px',
            border: '1px solid var(--border-glass)'
          }}>
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'SALIDA', label: 'Ventas' },
              { id: 'ENTRADA', label: 'Entradas' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setMovementFilter(f.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: movementFilter === f.id ? (f.id === 'SALIDA' ? '#EA580C' : f.id === 'ENTRADA' ? '#0284c7' : 'var(--bg-dark-card)') : 'transparent',
                  color: movementFilter === f.id ? (f.id === 'ALL' ? 'var(--text-main)' : '#ffffff') : 'var(--text-muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div style={{
        overflowX: 'auto',
        borderRadius: '12px',
        border: '1px solid var(--border-glass)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.76rem' }}>
          <thead>
            <tr style={{
              background: 'rgba(15, 23, 42, 0.04)',
              borderBottom: '1px solid var(--border-glass)',
              color: 'var(--text-muted)',
              fontWeight: 700,
              textTransform: 'uppercase',
              fontSize: '0.68rem',
              letterSpacing: '0.04em'
            }}>
              <th style={{ padding: '12px 16px' }}>N° REFERENCIA</th>
              <th style={{ padding: '12px 16px' }}>PRODUCTO / OPERACIÓN</th>
              <th style={{ padding: '12px 16px' }}>TIPO</th>
              <th style={{ padding: '12px 16px' }}>CANTIDAD</th>
              <th style={{ padding: '12px 16px' }}>MONTO TOTAL</th>
              <th style={{ padding: '12px 16px' }}>FECHA</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {filteredActivities.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron movimientos registrados para este filtro.
                </td>
              </tr>
            ) : (
              filteredActivities.map((row, idx) => (
                <tr 
                  key={idx}
                  style={{
                    borderBottom: '1px solid var(--border-glass)',
                    transition: 'background 0.12s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="mono" style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {row.id}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      {row.client}
                    </div>
                    <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                      {row.party}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: row.type === 'ENTRADA' ? 'rgba(2, 132, 199, 0.12)' : 'rgba(234, 88, 12, 0.12)',
                      color: row.type === 'ENTRADA' ? '#0284c7' : '#EA580C',
                      border: `1px solid ${row.type === 'ENTRADA' ? 'rgba(2, 132, 199, 0.25)' : 'rgba(234, 88, 12, 0.25)'}`
                    }}>
                      {row.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {row.quantity.toLocaleString()} uds.
                  </td>
                  <td className="mono" style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {formatMoney(row.amountBob)}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                    {row.date}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <span className={row.statusType === 'info' ? 'badge badge-cyan' : 'badge badge-emerald'} style={{ fontSize: '0.68rem', padding: '3px 8px' }}>
                      ● {row.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
        <span>Mostrando {filteredActivities.length} operaciones registradas</span>
        <button
          type="button"
          onClick={() => onSelectTab('movements')}
          style={{ fontSize: '0.74rem', color: '#EA580C', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
        >
          Ver Historial Completo en Kardex <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

