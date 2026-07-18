import styles from "../../../App.module.css";
import type { Method } from "../../../types";

const methods: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

/** Renders method selector, URL input, and primary request actions. */
export function UrlBar({ method, url, onMethodChange, onUrlChange, onSend, isSending }: { method: Method; url: string; onMethodChange: (method: Method) => void; onUrlChange: (url: string) => void; onSend: () => void; isSending: boolean }): JSX.Element {
  return (
    <div className={styles.row}>
      <select className={styles.select} style={{ maxWidth: 130 }} value={method} onChange={(event) => onMethodChange(event.target.value as Method)}>
        {methods.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <input className={`${styles.input} ${styles.url}`} placeholder="{{baseUrl}}/posts" value={url} onChange={(event) => onUrlChange(event.target.value)} />
      <button className={styles.button} onClick={onSend} disabled={isSending}>
        {isSending ? "Sending" : "Send"}
      </button>
    </div>
  );
}
