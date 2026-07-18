import { useMemo } from "react";
import styles from "../../../App.module.css";
import type { Environment } from "../../../types";

/** Renders environment switching and active variable chips. */
export function EnvironmentSelector({ environments, activeId, onActivate }: { environments: Environment[]; activeId?: number; onActivate: (id: number) => void }): JSX.Element {
  const active = useMemo(() => environments.find((environment) => environment.id === activeId) ?? environments.find((environment) => environment.is_active), [environments, activeId]);

  return (
    <div className={styles.row}>
      <select className={styles.select} style={{ maxWidth: 220 }} value={active?.id ?? ""} onChange={(event) => onActivate(Number(event.target.value))}>
        {environments.map((environment) => (
          <option key={environment.id} value={environment.id}>
            {environment.name}
          </option>
        ))}
      </select>
      <span className={styles.muted}>
        {active?.variables.map((variable) => `${variable.key}=${variable.is_secret ? "*****" : variable.value}`).join("  ")}
      </span>
    </div>
  );
}
