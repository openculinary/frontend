import { packageVersion, types } from 'document';

import { db } from '../database';

export { starRecipe, unstarRecipe };

async function starRecipe(recipe: types.Recipe) : Promise<string> {
  const starred = new types.Starred(recipe.id, packageVersion);
  return db.starred.add(starred).then(() => recipe.id);
}

async function unstarRecipe(recipe: types.Recipe) : Promise<string> {
  return db.starred.delete(recipe.id).then(() => recipe.id);
}
