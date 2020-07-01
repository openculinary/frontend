import 'jquery';

import { getRecipe } from '../common';
import { db } from '../database';
import { updateStarState } from '../views/components/recipe-list';

export { starRecipe, unstarRecipe };

function starRecipe() {
  var recipe = getRecipe(this);

  db.starred.add({recipe_id: recipe.id});

  updateStarState(recipe.id);
}

function unstarRecipe() {
  var recipe = getRecipe(this);

  db.starred.delete(recipe.id);

  updateStarState(recipe.id);
}
