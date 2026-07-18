import styles from "./TaskStats.module.css";

/**
 * Renders the task status counts shown above the task list.
 *
 * @param {object} props - Component props.
 * @param {{ todo: number, in_progress: number, done: number, total: number }} props.stats - Task counts.
 */
function TaskStats({ stats }) {
  return (
    <section aria-label="Task stats" className={styles.stats}>
      <div className={styles.item}>
        <span className={styles.value}>{stats.todo}</span>
        <span className={styles.label}>todo</span>
      </div>
      <span className={styles.separator}>&middot;</span>
      <div className={styles.item}>
        <span className={styles.value}>{stats.in_progress}</span>
        <span className={styles.label}>in progress</span>
      </div>
      <span className={styles.separator}>&middot;</span>
      <div className={styles.item}>
        <span className={styles.value}>{stats.done}</span>
        <span className={styles.label}>done</span>
      </div>
    </section>
  );
}

export default TaskStats;
