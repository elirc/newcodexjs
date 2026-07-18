import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { Button } from './components/ui/Button';
import { useAuth } from './context/AuthContext';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { CreateRecipePage } from './pages/CreateRecipePage';
import { HomePage } from './pages/HomePage';
import { MyRecipesPage } from './pages/MyRecipesPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import styles from './App.module.css';

/** Protects pages that require a signed-in user. */
function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Checking session...</p>;
  return user ? children : <Navigate to="/login" replace />;
}

/** Renders the recipe manager routes and auth-aware navigation. */
export function App() {
  const { user, logout } = useAuth();
  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <Link className={styles.brand} to="/">Recipe Manager</Link>
        <div className={styles.navLinks}>
          <Link to="/">Browse</Link>
          {user && <Link to="/mine">My Recipes</Link>}
          {user && <Link to="/favorites">Favorites</Link>}
          {user && <Link to="/recipes/new">Create</Link>}
          {user ? <Button variant="ghost" onClick={logout}>Logout {user.username}</Button> : <Link to="/login">Login</Link>}
        </div>
      </nav>
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/recipes/new" element={<Protected><CreateRecipePage /></Protected>} />
          <Route path="/mine" element={<Protected><MyRecipesPage /></Protected>} />
          <Route path="/favorites" element={<Protected><MyRecipesPage mode="favorites" /></Protected>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>
    </div>
  );
}
