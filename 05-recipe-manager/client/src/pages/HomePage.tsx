import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { fetchCategories, fetchRecipes, toggleFavorite } from '../services/recipes';
import type { Category, Recipe } from '../types/recipe';
import { useAuth } from '../context/AuthContext';
import styles from './Pages.module.css';

/** Shows public recipe discovery with search, category filter, and favorite toggles. */
export function HomePage() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  useEffect(() => {
    fetchRecipes({ search, category }).then(setRecipes);
  }, [search, category]);

  async function onFavorite(recipe: Recipe) {
    const result = await toggleFavorite(recipe.id);
    setRecipes((items) => items.map((item) => (item.id === recipe.id ? { ...item, is_favorite: result.isFavorite } : item)));
  }

  return (
    <section className={styles.stack}>
      <div className={styles.toolbar}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search recipes" />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>{item.name}</option>
          ))}
        </select>
      </div>
      <div className={styles.grid}>
        {recipes.map((recipe) => (
          <article key={recipe.id} className={styles.card}>
            {recipe.image_url && <img src={recipe.image_url} alt="" />}
            <div className={styles.cardBody}>
              <span className={styles.badge}>{recipe.difficulty}</span>
              <h2><Link to={`/recipes/${recipe.id}`}>{recipe.title}</Link></h2>
              <p>{recipe.description}</p>
              <small>{recipe.prep_time_minutes ?? 0 + (recipe.cook_time_minutes ?? 0)} min · {recipe.author_name}</small>
              {user && <Button variant="ghost" onClick={() => onFavorite(recipe)}>{recipe.is_favorite ? 'Favorited' : 'Favorite'}</Button>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
