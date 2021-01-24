import $ from 'jquery';

import { db } from './database';

export { getRecipe, getRecipeById };

async function getRecipeById(recipeId) {
  return await db.recipes.get(recipeId, async (recipe) => {
    if (recipe) return recipe;
    return await $.ajax({url: `/api/recipes/${recipeId}/view`}).then(hits => {
      if (hits.total === 1) return hits.results[0];
    });
  });
}

async function getRecipe(el) {
  var recipe = null;
  var target = $(el).hasClass('recipe') ? $(el) : $(el).parents('.recipe');
  var recipeList = $(target).parents('table[data-row-attributes]');
  if (recipeList.length) {
    var index = target.data('index');
    recipe = $(recipeList).bootstrapTable('getData')[index];
  } else {
    var recipeId = target.data('id');
    recipe = await getRecipeById(recipeId);
  }
  recipe.mealId = target.data('meal-id');
  return recipe;
}
