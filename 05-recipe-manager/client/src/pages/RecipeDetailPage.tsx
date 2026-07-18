import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchRecipe } from '../services/recipes';
import type { Recipe } from '../types/recipe';
import styles from './Pages.module.css';

/** Displays a full recipe with ingredients, steps, metadata, and categories. */
export function RecipeDetailPage() {
  const { id = '' } = useParams();
  const [recipe, setRecipe] = useState<Recipe>();

  useEffect(() => {
    fetchRecipe(id).then(setRecipe);
  }, [id]);

  if (!recipe) return <p>Loading recipe...</p>;

  return (
    <article className={styles.detail}>
      <Link to="/">Back to recipes</Link>
      <h1>{recipe.title}</h1>
      <p>{recipe.description}</p>
      {recipe.image_url && <img src={recipe.image_url} alt="" />}
      <div className={styles.meta}>
        <span>{recipe.difficulty}</span>
        <span>{recipe.servings ?? 'Flexible'} servings</span>
        <span>{(recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)} min total</span>
      </div>
      <h2>Ingredients</h2>
      <ul>{recipe.ingredients?.map((item) => <li key={item.id}>{item.quantity} {item.unit} {item.name}</li>)}</ul>
      <h2>Steps</h2>
      <ol>{recipe.steps?.map((step) => <li key={step.id}>{step.instruction}</li>)}</ol>
    </article>
  );
}
