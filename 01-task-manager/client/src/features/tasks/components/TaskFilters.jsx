import Button from "../../../components/ui/Button.jsx";
import Select from "../../../components/ui/Select.jsx";
import {
  PRIORITY_FILTER_OPTIONS,
  SORT_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "../utils/taskHelpers.js";
import styles from "./TaskFilters.module.css";

const ORDER_OPTIONS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

/**
 * Renders task filter and sort controls.
 *
 * @param {object} props - Component props.
 * @param {object} props.filters - Current filter state.
 * @param {Function} props.onFilterChange - Filter update callback.
 * @param {Function} props.onReset - Reset callback.
 */
function TaskFilters({ filters, onFilterChange, onReset }) {
  /**
   * Sends select changes up to the page state.
   *
   * @param {React.ChangeEvent<HTMLSelectElement>} event - Select change event.
   */
  function handleSelectChange(event) {
    onFilterChange(event.target.name, event.target.value);
  }

  return (
    <section aria-label="Task filters" className={styles.filters}>
      <Select
        label="Status"
        name="status"
        onChange={handleSelectChange}
        options={STATUS_FILTER_OPTIONS}
        value={filters.status}
      />
      <Select
        label="Priority"
        name="priority"
        onChange={handleSelectChange}
        options={PRIORITY_FILTER_OPTIONS}
        value={filters.priority}
      />
      <Select
        label="Sort"
        name="sort"
        onChange={handleSelectChange}
        options={SORT_OPTIONS}
        value={filters.sort}
      />
      <Select
        label="Order"
        name="order"
        onChange={handleSelectChange}
        options={ORDER_OPTIONS}
        value={filters.order}
      />
      <div className={styles.action}>
        <Button onClick={onReset} variant="secondary">
          Clear
        </Button>
      </div>
    </section>
  );
}

export default TaskFilters;
