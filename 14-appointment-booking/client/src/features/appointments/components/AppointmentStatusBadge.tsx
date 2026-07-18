import styles from "../../../App.module.css";

/** Displays an appointment status in a scannable badge. */
export function AppointmentStatusBadge({ status }: { status: string }): JSX.Element {
  return <span className={styles.badge}>{status.replaceAll("_", " ")}</span>;
}
