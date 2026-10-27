import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  Calendar, 
  FileText, 
  User, 
  CreditCard,
  History
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';

export default function MovementsTable({ movements = [] }) {
  const [typeFilter, setTypeFilter] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMovements = movements.filter(m => {
    const matchesType = typeFilter === 'TODOS' || m.type === typeFilter;
    const matchesSearch = 
      (m.product_name && m.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.sku && m.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.reference && m.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.party_name && m.party_name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesType && matchesSearch;
  });

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--indigo-brand)'
          }}>
            <History size={20} />
          </div>
          <div>
            <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              Historial de Movimientos de Mercadería (Kardex)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Registro cronológico de entradas de importación y salidas por ventas
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Type Filter Buttons */}
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            padding: '3px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setTypeFilter('TODOS')}
              className="btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                borderRadius: '8px',
                border: 'none',
                background: typeFilter === 'TODOS' ? 'var(--cyan-primary)' : 'transparent',
                color: typeFilter === 'TODOS' ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              Todos
            </button>
            <button
              onClick={() => setTypeFilter('ENTRADA')}
              className="btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                borderRadius: '8px',
                border: 'none',
                background: typeFilter === 'ENTRADA' ? 'var(--emerald-success)' : 'transparent',
                color: typeFilter === 'ENTRADA' ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              Entradas (Lotes)
            </button>
            <button
              onClick={() => setTypeFilter('SALIDA')}
              className="btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                borderRadius: '8px',
                border: 'none',
                background: typeFilter === 'SALIDA' ? 'var(--indigo-brand)' : 'transparent',
                color: typeFilter === 'SALIDA' ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              Salidas (Ventas)
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Buscar movimiento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '32px', fontSize: '0.8rem', padding: '6px 10px 6px 32px' }}
            />
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '110px' }}>Fecha</th>
              <th style={{ width: '110px' }}>Tipo</th>
              <th>Producto & SKU</th>
              <th style={{ textAlign: 'right' }}>Cantidad</th>
              <th style={{ textAlign: 'right' }}>Precio/Costo</th>
              <th style={{ textAlign: 'right' }}>Monto Total</th>
              <th style={{ textAlign: 'right' }}>Utilidad</th>
              <th>Referencia / Doc</th>
              <th>Cliente o Proveedor</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No se registran movimientos con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filteredMovements.map((m) => {
                const isEntrada = m.type === 'ENTRADA';

                return (
                  <tr key={m.id}>
                    {/* Date */}
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(m.date)}
                    </td>

                    {/* Type Badge */}
                    <td>
                      {isEntrada ? (
                        <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                          <ArrowDownLeft size={12} /> ENTRADA
                        </span>
                      ) : (
                        <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                          <ArrowUpRight size={12} /> VENTA
                        </span>
                      )}
                    </td>

                    {/* Product */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.85rem' }}>{m.product_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m.sku}</div>
                    </td>

                    {/* Quantity */}
                    <td style={{ textAlign: 'right', fontWeight: 700, color: isEntrada ? 'var(--emerald-success)' : 'var(--text-main)' }}>
                      {isEntrada ? `+${formatNumber(m.quantity)}` : `-${formatNumber(m.quantity)}`} u.
                    </td>

                    {/* Unit Price / Cost */}
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {formatCurrency(isEntrada ? m.unit_cost : m.unit_price)}
                    </td>

                    {/* Total Amount */}
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f8fafc' }}>
                      {formatCurrency(m.total_amount)}
                    </td>

                    {/* Gross Profit */}
                    <td style={{ textAlign: 'right' }}>
                      {isEntrada ? (
                        <span style={{ color: 'var(--text-faint)', fontSize: '0.75rem' }}>-</span>
                      ) : (
                        <span style={{ fontWeight: 700, color: 'var(--emerald-success)', fontSize: '0.85rem' }}>
                          +{formatCurrency(m.gross_profit)}
                        </span>
                      )}
                    </td>

                    {/* Reference */}
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {m.reference || '-'}
                    </td>

                    {/* Party Name */}
                    <td style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                      {m.party_name || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
