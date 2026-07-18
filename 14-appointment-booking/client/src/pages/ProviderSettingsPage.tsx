import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import styles from "../App.module.css";
import { OverrideManager } from "../features/availability/components/OverrideManager";
import { WeeklyScheduleEditor } from "../features/availability/components/WeeklyScheduleEditor";
import { fetchAvailability, fetchOwnServices, saveAvailability, createOverride } from "../services/api";

/** Renders provider settings for services, weekly availability, and overrides. */
export function ProviderSettingsPage(): JSX.Element {
  const queryClient = useQueryClient();
  const availability = useQuery({ queryKey: ["availability"], queryFn: fetchAvailability });
  const services = useQuery({ queryKey: ["own-services"], queryFn: fetchOwnServices });
  const saveSlots = useMutation({ mutationFn: saveAvailability, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["availability"] }) });
  const addOverride = useMutation({ mutationFn: createOverride });

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Provider settings</h1>
      </header>
      <section className={styles.panel}>
        <h2>Services</h2>
        <div className={styles.grid}>
          {services.data?.map((service) => (
            <article className={styles.card} key={service.id}>
              <h3>{service.name}</h3>
              <p>{service.duration_minutes} minutes - ${Number(service.price).toFixed(2)}</p>
            </article>
          ))}
        </div>
      </section>
      <WeeklyScheduleEditor slots={availability.data ?? []} onSave={(slots) => saveSlots.mutate(slots)} />
      <OverrideManager onCreate={(input) => addOverride.mutate(input)} />
    </>
  );
}
