import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, Save, AlertCircle, DollarSign, Boxes } from 'lucide-react';

export default function EditProductModal({ isOpen, onClose, product, onProductUpdated }) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    brand: '',
    category: 'General',
    warehouse: 'ALMACEN',
    unit: 'UNI',
    units_per_box: 1,
    min_stock: 10,
    wholesale_price: 0,
    box_price: 0,
    special_price: 0,
    sale_price: 0,
    fob_price: 0,
    shipping_cost: 0,
    tariff_cost: 0,
    supplier: '',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && product) {
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        brand: product.brand || '',
        category: product.category || 'General',
        warehouse: product.warehouse || 'ALMACEN',
        unit: product.unit || 'UNI',
        units_per_box: product.units_per_box || 1,
        min_stock: product.min_stock ?? 10,
        wholesale_price: product.wholesale_price ?? 0,
        box_price: product.box_price ?? 0,
        special_price: product.special_price ?? 0,
        sale_price: product.sale_price ?? 0,
        fob_price: product.fob_price ?? 0,
        shipping_cost: product.shipping_cost ?? 0,
        tariff_cost: product.tariff_cost ?? 0,
        supplier: product.supplier || '',
        notes: product.notes || ''
      });
      setErrorMsg('');
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const landedCost =
    (parseFloat(formData.fob_price) || 0) +
    (parseFloat(formData.shipping_cost) || 0) +
    (parseFloat(formData.tariff_cost) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sku.trim() || !formData.name.trim()) {
      setErrorMsg('El código SKU y el nombre del producto son obligatorios.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }).then(r => r.json());

      if (!res.success) {
        setErrorMsg(res.error || 'No se pudo actualizar el producto');
      } else {
        onProductUpdated && onProductUpdated(res.data);
        onClose();
      }
    } catch (err) {
      setErrorMsg('Error de conexión: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[94dvh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
              <Package size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white m-0 truncate">
                Editar Producto: {product.sku}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 m-0 truncate">
                Actualiza precios mayoristas, empaque, ubicación o costos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Identificación */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="form-label text-[11px]">Código SKU *</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  className="form-input text-xs font-mono font-bold h-10 w-full"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label text-[11px]">Descripción / Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="form-input text-xs font-bold h-10 w-full"
                  required
                />
              </div>
            </div>

            {/* Clasificación & Empaque */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="form-label text-[11px]">Marca</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  className="form-input text-xs h-10 w-full"
                  placeholder="Ej. KAMASA"
                />
              </div>
              <div>
                <label className="form-label text-[11px]">Ubicación</label>
                <select
                  value={formData.warehouse}
                  onChange={e => setFormData({ ...formData, warehouse: e.target.value })}
                  className="form-select text-xs font-bold h-10 w-full"
                >
                  <option value="ALMACEN">ALMACÉN</option>
                  <option value="TIENDA">TIENDA</option>
                  <option value="CASA CUBANO">CASA CUBANO</option>
                  <option value="VILLA PAGADOR">VILLA PAGADOR</option>
                </select>
              </div>
              <div>
                <label className="form-label text-[11px] flex items-center gap-1"><Boxes size={11} /> U/Caja</label>
                <input
                  type="number"
                  min="1"
                  value={formData.units_per_box}
                  onChange={e => setFormData({ ...formData, units_per_box: e.target.value })}
                  className="form-input text-xs font-mono font-bold h-10 w-full"
                />
              </div>
              <div>
                <label className="form-label text-[11px]">Stock Mínimo</label>
                <input
                  type="number"
                  min="0"
                  value={formData.min_stock}
                  onChange={e => setFormData({ ...formData, min_stock: e.target.value })}
                  className="form-input text-xs font-mono font-bold h-10 w-full"
                />
              </div>
            </div>

            {/* Precios de Venta (Bs) */}
            <div className="p-3.5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/80 dark:border-cyan-500/30 space-y-2.5">
              <div className="text-xs font-black text-cyan-700 dark:text-cyan-300 uppercase flex items-center gap-1.5">
                <DollarSign size={14} /> Precios de Venta (Bs)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="form-label text-[11px]">Precio Mayor</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.wholesale_price}
                    onChange={e => setFormData({ ...formData, wholesale_price: e.target.value })}
                    className="form-input text-xs font-mono font-black h-10 w-full"
                  />
                </div>
                <div>
                  <label className="form-label text-[11px]">Precio Caja</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.box_price}
                    onChange={e => setFormData({ ...formData, box_price: e.target.value })}
                    className="form-input text-xs font-mono font-black h-10 w-full"
                  />
                </div>
                <div>
                  <label className="form-label text-[11px]">Precio Especial</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.special_price}
                    onChange={e => setFormData({ ...formData, special_price: e.target.value })}
                    className="form-input text-xs font-mono font-black h-10 w-full"
                  />
                </div>
                <div>
                  <label className="form-label text-[11px]">Precio Lista</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sale_price}
                    onChange={e => setFormData({ ...formData, sale_price: e.target.value })}
                    className="form-input text-xs font-mono font-black h-10 w-full"
                  />
                </div>
              </div>
            </div>

            {/* Costos de Importación (Confidencial Admin) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-200 uppercase">
                <span>Costos de Importación (Confidencial)</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  Landed: Bs {landedCost.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="form-label text-[11px]">Costo FOB</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.fob_price}
                    onChange={e => setFormData({ ...formData, fob_price: e.target.value })}
                    className="form-input text-xs font-mono h-10 w-full"
                  />
                </div>
                <div>
                  <label className="form-label text-[11px]">Flete / Envío</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.shipping_cost}
                    onChange={e => setFormData({ ...formData, shipping_cost: e.target.value })}
                    className="form-input text-xs font-mono h-10 w-full"
                  />
                </div>
                <div>
                  <label className="form-label text-[11px]">Aranceles / Aduana</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tariff_cost}
                    onChange={e => setFormData({ ...formData, tariff_cost: e.target.value })}
                    className="form-input text-xs font-mono h-10 w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold justify-center cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary py-2.5 px-5 rounded-xl text-xs sm:text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save size={15} />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

