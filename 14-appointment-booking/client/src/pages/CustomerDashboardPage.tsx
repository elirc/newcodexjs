import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import styles from "../App.module.css";
import { AppointmentList } from "../features/appointments/components/AppointmentList";
import { cancelAppointment, fetchMyAppointments } from "../services/api";

/** Renders upcoming and past appointments for the development customer. */
export function CustomerDashboardPage(): JSX.Element {
  const queryClient = useQueryClient();
  const appointments = useQuery({ queryKey: ["my-appointments"], queryFn: fetchMyAppointments });
  const cancel = useMutation({
    mutationFn: (id: number) => cancelAppointment(id, "Cancelled from customer dashboard"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-appointments"] })
  });

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>My appointments</h1>
      </header>
      <section className={styles.panel}>
        <AppointmentList appointments={appointments.data ?? []} onCancel={(id) => cancel.mutate(id)} />
      </section>
    </>
  );
}
