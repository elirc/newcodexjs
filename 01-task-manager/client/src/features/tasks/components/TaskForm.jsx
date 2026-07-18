import { useEffect, useState } from "react";
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  buildTaskPayload,
  validateTaskInput,
} from "../utils/taskHelpers.js";
import styles from "./TaskForm.module.css";

/**
 * Builds form state from an optional task.
 *
 * @param {object | null} task - Task being edited.
 * @returns {object} Form values.
 */
function getInitialValues(task) {
  return {
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    status: task?.status || "todo",
    due_date: task?.due_date ? String(task.due_date).slice(0, 10) : "",
  };
}

/**
 * Returns tomorrow as a date input string for the minimum selectable date.
 *
 * @returns {string} Date input value.
 */
function getTomorrowDateInputValue() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString().slice(0, 10);
}

/**
 * Renders the create and edit form used in the task modal.
 *
 * @param {object} props - Component props.
 * @param {object | null} props.task - Task being edited.
 * @param {Function} props.onSubmit - Submit callback.
 * @param {Function} props.onCancel - Cancel callback.
 * @param {boolean} props.isSaving - Whether a save is in progress.
 */
function TaskForm({ task, onSubmit, onCancel, isSaving }) {
  const [values, setValues] = useState(() => getInitialValues(task));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setValues(getInitialValues(task));
    setErrors({});
    setFormError("");
  }, [task]);

  /**
   * Updates one form field from a native control change.
   *
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>} event - Field change event.
   */
  function handleChange(event) {
    const { name, value } = event.target;

    setFormError("");
    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  }

  /**
   * Validates and submits the current form values.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Form submit event.
   */
  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateTaskInput(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await onSubmit(buildTaskPayload(values));
    } catch (submitError) {
      setFormError(submitError.message || "Unable to save task");
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {formError && (
        <div className={styles.formError} role="alert">
          {formError}
        </div>
      )}
      <Input
        autoFocus
        error={errors.title}
        label="Title"
        name="title"
        onChange={handleChange}
        placeholder="Write a task title"
        value={values.title}
      />
      <Input
        label="Description"
        multiline
        name="description"
        onChange={handleChange}
        placeholder="Add details"
        value={values.description}
      />
      <div className={styles.grid}>
        <Select
          label="Priority"
          name="priority"
          onChange={handleChange}
          options={PRIORITY_OPTIONS}
          value={values.priority}
        />
        <Select
          label="Status"
          name="status"
          onChange={handleChange}
          options={STATUS_OPTIONS}
          value={values.status}
        />
      </div>
      <Input
        error={errors.due_date}
        label="Due date"
        min={getTomorrowDateInputValue()}
        name="due_date"
        onChange={handleChange}
        type="date"
        value={values.due_date}
      />
      <div className={styles.actions}>
        <Button onClick={onCancel} type="button" variant="secondary">
          Cancel
        </Button>
        <Button isLoading={isSaving} type="submit" variant="primary">
          {task ? "Save task" : "Create task"}
        </Button>
      </div>
    </form>
  );
}

export default TaskForm;
