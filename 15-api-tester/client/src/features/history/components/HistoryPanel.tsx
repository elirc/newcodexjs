import styles from "../../../App.module.css";
import type { HistoryEntry } from "../../../types";

/** Renders recent request history with method, status, and timing. */
export function HistoryPanel({ entries }: { entries: HistoryEntry[] }): JSX.Element {
  return (
    <div>
      {entries.map((entry) => (
        <div className={styles.treeItem} key={entry.id}>
          <span className={`${styles.method} ${styles[entry.method]}`}>{entry.method}</span>
          <div>{entry.url}</div>
          <small className={styles.muted}>
            {entry.response_status ?? "ERR"} - {entry.response_time_ms ?? 0} ms - {new Date(entry.created_at).toLocaleString()}
          </small>
        </div>
      ))}
    </div>
  );
}
