import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import styles from "../App.module.css";
import { ServiceList } from "../features/providers/components/ServiceList";
import { fetchProvider } from "../services/api";

/** Renders provider profile details and bookable services. */
export function ProviderPage(): JSX.Element {
  const providerId = Number(useParams().id);
  const provider = useQuery({ queryKey: ["provider", providerId], queryFn: () => fetchProvider(providerId), enabled: Boolean(providerId) });

  if (!provider.data) return <p>Loading provider...</p>;
  return (
    <>
      <section className={styles.panel}>
        <span className={styles.badge}>{provider.data.specialty}</span>
        <h1>{provider.data.name}</h1>
        <p>{provider.data.bio}</p>
        <p className={styles.muted}>Timezone: {provider.data.timezone}. Times are stored in UTC and displayed locally by the browser.</p>
      </section>
      <ServiceList providerId={provider.data.id} services={provider.data.services} />
    </>
  );
}
