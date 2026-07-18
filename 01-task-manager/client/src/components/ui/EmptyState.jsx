import Button from "./Button.jsx";
import styles from "./EmptyState.module.css";

/**
 * Shows an empty-state panel with an optional primary action.
 *
 * @param {object} props - Component props.
 * @param {string} props.title - Empty-state title.
 * @param {string} props.message - Empty-state supporting text.
 * @param {string} [props.actionLabel] - Optional action text.
 * @param {Function} [props.onAction] - Optional action callback.
 */
function EmptyState({ title, message, actionLabel, onAction }) {
  return (
    <section className={styles.empty}>
      <div aria-hidden="true" className={styles.mark}>
        +
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </section>
  );
}

export default EmptyState;
