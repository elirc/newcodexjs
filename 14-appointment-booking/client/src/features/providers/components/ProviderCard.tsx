import { Link } from "react-router-dom";
import styles from "../../../App.module.css";
import type { Provider } from "../../../types";

/** Displays one provider in the browse grid. */
export function ProviderCard({ provider }: { provider: Provider }): JSX.Element {
  return (
    <article className={styles.card}>
      <div className={styles.row}>
        <h2>{provider.name}</h2>
        <span className={styles.badge}>{provider.specialty}</span>
      </div>
      <p className={styles.muted}>{provider.bio}</p>
      <p>{provider.service_count ?? 0} active services</p>
      <Link className={styles.button} to={`/providers/${provider.id}`}>
        View profile
      </Link>
    </article>
  );
}
