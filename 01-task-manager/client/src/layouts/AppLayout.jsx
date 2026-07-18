import styles from "./AppLayout.module.css";

/**
 * Provides the shared frame for the task manager pages.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Page content to render.
 */
function AppLayout({ children }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <p className={styles.kicker}>Personal Task Manager</p>
            <h1 className={styles.title}>Tasks</h1>
          </div>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}

export default AppLayout;
