import 'jquery';

import { getRecipe } from '../common';
import { db } from '../database';
import { storage } from '../storage';

export { removeMeal };

function removeMeal() {
  var meals = storage.meals.load();
  var recipe = getRecipe(this);

  db.meals.delete(recipe.mealId);

  var date = $(this).parents('tr').data('date');
  if (!meals[date]) return;
  var index = meals[date].map(meal => meal.id).indexOf(recipe.id);

  if (index >= 0) meals[date].splice(index, 1);
  if (!meals[date].length) delete meals[date];

  storage.meals.remove({'hashCode': date});
  if (date in meals) storage.meals.add({'hashCode': date, 'value': meals[date]});
}
