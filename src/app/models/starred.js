import 'jquery';

import { getRecipe } from '../common';
import { db } from '../database';
import { storage } from '../storage';
import { updateStarState } from '../views/components/recipe-list';

export { starRecipe, unstarRecipe };

function starRecipe() {
  var recipe = getRecipe(this);

  storage.starred.add({'hashCode': recipe.id, 'value': recipe});
  db.starred.add({recipe_id: recipe.id});

  updateStarState(recipe.id);
}

function unstarRecipe() {
  var recipe = getRecipe(this);

  storage.starred.remove({'hashCode': recipe.id});
  db.starred.delete(recipe.id);

  updateStarState(recipe.id);
}
