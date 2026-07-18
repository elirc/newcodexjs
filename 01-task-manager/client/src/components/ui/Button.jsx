import { classNames } from "../../utils/classNames.js";
import styles from "./Button.module.css";

/**
 * Renders a consistent action button with task-manager variants.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Button content.
 * @param {"primary" | "secondary" | "ghost" | "danger"} [props.variant] - Visual variant.
 * @param {"small" | "medium"} [props.size] - Button size.
 * @param {boolean} [props.isLoading] - Whether to show the loading state.
 * @param {string} [props.className] - Additional class names.
 */
function Button({
  children,
  variant = "primary",
  size = "medium",
  isLoading = false,
  className = "",
  disabled = false,
  type = "button",
  ...props
}) {
  return (
    <button
      className={classNames(
        styles.button,
        styles[variant],
        styles[size],
        isLoading && styles.loading,
        className,
      )}
      disabled={isLoading || disabled}
      type={type}
      {...props}
    >
      {isLoading ? "Saving" : children}
    </button>
  );
}

export default Button;
