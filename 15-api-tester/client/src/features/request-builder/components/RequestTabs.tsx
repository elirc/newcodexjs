import styles from "../../../App.module.css";
import type { RequestDraft } from "../../../types";

/** Renders open request tabs and their dirty indicators. */
export function RequestTabs({ tabs, activeIndex, onSelect, onAdd }: { tabs: RequestDraft[]; activeIndex: number; onSelect: (index: number) => void; onAdd: () => void }): JSX.Element {
  return (
    <div className={styles.tabs}>
      {tabs.map((tab, index) => (
        <button className={`${styles.tab} ${index === activeIndex ? styles.tabActive : ""}`} key={`${tab.name}-${index}`} onClick={() => onSelect(index)}>
          {tab.dirty ? "● " : ""}
          <span className={`${styles.method} ${styles[tab.method]}`}>{tab.method}</span>
          {tab.name}
        </button>
      ))}
      <button className={`${styles.button} ${styles.ghost}`} onClick={onAdd}>
        New
      </button>
    </div>
  );
}
