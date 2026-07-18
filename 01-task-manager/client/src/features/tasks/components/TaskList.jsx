import TaskCard from "./TaskCard.jsx";
import styles from "./TaskList.module.css";

/**
 * Renders task cards or loading placeholders.
 *
 * @param {object} props - Component props.
 * @param {object[]} props.tasks - Tasks to render.
 * @param {boolean} props.isLoading - Whether tasks are loading.
 * @param {Function} props.onToggle - Toggle completion callback.
 * @param {Function} props.onEdit - Edit callback.
 * @param {Function} props.onDelete - Delete callback.
 */
function TaskList({ tasks, isLoading, onToggle, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <div aria-label="Loading tasks" className={styles.list}>
        {[0, 1, 2].map((item) => (
          <div className={styles.skeleton} key={item} />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          onDelete={onDelete}
          onEdit={onEdit}
          onToggle={onToggle}
          task={task}
        />
      ))}
    </div>
  );
}

export default TaskList;
