import { types } from 'document';

import { db } from '../database';

export { starRecipe, unstarRecipe };

async function starRecipe(recipe: types.Recipe) : Promise<string> {
  return db.starred.add({recipe_id: recipe.id}).then(() => recipe.id);
}

async function unstarRecipe(recipe: types.Recipe) : Promise<string> {
  return db.starred.delete(recipe.id).then(() => recipe.id);
}
