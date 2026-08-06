import {
  AlertTriangle,
  X,
} from "lucide-react";

import "./ConfirmDialog.css";

export default function ConfirmDialog({
  open,
  eyebrow = "Confirmação",
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isProcessing = false,
  onConfirm,
  onClose,
}) {
  if (!open) {
    return null;
  }

  function handleBackdropClick() {
    if (!isProcessing) {
      onClose();
    }
  }

  return (
    <div
      className="confirm-dialog-backdrop"
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <article
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <header className="confirm-dialog-header">
          <span
            className="confirm-dialog-icon"
            aria-hidden="true"
          >
            <AlertTriangle size={24} />
          </span>

          <button
            type="button"
            className="confirm-dialog-close"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Fechar confirmação"
          >
            <X size={20} />
          </button>
        </header>

        <div className="confirm-dialog-content">
          <span className="confirm-dialog-eyebrow">
            {eyebrow}
          </span>

          <h2 id="confirm-dialog-title">
            {title}
          </h2>

          <p>{message}</p>
        </div>

        <footer className="confirm-dialog-actions">
          <button
            type="button"
            className="confirm-dialog-cancel"
            onClick={onClose}
            disabled={isProcessing}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className="confirm-dialog-confirm"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing
              ? "Aguarde..."
              : confirmLabel}
          </button>
        </footer>
      </article>
    </div>
  );
}