import 'jquery';

import { storage } from './storage';
export { float2rat, getRecipe, getRecipeById };

function getRecipeById(recipeId) {
  var recipes = storage.recipes.load();
  var starred = storage.starred.load();
  var recipe = recipes[recipeId] || starred[recipeId];
  if (!recipe || !recipe.ingredients) {
    $.ajax({
      async: false,
      url: `api/recipes/${recipeId}/view`,
      success: function(data) {
        if (data.total === 1) recipe = data.results[0];
      }
    });
  }
  return recipe;
}

function getRecipeProducts(recipe) {
  var recipeProducts = [];
  recipe.ingredients.forEach(function(ingredient) {
    var productToken, quantityToken, unitsToken;
    ingredient.tokens.forEach(function(token) {
      if (token.type == 'product') productToken = token;
      if (token.type == 'quantity') quantityToken = token;
      if (token.type == 'units') unitsToken = token;
    });

    recipeProducts.push({
      product: productToken.value,
      category: productToken.category,
      singular: productToken.singular,
      plural: productToken.plural,
      state: productToken.state,
      quantity: quantityToken ? quantityToken.value : null,
      units: unitsToken ? unitsToken.value : null
    });
  });
  return recipeProducts;
}

function getRecipe(el) {
  var recipe = null;

  var target = $(el).hasClass('recipe') ? $(el) : $(el).parents('.recipe');
  var recipeList = $(target).parents('div.recipe-list table');
  if (recipeList.length) {
    var index = target.data('index');
    var data = $(recipeList).bootstrapTable('getData');
    recipe = data[index];
  } else {
    var recipeId = target.data('id');
    recipe = getRecipeById(recipeId);
  }

  if (!recipe.products) {
    recipe.products = getRecipeProducts(recipe);
  }

  return recipe;
}

function float2rat(x) {
    var tolerance = 1.0E-2;
    var h1=1; var h2=0;
    var k1=0; var k2=1;
    var b = x;
    do {
        var a = Math.floor(b);
        var aux = h1; h1 = a*h1+h2; h2 = aux;
        aux = k1; k1 = a*k1+k2; k2 = aux;
        b = 1/(b-a);
    } while (Math.abs(x-h1/k1) > x*tolerance);

    if (k1 === 1) return h1;
    if (h1 > k1) {
        h1 = Math.floor(h1 / k1);
        return h1+" 1/"+k1;
    }
    return h1+"/"+k1;
}