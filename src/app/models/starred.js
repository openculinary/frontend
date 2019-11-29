import 'jquery';

import { getRecipe } from '../common';
import { storage } from '../storage';
import { updateStarState } from '../ui/recipe-list';

export { starRecipe, unstarRecipe };

function starRecipe() {
  var recipe = getRecipe(this);

  storage.starred.add({'hashCode': recipe.id, 'value': recipe});
  updateStarState(recipe.id);

  RecipeRadar.countly.add_event('starRecipe');
}

function unstarRecipe() {
  var recipe = getRecipe(this);

  storage.starred.remove({'hashCode': recipe.id});
  updateStarState(recipe.id);
}
