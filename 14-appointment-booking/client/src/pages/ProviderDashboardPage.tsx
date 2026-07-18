import { useQuery } from "@tanstack/react-query";
import styles from "../App.module.css";
import { AppointmentList } from "../features/appointments/components/AppointmentList";
import { CalendarMonthView } from "../features/calendar/components/CalendarMonthView";
import { fetchProviderAppointments, fetchProviderDashboard } from "../services/api";

/** Renders provider schedule, status counts, and a compact calendar overview. */
export function ProviderDashboardPage(): JSX.Element {
  const dashboard = useQuery({ queryKey: ["provider-dashboard"], queryFn: fetchProviderDashboard });
  const appointments = useQuery({ queryKey: ["provider-appointments"], queryFn: fetchProviderAppointments });

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Provider dashboard</h1>
      </header>
      <section className={styles.grid}>
        {dashboard.data?.stats.map((stat) => (
          <article className={styles.card} key={stat.status}>
            <span className={styles.badge}>{stat.status.replaceAll("_", " ")}</span>
            <h2>{stat.count}</h2>
          </article>
        ))}
      </section>
      <section className={styles.panel}>
        <h2>Today</h2>
        <AppointmentList appointments={dashboard.data?.today ?? []} />
      </section>
      <section className={styles.panel}>
        <h2>Calendar overview</h2>
        <CalendarMonthView appointments={appointments.data ?? []} />
      </section>
    </>
  );
}
