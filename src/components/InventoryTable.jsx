import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  ArrowDownLeft, 
  ArrowUpRight,
  Package,
  Layers,
  Tag,
  Building2,
  FileText
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

export default function InventoryTable({ 
  products = [], 
  onOpenNewMovement, 
  onEditProduct,
  initialFilter = 'all'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [stockStatusFilter, setStockStatusFilter] = useState(initialFilter); // 'all', 'critical', 'healthy'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Get unique brands and categories
  const brands = ['Todas', ...new Set(products.map(p => p.brand).filter(Boolean))];
  const categories = ['Todas', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Filter products
  const filteredProducts = products.filter(p => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = 
      (p.name && p.name.toLowerCase().includes(s)) ||
      (p.sku && p.sku.toLowerCase().includes(s)) ||
      (p.supplier && p.supplier.toLowerCase().includes(s)) ||
      (p.brand && p.brand.toLowerCase().includes(s)) ||
      (p.warehouse && p.warehouse.toLowerCase().includes(s)) ||
      (p.customs_policy && p.customs_policy.toLowerCase().includes(s));

    const matchesBrand = selectedBrand === 'Todas' || p.brand === selectedBrand;
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;

    let matchesStock = true;
    if (stockStatusFilter === 'critical') {
      matchesStock = p.current_stock <= p.min_stock;
    } else if (stockStatusFilter === 'healthy') {
      matchesStock = p.current_stock > p.min_stock;
    }

    return matchesSearch && matchesBrand && matchesCategory && matchesStock;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleBrandChange = (val) => {
    setSelectedBrand(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (val) => {
    setSelectedCategory(val);
    setCurrentPage(1);
  };

  const handleStockFilterChange = (val) => {
    setStockStatusFilter(val);
    setCurrentPage(1);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['SKU', 'Producto', 'Marca', 'Categoria', 'Bodega', 'Poliza', 'Cajas', 'Unid_x_Caja', 'Costo_FOB_USD', 'Arancel_Pct', 'Costo_Landed_USD', 'Precio_Mayor_Bs', 'Precio_Caja_Bs', 'Precio_Especial_Bs', 'Stock_Actual', 'Capital_USD'];
    const rows = filteredProducts.map(p => [
      `"${p.sku}"`,
      `"${p.name}"`,
      `"${p.brand || 'UYUSTOOLS'}"`,
      `"${p.category}"`,
      `"${p.warehouse || 'CASA CUBANO'}"`,
      `"${p.customs_policy || ''}"`,
      p.boxes_count || 0,
      p.units_per_box || 1,
      p.fob_price || 0,
      p.tariff_cost || 0,
      p.landed_cost || 0,
      p.wholesale_price || p.sale_price || 0,
      p.box_price || 0,
      p.special_price || 0,
      p.current_stock || 0,
      p.capital_usd || ((p.landed_cost || 0) * (p.current_stock || 0)).toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SISCONTROL_Inventario_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
      {/* Title & Controls */}
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
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--emerald-success)'
          }}>
            <Package size={22} />
          </div>
          <div>
            <h3 className="font-heading" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Catálogo de Inventario Multi-Marca
              <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>
                {products.length.toLocaleString()} Productos
              </span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Control físico por cajas y sueltas, bodegas, costos FOB, márgenes y listas de precios al por mayor
            </p>
          </div>
        </div>

        {/* Export Button */}
        <button 
          onClick={handleExportCSV}
          className="btn btn-secondary"
          style={{ fontSize: '0.82rem', padding: '8px 16px', gap: '8px' }}
        >
          <Download size={15} />
          <span>Exportar a Excel (.csv)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '20px',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por código SKU, detalle, bodega o póliza..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Brand Filter */}
        {brands.length > 2 && (
          <div style={{ minWidth: '170px' }}>
            <select 
              className="form-select"
              value={selectedBrand}
              onChange={(e) => handleBrandChange(e.target.value)}
              style={{ fontWeight: 600, color: 'var(--cyan-primary)' }}
            >
              {brands.map(b => (
                <option key={b} value={b}>Marca: {b}</option>
              ))}
            </select>
          </div>
        )}

        {/* Category Filter */}
        <div style={{ minWidth: '180px' }}>
          <select 
            className="form-select"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>Rubro: {cat}</option>
            ))}
          </select>
        </div>

        {/* Stock Status Filter */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '10px',
          padding: '3px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => handleStockFilterChange('all')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              borderRadius: '8px',
              border: 'none',
              background: stockStatusFilter === 'all' ? 'var(--cyan-primary)' : 'transparent',
              color: stockStatusFilter === 'all' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            Todos ({products.length})
          </button>
          <button
            onClick={() => handleStockFilterChange('critical')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              borderRadius: '8px',
              border: 'none',
              background: stockStatusFilter === 'critical' ? 'var(--rose-danger)' : 'transparent',
              color: stockStatusFilter === 'critical' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            Stock Crítico
          </button>
          <button
            onClick={() => handleStockFilterChange('healthy')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              borderRadius: '8px',
              border: 'none',
              background: stockStatusFilter === 'healthy' ? 'var(--emerald-success)' : 'transparent',
              color: stockStatusFilter === 'healthy' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            Stock Saludable
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU / Código</th>
              <th>Producto & Marca / Bodega</th>
              <th>Rubro</th>
              <th style={{ textAlign: 'right' }}>Costo FOB ($)</th>
              <th style={{ textAlign: 'right' }}>Costo Neto Landed ($)</th>
              <th style={{ textAlign: 'right' }}>Precio Mayor (Bs)</th>
              <th style={{ textAlign: 'right' }}>Precio Caja (Bs)</th>
              <th style={{ textAlign: 'right' }}>Precio Especial (Bs)</th>
              <th style={{ width: '190px' }}>Stock Físico & Disp.</th>
              <th style={{ width: '220px' }}>📦 Reservas (Cajas / Cliente)</th>
              <th style={{ textAlign: 'center', width: '90px' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No se encontraron productos con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              paginatedProducts.map((p) => {
                const reservedUnits = Number(p.total_reserved_units) || 0;
                const reservedBoxes = Number(p.total_reserved_boxes) || 0;
                const availUnits = Math.max(0, (Number(p.current_stock) || 0) - reservedUnits);
                const availBoxes = Math.max(0, (Number(p.boxes_count) || 0) - reservedBoxes);

                const isCritical = availUnits <= (p.min_stock || 0);
                const isOutOfStock = availUnits <= 0;
                const stockRatio = p.min_stock > 0 ? Math.min((availUnits / (p.min_stock * 2)) * 100, 100) : 50;
                const mayorPrice = p.wholesale_price || p.sale_price;

                return (
                  <tr key={p.id}>
                    {/* SKU */}
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--cyan-primary)' }}>
                      {p.sku}
                    </td>

                    {/* Name, Brand & Warehouse / Policy */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.88rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '3px' }}>
                        <span style={{ color: 'var(--indigo-brand)', fontWeight: 600 }}>🏷️ {p.brand || 'UYUSTOOLS'}</span>
                        <span>📍 {p.warehouse || 'CASA CUBANO'}</span>
                        {p.customs_policy && <span style={{ color: 'var(--emerald-success)' }}>📄 {p.customs_policy}</span>}
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>
                        {p.category}
                      </span>
                    </td>

                    {/* FOB Price */}
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      ${Number(p.fob_price || 0).toFixed(2)}
                    </td>

                    {/* Landed Cost ($) */}
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f8fafc' }}>
                      ${Number(p.landed_cost || p.fob_price || 0).toFixed(2)}
                    </td>

                    {/* Sale Price - Wholesale (Bs) */}
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8', fontSize: '0.9rem' }}>
                      Bs {Number(mayorPrice || 0).toFixed(2)}
                    </td>

                    {/* Box Price (Bs) */}
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: p.box_price > 0 ? '#34d399' : 'var(--text-muted)' }}>
                      {p.box_price > 0 ? `Bs ${Number(p.box_price).toFixed(2)}` : '-'}
                    </td>

                    {/* Special Price (Bs) */}
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: p.special_price > 0 ? '#fbbf24' : 'var(--text-muted)' }}>
                      {p.special_price > 0 ? `Bs ${Number(p.special_price).toFixed(2)}` : '-'}
                    </td>

                    {/* Stock Físico vs Disponible */}
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginBottom: '2px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Físico:</span>
                        <span style={{ fontWeight: 600, color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                          {formatNumber(p.current_stock)} u {p.boxes_count > 0 && <span style={{ color: '#94a3b8' }}>({p.boxes_count} cj)</span>}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', marginBottom: '4px' }}>
                        <span style={{ color: reservedBoxes > 0 ? '#fbbf24' : '#34d399', fontWeight: 600 }}>Disponible:</span>
                        <span style={{ 
                          fontWeight: 800, 
                          color: isOutOfStock ? '#f43f5e' : isCritical ? '#fbbf24' : '#34d399', 
                          fontFamily: 'var(--font-mono)' 
                        }}>
                          {formatNumber(availUnits)} u {p.boxes_count > 0 && <span>({availBoxes} cj)</span>}
                        </span>
                      </div>

                      <div style={{ width: '100%', height: '5px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${stockRatio}%`,
                          height: '100%',
                          background: isOutOfStock ? '#f43f5e' : isCritical ? '#fbbf24' : '#10b981',
                          borderRadius: '999px'
                        }}></div>
                      </div>
                    </td>

                    {/* Columna Reservas (Cajas/Cliente) */}
                    <td>
                      {reservedBoxes > 0 || reservedUnits > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div>
                            <span className="badge badge-amber" style={{ fontSize: '0.72rem', padding: '2px 8px', fontWeight: 700 }}>
                              📌 {reservedBoxes} cjs ({formatNumber(reservedUnits)} u)
                            </span>
                          </div>
                          {p.reserved_clients_summary && (
                            <div 
                              style={{ 
                                fontSize: '0.72rem', 
                                color: '#fbbf24', 
                                lineHeight: '1.25',
                                maxWidth: '210px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }} 
                              title={`Clientes con reserva: ${p.reserved_clients_summary}`}
                            >
                              👤 {p.reserved_clients_summary}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontStyle: 'italic' }}>
                          Sin reservas
                        </span>
                      )}
                    </td>

                    {/* Quick action buttons */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          onClick={() => onOpenNewMovement('ENTRADA', p)}
                          className="btn btn-secondary"
                          style={{ padding: '5px 7px', borderRadius: '6px' }}
                          title="Registrar Entrada / Recepción"
                        >
                          <ArrowDownLeft size={13} color="#34d399" />
                        </button>
                        <button
                          onClick={() => onOpenNewMovement('SALIDA', p)}
                          className="btn btn-secondary"
                          style={{ padding: '5px 7px', borderRadius: '6px' }}
                          title="Registrar Venta / Salida"
                        >
                          <ArrowUpRight size={13} color="#38bdf8" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredProducts.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginTop: '18px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-glass)',
          fontSize: '0.82rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            Mostrando <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> a <strong>{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</strong> de <strong>{filteredProducts.length.toLocaleString()}</strong> productos
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Por página:</span>
              <select
                className="form-select"
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{ padding: '4px 8px', fontSize: '0.78rem', width: 'auto' }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                className="btn btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
              >
                ««
              </button>
              <button
                className="btn btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
              >
                Anterior
              </button>
              <span style={{ padding: '0 6px', fontWeight: 600, color: 'var(--text-main)' }}>
                Página {currentPage} de {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
              >
                Siguiente
              </button>
              <button
                className="btn btn-secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
              >
                »»
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
