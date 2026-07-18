import type { ButtonHTMLAttributes } from "react";
import styles from "../../App.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

/** Renders the shared button style used across the appointment UI. */
export function Button({ variant = "primary", className = "", ...props }: ButtonProps): JSX.Element {
  return <button className={`${styles.button} ${variant === "ghost" ? styles.ghostButton : ""} ${className}`} {...props} />;
}
