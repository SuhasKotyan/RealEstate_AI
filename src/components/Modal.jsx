import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  title,
  description,
  onClose,
  children,
  wide = false,
  className = '',
}) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog.open) dialog.showModal();
    const cancel = (event) => {
      event.preventDefault();
      closeRef.current();
    };
    dialog.addEventListener('cancel', cancel);
    return () => {
      dialog.removeEventListener('cancel', cancel);
      dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'modal-wide' : ''} ${className}`}
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <header className="modal-header">
        <div>
          <h2 id="modal-title">{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
