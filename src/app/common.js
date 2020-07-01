import 'jquery';

import { db } from './database';
import { storage } from './storage';

export { float2rat, getRecipe, getRecipeById };

async function getRecipeById(recipeId) {
  return await db.recipes.get(recipeId, async (recipe) => {
    if (recipe) return recipe;
    recipe = await $.ajax({url: `api/recipes/${recipeId}/view`});
    if (recipe.total === 1) return recipe.results[0];
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

// Source: https://stackoverflow.com/a/14357170
function float2rat(x) {
    var tolerance = 0.1;
    var h1=1; var h2=0;
    var k1=0; var k2=1;
    var b = x;
    do {
        var a = Math.floor(b);
        var aux = h1; h1 = a*h1+h2; h2 = aux;
        aux = k1; k1 = a*k1+k2; k2 = aux;
        b = 1/(b-a);
    } while (Math.abs(x-h1/k1) > x*tolerance);

    if (k1 === 1) return `${h1}`;
    if (h1 > k1) {
        h1 = Math.floor(h1 / k1);
        return `${h1} 1/${k1}`;
    }
    return `${h1}/${k1}`;
}
