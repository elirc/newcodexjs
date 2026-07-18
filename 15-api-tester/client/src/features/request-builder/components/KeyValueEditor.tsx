import styles from "../../../App.module.css";
import type { KeyValuePair } from "../../../types";

/** Renders editable enabled/key/value rows for params and headers. */
export function KeyValueEditor({ rows, onChange }: { rows: KeyValuePair[]; onChange: (rows: KeyValuePair[]) => void }): JSX.Element {
  /** Updates a row in the key-value editor. */
  function update(index: number, values: Partial<KeyValuePair>): void {
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...values } : row)));
  }

  return (
    <div className={styles.panel}>
      <div className={styles.keyValueGrid}>
        {rows.map((row, index) => (
          <div className={styles.keyValueGrid} key={`${row.key}-${index}`} style={{ display: "contents" }}>
            <input type="checkbox" checked={row.enabled !== false} onChange={(event) => update(index, { enabled: event.target.checked })} />
            <input className={styles.input} placeholder="Key" value={row.key} onChange={(event) => update(index, { key: event.target.value })} />
            <input className={styles.input} placeholder="Value" value={row.value} onChange={(event) => update(index, { value: event.target.value })} />
          </div>
        ))}
      </div>
      <button className={`${styles.button} ${styles.ghost}`} onClick={() => onChange([...rows, { key: "", value: "", enabled: true }])}>
        Add row
      </button>
    </div>
  );
}
