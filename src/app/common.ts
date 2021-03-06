import * as $ from 'jquery';

import { Recipe, db } from './database';

export { getMealId, getRecipe, getRecipeById };

async function getMealId(el: HTMLElement) : Promise<string> {
  const target = $(el).hasClass('recipe') ? $(el) : $(el).parents('.recipe');
  return target.data('meal-id');
}

async function getRecipeById(recipeId: string) : Promise<Recipe> {
  return await db.recipes.get(recipeId, async (recipe: Recipe) => {
    if (recipe) return recipe;
    return await $.ajax({url: `/api/recipes/${recipeId}/view`}).then(hits => {
      if (hits.total === 1) return hits.results[0];
    });
  });
}

async function getRecipe(el: HTMLElement) : Promise<Recipe> {
  let recipe: Recipe = null;
  const target = $(el).hasClass('recipe') ? $(el) : $(el).parents('.recipe');
  const recipeList = $(target).parents('table[data-row-attributes]');
  if (recipeList.length) {
    const index = target.data('index');
    recipe = $(recipeList).bootstrapTable('getData')[index];
  } else {
    const recipeId = target.data('id');
    recipe = await getRecipeById(recipeId);
  }
  return recipe;
}
