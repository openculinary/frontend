import 'jquery';

import { getRecipe } from '../common';
import { storage } from '../storage';

export { removeMeal };

function removeMeal() {
  var meals = storage.meals.load();
  var recipe = getRecipe(this);

  var date = $(this).parents('tr').data('date');
  var index = meals[date].map(function(recipe) { return recipe.id; }).indexOf(recipe.id);

  if (index >= 0) meals[date].splice(index, 1);
  if (!meals[date].length) delete meals[date];

  storage.meals.remove({'hashCode': date});
  if (date in meals) storage.meals.add({'hashCode': date, 'value': meals[date]});
}
