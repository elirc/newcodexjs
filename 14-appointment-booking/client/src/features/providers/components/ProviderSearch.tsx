import styles from "../../../App.module.css";

interface ProviderSearchProps {
  value: string;
  onChange: (value: string) => void;
}

/** Renders the provider search field for name, bio, or specialty discovery. */
export function ProviderSearch({ value, onChange }: ProviderSearchProps): JSX.Element {
  return <input className={styles.input} placeholder="Search providers or specialties" value={value} onChange={(event) => onChange(event.target.value)} />;
}
