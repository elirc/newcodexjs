import styles from "../../../App.module.css";
import type { RequestDraft } from "../../../types";

/** Renders bearer and basic auth configuration. */
export function AuthEditor({ auth, onChange }: { auth: RequestDraft["auth"]; onChange: (auth: RequestDraft["auth"]) => void }): JSX.Element {
  return (
    <div className={styles.panel}>
      <select className={styles.select} value={auth.type} onChange={(event) => onChange({ type: event.target.value as RequestDraft["auth"]["type"] })}>
        <option value="none">No auth</option>
        <option value="bearer">Bearer token</option>
        <option value="basic">Basic auth</option>
      </select>
      {auth.type === "bearer" ? <input className={styles.input} placeholder="Token or {{apiKey}}" value={auth.token ?? ""} onChange={(event) => onChange({ ...auth, token: event.target.value })} /> : null}
      {auth.type === "basic" ? (
        <div className={styles.row}>
          <input className={styles.input} placeholder="Username" value={auth.username ?? ""} onChange={(event) => onChange({ ...auth, username: event.target.value })} />
          <input className={styles.input} placeholder="Password" type="password" value={auth.password ?? ""} onChange={(event) => onChange({ ...auth, password: event.target.value })} />
        </div>
      ) : null}
    </div>
  );
}
