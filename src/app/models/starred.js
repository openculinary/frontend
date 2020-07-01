import { getRecipe } from '../common';
import { db } from '../database';
import { updateStarState } from '../views/components/recipe-list';

export { starRecipe, unstarRecipe };

function starRecipe() {
  getRecipe(this).then(recipe => {
    db.starred.add({recipe_id: recipe.id});
    updateStarState(recipe.id);
  });
}

function unstarRecipe() {
  getRecipe(this).then(recipe => {
    db.starred.delete(recipe.id);
    updateStarState(recipe.id);
  });
}
