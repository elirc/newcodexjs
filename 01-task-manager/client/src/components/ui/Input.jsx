import { useId } from "react";
import { classNames } from "../../utils/classNames.js";
import styles from "./Input.module.css";

/**
 * Renders a labeled text input or textarea with validation messaging.
 *
 * @param {object} props - Component props.
 * @param {string} [props.label] - Field label.
 * @param {string} [props.error] - Validation message.
 * @param {boolean} [props.multiline] - Whether to render a textarea.
 * @param {string} [props.className] - Additional wrapper class names.
 */
function Input({ label, error, multiline = false, className = "", id, name, ...props }) {
  const generatedId = useId();
  const inputId = id || name || generatedId;
  const Control = multiline ? "textarea" : "input";

  return (
    <label className={classNames(styles.field, className)} htmlFor={inputId}>
      {label && <span className={styles.label}>{label}</span>}
      <Control
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={classNames(styles.control, multiline && styles.textarea)}
        id={inputId}
        name={name}
        {...props}
      />
      {error && (
        <span className={styles.error} id={`${inputId}-error`}>
          {error}
        </span>
      )}
    </label>
  );
}

export default Input;
