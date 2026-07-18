import styles from "../../../App.module.css";
import type { Slot } from "../../../types";

interface TimeSlotGridProps {
  slots: Slot[];
  selected?: string;
  onSelect: (slot: Slot) => void;
}

/** Renders selectable slots returned by the backend slot algorithm. */
export function TimeSlotGrid({ slots, selected, onSelect }: TimeSlotGridProps): JSX.Element {
  if (!slots.length) return <p className={styles.muted}>No slots are available for this date.</p>;
  return (
    <div className={styles.slotGrid}>
      {slots.map((slot) => (
        <button className={`${styles.slot} ${selected === slot.startTime ? styles.slotSelected : ""}`} key={slot.startTime} onClick={() => onSelect(slot)}>
          {slot.label}
        </button>
      ))}
    </div>
  );
}
