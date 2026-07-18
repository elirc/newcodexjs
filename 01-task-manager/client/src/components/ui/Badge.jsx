import { classNames } from "../../utils/classNames.js";
import styles from "./Badge.module.css";

/**
 * Displays a compact status or priority label with semantic color.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Badge content.
 * @param {"default" | "todo" | "in_progress" | "done" | "low" | "medium" | "high" | "overdue"} [props.tone] - Badge tone.
 */
function Badge({ children, tone = "default" }) {
  return <span className={classNames(styles.badge, styles[tone])}>{children}</span>;
}

export default Badge;
