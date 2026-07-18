import styles from "../../../App.module.css";
import type { Appointment } from "../../../types";

/** Renders a simple month-style agenda grid for provider calendar learning. */
export function CalendarMonthView({ appointments }: { appointments: Appointment[] }): JSX.Element {
  const grouped = appointments.reduce<Record<string, Appointment[]>>((days, appointment) => {
    const key = appointment.start_time.slice(0, 10);
    days[key] = [...(days[key] ?? []), appointment];
    return days;
  }, {});

  return (
    <div className={styles.calendarGrid}>
      {Object.entries(grouped).map(([date, items]) => (
        <section className={styles.card} key={date}>
          <strong>{date}</strong>
          {items.map((item) => (
            <p key={item.id}>
              {new Date(item.start_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} {item.service_name}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
