import { getRecipe } from '../common';
import { db } from '../database';

export { removeMeal };

function removeMeal() {
  getRecipe(this).then(recipe => { db.meals.delete(recipe.mealId); });
}
