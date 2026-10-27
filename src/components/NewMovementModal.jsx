import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  DollarSign, 
  Layers, 
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

export default function NewMovementModal({ 
  isOpen, 
  onClose, 
  initialType = 'SALIDA', 
  initialProduct = null,
  products = [],
  containers = [],
  onMovementSuccess 
}) {
  const [movementType, setMovementType] = useState(initialType);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [reference, setReference] = useState('');
  const [partyName, setPartyName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia');
  const [containerId, setContainerId] = useState('');
  const [movementDate, setMovementDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state when opened or props change
  useEffect(() => {
    setMovementType(initialType);
    setErrorMessage('');
    if (initialProduct) {
      setSelectedProductId(initialProduct.id);
      setUnitPrice(initialProduct.sale_price || '');
      setUnitCost(initialProduct.landed_cost || '');
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
      setUnitPrice(products[0].sale_price || '');
      setUnitCost(products[0].landed_cost || '');
    }
  }, [isOpen, initialType, initialProduct, products]);

  const selectedProduct = products.find(p => p.id === Number(selectedProductId));

  // Handle product selection change
  const handleProductChange = (e) => {
    const pId = Number(e.target.value);
    setSelectedProductId(pId);
    const prod = products.find(p => p.id === pId);
    if (prod) {
      setUnitPrice(prod.sale_price);
      setUnitCost(prod.landed_cost);
    }
  };

  if (!isOpen) return null;

  // Live calculations
  const qtyNum = Number(quantity) || 0;
  const priceNum = Number(unitPrice) || 0;
  const costNum = Number(unitCost) || (selectedProduct ? selectedProduct.landed_cost : 0);
  const totalAmount = movementType === 'SALIDA' ? qtyNum * priceNum : qtyNum * costNum;
  const grossProfit = movementType === 'SALIDA' ? (priceNum - costNum) * qtyNum : 0;
  const profitMargin = priceNum > 0 ? ((priceNum - costNum) / priceNum) * 100 : 0;

  const isStockInsufficient = movementType === 'SALIDA' && selectedProduct && qtyNum > selectedProduct.current_stock;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedProductId) {
      setErrorMessage('Por favor selecciona un producto.');
      return;
    }
    if (qtyNum <= 0) {
      setErrorMessage('La cantidad debe ser mayor a cero.');
      return;
    }
    if (isStockInsufficient) {
      setErrorMessage(`Stock insuficiente. Solo tienes ${selectedProduct.current_stock} unidades disponibles.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: Number(selectedProductId),
          type: movementType,
          quantity: qtyNum,
          unit_price: priceNum,
          unit_cost: costNum,
          reference,
          party_name: partyName,
          payment_method: paymentMethod,
          container_id: containerId ? Number(containerId) : null,
          date: movementDate,
          notes
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Error al registrar movimiento');
      }

      if (onMovementSuccess) {
        onMovementSuccess();
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
      <div className="modal-content" style={{ maxWidth: '580px' }}>
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
              background: movementType === 'ENTRADA' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.2)',
              border: `1px solid ${movementType === 'ENTRADA' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(6, 182, 212, 0.4)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: movementType === 'ENTRADA' ? '#34d399' : '#38bdf8'
            }}>
              {movementType === 'ENTRADA' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
            </div>
            <div>
              <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                {movementType === 'ENTRADA' ? 'Registrar Entrada de Mercadería' : 'Registrar Venta / Despacho'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {movementType === 'ENTRADA' 
                  ? 'Recepción de embarque, contenedor o compra que suma al inventario' 
                  : 'Salida de stock a cliente con cálculo en vivo de margen y ganancia'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px', border: 'none' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Movement Type Toggle */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              type="button"
              onClick={() => { setMovementType('SALIDA'); setErrorMessage(''); }}
              className="btn"
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                border: 'none',
                background: movementType === 'SALIDA' ? 'var(--cyan-primary)' : 'transparent',
                color: movementType === 'SALIDA' ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              <ArrowUpRight size={15} /> Venta a Cliente (Salida)
            </button>
            <button
              type="button"
              onClick={() => { setMovementType('ENTRADA'); setErrorMessage(''); }}
              className="btn"
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                border: 'none',
                background: movementType === 'ENTRADA' ? 'var(--emerald-success)' : 'transparent',
                color: movementType === 'ENTRADA' ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              <ArrowDownLeft size={15} /> Recepción de Lote (Entrada)
            </button>
          </div>

          {/* Product Select */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Producto a Movilizar *</label>
              {selectedProduct && (
                <span style={{ fontSize: '0.75rem', color: selectedProduct.current_stock <= selectedProduct.min_stock ? '#fb7185' : '#34d399', fontWeight: 600 }}>
                  Stock Disponible: {selectedProduct.current_stock} {selectedProduct.unit}
                </span>
              )}
            </div>
            <select
              className="form-select"
              value={selectedProductId}
              onChange={handleProductChange}
              required
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name} - Stock: {p.current_stock}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Price Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label className="form-label">Cantidad *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">
                {movementType === 'SALIDA' ? 'Precio de Venta Unitario ($)' : 'Costo Landed Unitario ($)'}
              </label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={movementType === 'SALIDA' ? unitPrice : unitCost}
                onChange={(e) => movementType === 'SALIDA' ? setUnitPrice(e.target.value) : setUnitCost(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Live Calculation Preview Banner */}
          <div style={{
            background: movementType === 'SALIDA' ? 'rgba(6, 182, 212, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            border: `1px solid ${movementType === 'SALIDA' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {movementType === 'SALIDA' ? 'Total Venta' : 'Total Inversión'}
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(totalAmount)}
              </div>
            </div>

            {movementType === 'SALIDA' && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Utilidad Bruta Calculada
                </span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--emerald-success)' }}>
                  +{formatCurrency(grossProfit)} ({formatPercent(profitMargin)})
                </div>
              </div>
            )}
          </div>

          {/* Reference & Party Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label className="form-label">
                {movementType === 'SALIDA' ? 'Cliente / Destino' : 'Proveedor / Origen'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={movementType === 'SALIDA' ? 'Nombre del cliente' : 'Fábrica / Naviera'}
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">N° Factura / Guía / BL</label>
              <input
                type="text"
                className="form-input"
                placeholder="FAC-001 o BL-984..."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Method & Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label className="form-label">Método de Pago</label>
              <select
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Transferencia">Transferencia Bancaria</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta Crédito">Tarjeta de Crédito</option>
                <option value="Crédito 30 días">Crédito Comercial</option>
              </select>
            </div>

            <div>
              <label className="form-label">Fecha del Movimiento</label>
              <input
                type="date"
                className="form-input"
                value={movementDate}
                onChange={(e) => setMovementDate(e.target.value)}
                required
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
              className={movementType === 'SALIDA' ? 'btn btn-primary' : 'btn btn-emerald'}
              disabled={isSubmitting || isStockInsufficient}
              style={{ padding: '10px 24px' }}
            >
              {isSubmitting ? 'Guardando en BD...' : `Confirmar ${movementType}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
