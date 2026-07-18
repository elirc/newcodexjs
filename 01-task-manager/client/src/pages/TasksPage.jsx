import { useMemo, useState } from "react";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Modal from "../components/ui/Modal.jsx";
import TaskFilters from "../features/tasks/components/TaskFilters.jsx";
import TaskForm from "../features/tasks/components/TaskForm.jsx";
import TaskList from "../features/tasks/components/TaskList.jsx";
import TaskStats from "../features/tasks/components/TaskStats.jsx";
import { DEFAULT_TASK_FILTERS, useTasks } from "../features/tasks/hooks/useTasks.js";
import { applyTaskFilters } from "../features/tasks/utils/taskHelpers.js";
import styles from "./TasksPage.module.css";

/**
 * Renders the main task management workspace.
 */
function TasksPage() {
  const {
    tasks,
    stats,
    filters,
    isLoading,
    isSaving,
    error,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
    updateFilter,
    resetFilters,
    refreshTasks,
  } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const visibleTasks = useMemo(() => applyTaskFilters(tasks, filters), [filters, tasks]);
  const hasActiveFilters = useMemo(() => {
    return Object.entries(DEFAULT_TASK_FILTERS).some(([key, value]) => filters[key] !== value);
  }, [filters]);

  /**
   * Opens the modal in create mode.
   */
  function openCreateModal() {
    setEditingTask(null);
    setIsModalOpen(true);
  }

  /**
   * Opens the modal for an existing task.
   *
   * @param {object} task - Task to edit.
   */
  function openEditModal(task) {
    setEditingTask(task);
    setIsModalOpen(true);
  }

  /**
   * Closes the modal and clears the active task.
   */
  function closeModal() {
    setIsModalOpen(false);
    setEditingTask(null);
  }

  /**
   * Creates or updates a task from submitted form data.
   *
   * @param {object} payload - API-ready task payload.
   */
  async function handleFormSubmit(payload) {
    if (editingTask) {
      await updateTask(editingTask.id, payload);
    } else {
      await createTask(payload);
    }

    closeModal();
  }

  /**
   * Toggles completion for the selected task.
   *
   * @param {number | string} taskId - Task identifier.
   */
  async function handleToggleTask(taskId) {
    await toggleTask(taskId);
  }

  /**
   * Confirms and deletes the selected task.
   *
   * @param {number | string} taskId - Task identifier.
   */
  async function handleDeleteTask(taskId) {
    if (window.confirm("Delete this task?")) {
      await deleteTask(taskId);
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.toolbar}>
        <div>
          <p className={styles.count}>{stats.total} total tasks</p>
          <h2 className={styles.heading}>Plan, sort, and finish the right work.</h2>
        </div>
        <Button onClick={openCreateModal} variant="primary">
          New task
        </Button>
      </section>

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <Button onClick={refreshTasks} size="small" variant="secondary">
            Retry
          </Button>
        </div>
      )}

      <TaskStats stats={stats} />
      <TaskFilters filters={filters} onFilterChange={updateFilter} onReset={resetFilters} />

      {!isLoading && tasks.length === 0 ? (
        <EmptyState
          actionLabel="New task"
          message="Start with one clear next step and build from there."
          onAction={openCreateModal}
          title="No tasks yet"
        />
      ) : !isLoading && visibleTasks.length === 0 ? (
        <EmptyState
          actionLabel={hasActiveFilters ? "Clear filters" : undefined}
          message="Nothing matches the current status, priority, and sort settings."
          onAction={hasActiveFilters ? resetFilters : undefined}
          title="No matching tasks"
        />
      ) : (
        <TaskList
          isLoading={isLoading}
          onDelete={handleDeleteTask}
          onEdit={openEditModal}
          onToggle={handleToggleTask}
          tasks={visibleTasks}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTask ? "Edit task" : "Create task"}
      >
        <TaskForm
          isSaving={isSaving}
          onCancel={closeModal}
          onSubmit={handleFormSubmit}
          task={editingTask}
        />
      </Modal>
    </div>
  );
}

export default TasksPage;
