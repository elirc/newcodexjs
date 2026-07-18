import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "../App.module.css";
import { BookingConfirmation } from "../features/booking/components/BookingConfirmation";
import { DatePicker } from "../features/booking/components/DatePicker";
import { TimeSlotGrid } from "../features/booking/components/TimeSlotGrid";
import { bookAppointment, fetchProvider, fetchSlots } from "../services/api";
import type { Slot } from "../types";

/** Renders the date, slot, and confirmation steps for booking. */
export function BookingPage(): JSX.Element {
  const providerId = Number(useParams().providerId);
  const serviceId = Number(useParams().serviceId);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState<Slot>();
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();
  const provider = useQuery({ queryKey: ["provider", providerId], queryFn: () => fetchProvider(providerId) });
  const slots = useQuery({ queryKey: ["slots", providerId, serviceId, date], queryFn: () => fetchSlots(providerId, serviceId, date), enabled: Boolean(providerId && serviceId && date) });
  const service = useMemo(() => provider.data?.services?.find((item) => item.id === serviceId), [provider.data, serviceId]);
  const booking = useMutation({
    mutationFn: () => bookAppointment({ providerId, serviceId, startTime: slot!.startTime, notes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-appointments"] })
  });

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>Book {service?.name ?? "service"}</h1>
          <p className={styles.muted}>Select a date and one available slot. Slot conflicts are checked again on submit.</p>
        </div>
      </header>
      <section className={styles.panel}>
        <DatePicker value={date} onChange={(value) => { setDate(value); setSlot(undefined); }} />
      </section>
      <section className={styles.panel}>
        <TimeSlotGrid slots={slots.data ?? []} selected={slot?.startTime} onSelect={setSlot} />
      </section>
      <BookingConfirmation provider={provider.data} service={service} slot={slot} notes={notes} onNotesChange={setNotes} onConfirm={() => booking.mutate()} isSaving={booking.isPending} />
      {booking.isSuccess ? <p className={styles.badge}>Appointment booked</p> : null}
      {booking.isError ? <p className={styles.muted}>Booking failed. The slot may have just been taken.</p> : null}
    </>
  );
}
