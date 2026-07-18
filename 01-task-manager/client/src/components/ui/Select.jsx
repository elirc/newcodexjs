import { useId } from "react";
import styles from "./Select.module.css";

/**
 * Renders a labeled select control from a simple options array.
 *
 * @param {object} props - Component props.
 * @param {string} [props.label] - Field label.
 * @param {{ value: string, label: string }[]} props.options - Selectable options.
 * @param {string} [props.error] - Validation message.
 */
function Select({ label, options, error, id, name, ...props }) {
  const generatedId = useId();
  const selectId = id || name || generatedId;

  return (
    <label className={styles.field} htmlFor={selectId}>
      {label && <span className={styles.label}>{label}</span>}
      <select
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className={styles.control}
        id={selectId}
        name={name}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span className={styles.error} id={`${selectId}-error`}>
          {error}
        </span>
      )}
    </label>
  );
}

export default Select;
