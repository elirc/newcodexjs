import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { createRecipe, fetchCategories } from '../services/recipes';
import type { Category } from '../types/recipe';
import styles from './Pages.module.css';

/** Provides a compact multi-section recipe creation form for details, ingredients, steps, and review. */
export function CreateRecipePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredientText, setIngredientText] = useState('2 cups vegetables\n1 tbsp olive oil');
  const [stepText, setStepText] = useState('Prep ingredients\nCook and season\nServe warm');
  const [categoryIds, setCategoryIds] = useState<number[]>([]);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const recipe = await createRecipe({
      title,
      description,
      difficulty: 'medium',
      isPublic: true,
      servings: 4,
      ingredients: ingredientText.split('\n').map((line) => ({ name: line })),
      steps: stepText.split('\n').map((instruction) => ({ instruction })),
      categoryIds
    });
    navigate(`/recipes/${recipe.id}`);
  }

  return (
    <form className={styles.formWide} onSubmit={submit}>
      <h1>Create Recipe</h1>
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Recipe title" />
      <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description" />
      <label>Ingredients, one per line</label>
      <textarea value={ingredientText} onChange={(event) => setIngredientText(event.target.value)} />
      <label>Steps, one per line</label>
      <textarea value={stepText} onChange={(event) => setStepText(event.target.value)} />
      <div className={styles.tags}>
        {categories.map((category) => (
          <label key={category.id}>
            <input
              type="checkbox"
              checked={categoryIds.includes(category.id)}
              onChange={(event) =>
                setCategoryIds((current) => event.target.checked ? [...current, category.id] : current.filter((id) => id !== category.id))
              }
            />
            {category.name}
          </label>
        ))}
      </div>
      <Button>Create recipe</Button>
    </form>
  );
}
