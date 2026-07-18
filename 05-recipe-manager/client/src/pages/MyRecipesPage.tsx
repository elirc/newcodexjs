import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchFavorites, fetchMine } from '../services/recipes';
import type { Recipe } from '../types/recipe';
import styles from './Pages.module.css';

/** Lists the current user's own recipes or favorites depending on the mode prop. */
export function MyRecipesPage({ mode = 'mine' }: { mode?: 'mine' | 'favorites' }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    (mode === 'mine' ? fetchMine() : fetchFavorites()).then(setRecipes);
  }, [mode]);

  return (
    <section className={styles.stack}>
      <h1>{mode === 'mine' ? 'My Recipes' : 'Favorites'}</h1>
      <div className={styles.grid}>
        {recipes.map((recipe) => (
          <article className={styles.card} key={recipe.id}>
            <div className={styles.cardBody}>
              <h2><Link to={`/recipes/${recipe.id}`}>{recipe.title}</Link></h2>
              <p>{recipe.description}</p>
              <span className={styles.badge}>{recipe.is_public ? 'public' : 'private'}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
