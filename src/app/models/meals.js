import 'jquery';

import { getRecipe } from '../common';
import { db } from '../database';

export { removeMeal };

function removeMeal() {
  var recipe = getRecipe(this);
  db.meals.delete(recipe.mealId);
}
