import Badge from "../../../components/ui/Badge.jsx";
import Button from "../../../components/ui/Button.jsx";
import { classNames } from "../../../utils/classNames.js";
import {
  formatCreatedDate,
  formatDueDate,
  getPriorityLabel,
  getStatusLabel,
  isOverdue,
  isTaskComplete,
} from "../utils/taskHelpers.js";
import styles from "./TaskCard.module.css";

/**
 * Renders a single task row with status, priority, due date, and actions.
 *
 * @param {object} props - Component props.
 * @param {object} props.task - Task to render.
 * @param {Function} props.onToggle - Toggle completion callback.
 * @param {Function} props.onEdit - Edit callback.
 * @param {Function} props.onDelete - Delete callback.
 */
function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const complete = isTaskComplete(task);
  const overdue = isOverdue(task);

  /**
   * Sends the current task id to the completion toggle action.
   */
  function handleToggleClick() {
    onToggle(task.id);
  }

  /**
   * Sends the current task to the edit action.
   */
  function handleEditClick() {
    onEdit(task);
  }

  /**
   * Sends the current task id to the delete action.
   */
  function handleDeleteClick() {
    onDelete(task.id);
  }

  return (
    <article
      className={classNames(
        styles.card,
        complete && styles.completed,
        overdue && styles.overdue,
      )}
    >
      <div className={styles.checkColumn}>
        <button
          aria-label={complete ? "Reopen task" : "Mark task complete"}
          className={classNames(styles.check, complete && styles.checked)}
          onClick={handleToggleClick}
          type="button"
        >
          {complete && <span className={styles.checkMark} />}
        </button>
      </div>
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{task.title}</h2>
          <div className={styles.badges}>
            <Badge tone={task.priority}>{getPriorityLabel(task.priority)}</Badge>
            <Badge tone={task.status}>{getStatusLabel(task.status)}</Badge>
            {overdue && <Badge tone="overdue">Overdue</Badge>}
          </div>
        </div>
        {task.description && <p className={styles.description}>{task.description}</p>}
        <div className={styles.meta}>
          <span className={classNames(overdue && styles.dueOverdue)}>
            Due {formatDueDate(task.due_date)}
          </span>
          {formatCreatedDate(task.created_at) && <span>Created {formatCreatedDate(task.created_at)}</span>}
        </div>
      </div>
      <div className={styles.actions}>
        <Button onClick={handleToggleClick} size="small" variant="secondary">
          {complete ? "Reopen" : "Done"}
        </Button>
        <Button onClick={handleEditClick} size="small" variant="ghost">
          Edit
        </Button>
        <Button onClick={handleDeleteClick} size="small" variant="danger">
          Delete
        </Button>
      </div>
    </article>
  );
}

export default TaskCard;
