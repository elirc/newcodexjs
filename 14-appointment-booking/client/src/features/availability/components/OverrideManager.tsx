import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import styles from "../../../App.module.css";

/** Captures a date-specific unavailable override for vacations or holidays. */
export function OverrideManager({ onCreate }: { onCreate: (input: { override_date: string; is_unavailable: boolean; reason?: string }) => void }): JSX.Element {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  return (
    <section className={styles.panel}>
      <h2>Availability overrides</h2>
      <div className={styles.row}>
        <input className={styles.input} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <input className={styles.input} placeholder="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
        <Button disabled={!date} onClick={() => onCreate({ override_date: date, is_unavailable: true, reason })}>
          Block date
        </Button>
      </div>
    </section>
  );
}
