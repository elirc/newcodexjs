import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import styles from "../App.module.css";
import { ProviderCard } from "../features/providers/components/ProviderCard";
import { ProviderSearch } from "../features/providers/components/ProviderSearch";
import { fetchProviders } from "../services/api";

/** Renders searchable provider discovery. */
export function BrowseProvidersPage(): JSX.Element {
  const [search, setSearch] = useState("");
  const providers = useQuery({ queryKey: ["providers", search], queryFn: () => fetchProviders(search) });

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>Find a provider</h1>
          <p className={styles.muted}>Search specialties, bios, and provider names.</p>
        </div>
        <ProviderSearch value={search} onChange={setSearch} />
      </header>
      <div className={styles.grid}>{providers.data?.map((provider) => <ProviderCard key={provider.id} provider={provider} />)}</div>
    </>
  );
}
