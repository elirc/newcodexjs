import { Button } from "../../../components/ui/Button";
import styles from "../../../App.module.css";
import type { Appointment } from "../../../types";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";

/** Renders appointment rows for customer or provider dashboards. */
export function AppointmentList({ appointments, onCancel }: { appointments: Appointment[]; onCancel?: (id: number) => void }): JSX.Element {
  if (!appointments.length) return <p className={styles.muted}>No appointments found.</p>;
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>When</th>
          <th>With</th>
          <th>Service</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {appointments.map((appointment) => (
          <tr key={appointment.id}>
            <td>{new Date(appointment.start_time).toLocaleString()}</td>
            <td>{appointment.provider_name ?? appointment.customer_name ?? "Customer"}</td>
            <td>{appointment.service_name}</td>
            <td>
              <AppointmentStatusBadge status={appointment.status} />
            </td>
            <td>{onCancel && appointment.status === "confirmed" ? <Button onClick={() => onCancel(appointment.id)}>Cancel</Button> : null}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
