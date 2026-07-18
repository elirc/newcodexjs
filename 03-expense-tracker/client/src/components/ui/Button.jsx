import styles from "./Button.module.css";

/**
 * Renders a reusable button.
 * @param {object} props Component props.
 * @returns {JSX.Element}
 */
export function Button({ children, variant = "primary", ...props }) {
  return <button className={`${styles.button} ${styles[variant]}`} {...props}>{children}</button>;
}
