import { Link } from "react-router-dom";
import styles from "../../../App.module.css";
import type { Service } from "../../../types";

/** Lists services with duration, price, and booking entry points. */
export function ServiceList({ providerId, services = [] }: { providerId: number; services?: Service[] }): JSX.Element {
  return (
    <div className={styles.grid}>
      {services.map((service) => (
        <article className={styles.card} key={service.id}>
          <div className={styles.row}>
            <h3>{service.name}</h3>
            <span className={styles.badge}>{service.duration_minutes} min</span>
          </div>
          <p className={styles.muted}>{service.description}</p>
          <strong>${Number(service.price).toFixed(2)}</strong>
          <div>
            <Link className={styles.button} to={`/book/${providerId}/${service.id}`}>
              Book
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
