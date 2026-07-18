import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import styles from "../../../App.module.css";
import type { AvailabilitySlot } from "../../../types";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Provides editable recurring weekly availability rows. */
export function WeeklyScheduleEditor({ slots, onSave }: { slots: AvailabilitySlot[]; onSave: (slots: AvailabilitySlot[]) => void }): JSX.Element {
  const [draft, setDraft] = useState<AvailabilitySlot[]>(slots);

  useEffect(() => setDraft(slots), [slots]);

  /** Updates one field in the local availability draft. */
  function update(index: number, values: Partial<AvailabilitySlot>): void {
    setDraft((current) => current.map((slot, slotIndex) => (slotIndex === index ? { ...slot, ...values } : slot)));
  }

  return (
    <section className={styles.panel}>
      <div className={styles.row}>
        <h2>Weekly availability</h2>
        <Button variant="ghost" onClick={() => setDraft([...draft, { day_of_week: 1, start_time: "09:00", end_time: "17:00" }])}>
          Add window
        </Button>
      </div>
      <div className={styles.stack}>
        {draft.map((slot, index) => (
          <div className={styles.row} key={`${slot.day_of_week}-${slot.start_time}-${index}`}>
            <select className={styles.select} value={slot.day_of_week} onChange={(event) => update(index, { day_of_week: Number(event.target.value) })}>
              {dayNames.map((day, dayIndex) => (
                <option key={day} value={dayIndex}>
                  {day}
                </option>
              ))}
            </select>
            <input className={styles.input} type="time" value={slot.start_time.slice(0, 5)} onChange={(event) => update(index, { start_time: event.target.value })} />
            <input className={styles.input} type="time" value={slot.end_time.slice(0, 5)} onChange={(event) => update(index, { end_time: event.target.value })} />
          </div>
        ))}
      </div>
      <Button onClick={() => onSave(draft)}>Save availability</Button>
    </section>
  );
}
