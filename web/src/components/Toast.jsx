import { useEffect, useState } from 'react';

/**
 * Toast notification system
 * Usage: addToast('Message', 'success' | 'error' | 'info')
 */

let _addToast = null;

export function addToast(message, type = 'info') {
  if (_addToast) _addToast(message, type);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _addToast = (message, type) => {
      const id = Date.now();
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 3500);
    };
    return () => { _addToast = null; };
  }, []);

  const iconMap = { success: '✅', error: '❌', info: 'ℹ️' };

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{iconMap[t.type]}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
