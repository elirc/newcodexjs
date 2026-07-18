import styles from "../../../App.module.css";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
}

/** Renders a compact date picker for the booking flow. */
export function DatePicker({ value, onChange }: DatePickerProps): JSX.Element {
  return <input className={styles.input} type="date" value={value} min={new Date().toISOString().slice(0, 10)} onChange={(event) => onChange(event.target.value)} />;
}
