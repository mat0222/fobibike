import { useState } from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

export default function DeleteConfirmModal({ product, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!product) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el producto');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Eliminar producto</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <FiX size={22} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-red-100 rounded-full shrink-0">
              <FiAlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-slate-700">
                Estas seguro de eliminar este producto? Esta accion no se puede deshacer.
              </p>
              <p className="mt-2 text-sm font-mono text-slate-500">{product.code}</p>
              <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
