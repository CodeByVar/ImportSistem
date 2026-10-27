import React, { useState } from 'react';
import { 
  Ship, 
  Truck,
  Anchor, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileSpreadsheet,
  Plus,
  Trash2,
  ArrowRight,
  UserCheck,
  Package
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';

export default function ContainersSection({ 
  containers = [], 
  onNewContainer,
  onOpenPrelista,
  onDeleteContainer
}) {
  const [filterType, setFilterType] = useState('all'); // 'all', 'maritimo', 'terrestre', 'transito', 'recibido'

  // Status badge config
  const getStatusBadge = (c) => {
    switch (c.status) {
      case 'mar_transito':
        return { class: 'badge-cyan', text: '🌊 En Altamar', icon: Ship };
      case 'puerto_aduana':
      case 'aduana':
        return { class: 'badge-amber', text: '⚓ En Puerto / Aduana', icon: Anchor };
      case 'camion_transito':
        return { class: 'badge-purple', text: '🚛 En Camión (Ruta)', icon: Truck };
      case 'aduana_frontera':
        return { class: 'badge-amber', text: '🛂 En Aduana Frontera', icon: AlertCircle };
      case 'recibido':
        return { class: 'badge-emerald', text: '✅ Recibido en Bodega', icon: CheckCircle2 };
      default:
        return { class: 'badge-cyan', text: 'En Tránsito', icon: Ship };
    }
  };

  // Filter logic
  const filteredContainers = containers.filter(c => {
    if (filterType === 'maritimo') return c.transport_type !== 'TERRESTRE';
    if (filterType === 'terrestre') return c.transport_type === 'TERRESTRE';
    if (filterType === 'transito') return c.status !== 'recibido';
    if (filterType === 'recibido') return c.status === 'recibido';
    return true;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cyan-primary)'
          }}>
            <Ship size={22} />
          </div>
          <div>
            <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              Seguimiento de Embarques, Contenedores & Camiones
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Control logístico multimodal: Barco desde China ➔ Puerto ➔ Camión ➔ Prelistas & Pre-Reservas
            </p>
          </div>
        </div>

        <button 
          onClick={onNewContainer}
          className="btn btn-primary"
          style={{ fontSize: '0.82rem', padding: '9px 18px' }}
        >
          <Plus size={16} />
          <span>+ Registrar Nuevo Embarque / Camión</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '20px',
        borderBottom: '1px solid var(--border-glass)',
        paddingBottom: '12px'
      }}>
        {[
          { id: 'all', label: `Todos (${containers.length})` },
          { id: 'maritimo', label: '🚢 Marítimos (China + Puerto)' },
          { id: 'terrestre', label: '🚛 Camiones Directos' },
          { id: 'transito', label: '🌊 En Camino / Tránsito' },
          { id: 'recibido', label: '✅ En Bodega' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: filterType === tab.id ? 'var(--cyan-primary)' : 'rgba(15, 23, 42, 0.6)',
              color: filterType === tab.id ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Container Cards */}
      {filteredContainers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Ship size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
          <p>No hay embarques o camiones registrados en este filtro.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {filteredContainers.map((c) => {
            const isMaritimo = c.transport_type !== 'TERRESTRE';
            const statusBadge = getStatusBadge(c);
            const StatusIcon = statusBadge.icon;

            const totalItems = c.total_items || 0;
            const totalBoxes = c.total_boxes || 0;
            const reservedBoxes = c.total_reserved_boxes || 0;

            return (
              <div 
                key={c.id}
                style={{
                  background: 'rgba(12, 18, 34, 0.85)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Top Bar: Mode & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: isMaritimo ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: isMaritimo ? '#38bdf8' : '#fbbf24',
                          border: `1px solid ${isMaritimo ? 'rgba(6, 182, 212, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                        }}>
                          {isMaritimo ? '🚢 MARÍTIMO + CAMIÓN' : '🚛 CAMIÓN DIRECTO'}
                        </span>
                      </div>
                      <span className="mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', display: 'block', marginTop: '4px', letterSpacing: '0.04em' }}>
                        {c.tracking_number}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {c.shipping_line}
                      </div>
                    </div>

                    <span className={`badge ${statusBadge.class}`} style={{ fontSize: '0.74rem', padding: '4px 10px' }}>
                      <StatusIcon size={12} /> {statusBadge.text}
                    </span>
                  </div>

                  {/* Route & Transport Flow */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '14px',
                    fontSize: '0.76rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1', marginBottom: '4px' }}>
                      <MapPin size={13} color="var(--cyan-primary)" />
                      <span>Origen: <strong style={{ color: '#f8fafc' }}>{c.origin_country}</strong></span>
                    </div>

                    {isMaritimo ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span>🌊 Barco</span>
                        <ArrowRight size={11} />
                        <span style={{ color: '#38bdf8' }}>⚓ {c.port_name || 'Puerto Arica'}</span>
                        <ArrowRight size={11} />
                        <span style={{ color: '#fbbf24' }}>🚛 {c.truck_plate ? `Camión: ${c.truck_plate}` : 'Camión por asignar'}</span>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🚛 Camión Terrestre</span>
                        <ArrowRight size={11} />
                        <span style={{ color: '#fbbf24' }}>{c.truck_plate || 'Directo a Bodega'}</span>
                      </div>
                    )}
                  </div>

                  {/* Prelista & Reservas Badge */}
                  <div style={{
                    background: totalItems > 0 ? 'rgba(6, 182, 212, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                    border: totalItems > 0 ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid rgba(244, 63, 94, 0.25)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    marginBottom: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FileSpreadsheet size={13} color={totalItems > 0 ? 'var(--cyan-primary)' : '#fb7185'} />
                        <span>Prelista de Mercadería:</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc', marginTop: '2px' }}>
                        {totalItems > 0 ? (
                          <>
                            <span>{totalItems} productos</span>
                            <span style={{ color: 'var(--cyan-primary)', marginLeft: '6px' }}>({formatNumber(totalBoxes)} cajas)</span>
                          </>
                        ) : (
                          <span style={{ color: '#fb7185', fontStyle: 'italic', fontSize: '0.78rem' }}>Sin prelista cargada</span>
                        )}
                      </div>
                    </div>

                    {totalItems > 0 && reservedBoxes > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                          <UserCheck size={11} /> {reservedBoxes} cj reservadas
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Financial Values if defined */}
                  {(c.total_fob > 0 || c.total_freight > 0) && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      fontSize: '0.74rem',
                      marginBottom: '14px',
                      color: 'var(--text-muted)'
                    }}>
                      <div>
                        <span>FOB: </span>
                        <strong style={{ color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{formatCurrency(c.total_fob)}</strong>
                      </div>
                      <div>
                        <span>Flete+Aduana: </span>
                        <strong style={{ color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(c.total_freight + c.total_taxes)}</strong>
                      </div>
                    </div>
                  )}

                  {c.notes && (
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '14px' }}>
                      "{c.notes}"
                    </p>
                  )}
                </div>

                {/* Footer Actions & Dates */}
                <div>
                  <div style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '12px',
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span>Salida: {c.departure_date ? formatDate(c.departure_date) : '-'}</span>
                    <span>
                      {c.status === 'recibido' 
                        ? `Llegada: ${formatDate(c.actual_arrival || c.estimated_arrival)}` 
                        : `Estimada: ${formatDate(c.estimated_arrival)}`}
                    </span>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                    <button
                      onClick={() => onOpenPrelista && onOpenPrelista(c)}
                      className="btn btn-primary"
                      style={{
                        fontSize: '0.78rem',
                        padding: '8px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <FileSpreadsheet size={15} />
                      <span>{totalItems > 0 ? 'Ver Prelista & Reservas' : 'Cargar Prelista (Excel)'}</span>
                    </button>

                    {onDeleteContainer && (
                      <button
                        onClick={() => onDeleteContainer(c.id)}
                        className="btn btn-secondary"
                        style={{ padding: '8px', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)' }}
                        title="Eliminar este embarque"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
