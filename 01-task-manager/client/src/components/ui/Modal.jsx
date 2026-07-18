import { useEffect } from "react";
import { createPortal } from "react-dom";
import Button from "./Button.jsx";
import styles from "./Modal.module.css";

/**
 * Renders modal content in a portal with backdrop and Escape handling.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the modal is visible.
 * @param {string} props.title - Modal heading.
 * @param {React.ReactNode} props.children - Modal body content.
 * @param {Function} props.onClose - Close callback.
 */
function Modal({ isOpen, title, children, onClose }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    /** Closes the modal when the Escape key is pressed. */
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    /** Removes the document key listener when the modal is dismissed. */
    function removeKeyListener() {
      document.removeEventListener("keydown", handleKeyDown);
    }

    document.addEventListener("keydown", handleKeyDown);
    return removeKeyListener;
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  /**
   * Closes only when the pointer starts on the backdrop itself.
   *
   * @param {React.MouseEvent<HTMLDivElement>} event - Mouse event from the backdrop.
   */
  function handleBackdropMouseDown(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return createPortal(
    <div className={styles.backdrop} onMouseDown={handleBackdropMouseDown}>
      <section aria-modal="true" className={styles.dialog} role="dialog">
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <Button aria-label="Close modal" onClick={onClose} size="small" variant="ghost">
            Close
          </Button>
        </header>
        <div className={styles.body}>{children}</div>
      </section>
    </div>,
    document.body,
  );
}

export default Modal;
