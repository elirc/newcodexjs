import { Button } from "../../../components/ui/Button";
import styles from "../../../App.module.css";
import type { Provider, Service, Slot } from "../../../types";

interface BookingConfirmationProps {
  provider?: Provider;
  service?: Service;
  slot?: Slot;
  notes: string;
  onNotesChange: (value: string) => void;
  onConfirm: () => void;
  isSaving: boolean;
}

/** Shows the final booking summary before creating an appointment. */
export function BookingConfirmation({ provider, service, slot, notes, onNotesChange, onConfirm, isSaving }: BookingConfirmationProps): JSX.Element {
  return (
    <section className={styles.panel}>
      <h2>Confirm appointment</h2>
      <p>
        {provider?.name} - {service?.name} - {slot ? new Date(slot.startTime).toLocaleString() : "Pick a time"}
      </p>
      <textarea className={styles.textarea} placeholder="Notes for the provider" value={notes} onChange={(event) => onNotesChange(event.target.value)} />
      <Button disabled={!slot || isSaving} onClick={onConfirm}>
        {isSaving ? "Booking..." : "Confirm booking"}
      </Button>
    </section>
  );
}
