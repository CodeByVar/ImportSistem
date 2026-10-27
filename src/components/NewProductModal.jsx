import React, { useState } from 'react';
import { 
  X, 
  Package, 
  Calculator, 
  DollarSign, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';

export default function NewProductModal({ isOpen, onClose, onProductCreated }) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electrónica');
  const [unit, setUnit] = useState('Unidad');
  const [fobPrice, setFobPrice] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [tariffCost, setTariffCost] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [initialStock, setInitialStock] = useState('0');
  const [minStock, setMinStock] = useState('20');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Landed Cost calculations
  const fob = parseFloat(fobPrice || 0) || 0;
  const shipping = parseFloat(shippingCost || 0) || 0;
  const tariff = parseFloat(tariffCost || 0) || 0;
  const landedCost = fob + shipping + tariff;

  const sale = parseFloat(salePrice || 0) || 0;
  const marginDollar = sale - landedCost;
  const marginPercent = sale > 0 ? (marginDollar / sale) * 100 : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!sku.trim() || !name.trim()) {
      setErrorMessage('SKU y Nombre del producto son obligatorios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: sku.trim().toUpperCase(),
          name: name.trim(),
          category,
          unit,
          fob_price: fob,
          shipping_cost: shipping,
          tariff_cost: tariff,
          sale_price: sale,
          current_stock: parseInt(initialStock, 10) || 0,
          min_stock: parseInt(minStock, 10) || 10,
          supplier: supplier.trim(),
          notes
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Error al guardar producto');
      }

      if (onProductCreated) {
        onProductCreated();
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--indigo-brand)'
            }}>
              <Package size={20} />
            </div>
            <div>
              <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                Nuevo Producto & Costeo Landed
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Calculadora de costo de importación aterrizado y margen comercial
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px', border: 'none' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* SKU & Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label className="form-label">Código SKU *</label>
              <input
                type="text"
                className="form-input mono"
                placeholder="IMP-XXX-01"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Nombre del Producto *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. Foco Proyector Solar 300W..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Category & Unit & Supplier */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label className="form-label">Categoría</label>
              <input
                type="text"
                className="form-input"
                placeholder="Electrónica, Ferretería..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Unidad Medida</label>
              <select className="form-select" value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="Unidad">Unidad</option>
                <option value="Caja">Caja</option>
                <option value="Kit">Kit / Set</option>
                <option value="Rollo">Rollo</option>
                <option value="Pack">Pack</option>
              </select>
            </div>
            <div>
              <label className="form-label">Proveedor / Fábrica</label>
              <input
                type="text"
                className="form-input"
                placeholder="Shenzhen Co. / USA"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>
          </div>

          {/* COSTING SECTION (LANDED COST CALCULATOR) */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Calculator size={16} color="var(--cyan-primary)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Desglose de Costo de Importación (Landed Cost)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Costo FOB Fábrica ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                  value={fobPrice}
                  onChange={(e) => setFobPrice(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Flete Unitario ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Arancel + Aduana ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                  value={tariffCost}
                  onChange={(e) => setTariffCost(e.target.value)}
                />
              </div>
            </div>

            {/* Total Landed Cost & Selling Price */}
            <div style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Costo Landed Total:</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(landedCost)}
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--cyan-primary)' }}>Precio Venta ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  required
                />
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Margen Ganancia:</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: marginDollar >= 0 ? 'var(--emerald-success)' : '#fb7185' }}>
                  {formatCurrency(marginDollar)} ({formatPercent(marginPercent)})
                </div>
              </div>
            </div>
          </div>

          {/* Stocks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label className="form-label">Stock Inicial en Bodega</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Alerta Stock Mínimo</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.82rem',
              color: '#fb7185'
            }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ padding: '10px 24px' }}
            >
              {isSubmitting ? 'Guardando en BD...' : 'Crear Producto en Catálogo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
