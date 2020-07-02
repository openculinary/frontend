import { db } from '../database';

export { starRecipe, unstarRecipe };

async function starRecipe(recipe) {
  return db.starred.add({recipe_id: recipe.id}).then(() => recipe.id);
}

async function unstarRecipe(recipe) {
  return db.starred.delete(recipe.id).then(() => recipe.id);
}
