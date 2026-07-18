import AppLayout from "./layouts/AppLayout.jsx";
import TasksPage from "./pages/TasksPage.jsx";

/**
 * Renders the root application screen for the task manager.
 */
function App() {
  return (
    <AppLayout>
      <TasksPage />
    </AppLayout>
  );
}

export default App;
