import 'jquery';

import { getRecipe } from '../common';
import { storage } from '../storage';
import { addProduct, removeProduct } from '../models/products';
import { updateRecipeState } from '../views/components/recipe-list';

export { addRecipe, removeRecipe, scaleRecipe };

function addRecipe() {
  var recipe = getRecipe(this);

  storage.recipes.add({'hashCode': recipe.id, 'value': recipe});
  updateRecipeState(recipe.id);

  recipe.ingredients.forEach(function (ingredient) {
    addProduct(ingredient, recipe.id);
  });
}

function removeRecipe() {
  var recipe = getRecipe(this);

  var products = storage.products.load();
  $.each(products, function(productId) {
    var product = products[productId];
    if (recipe.id in product.recipes) {
      removeProduct(product, recipe.id);
    }
  });

  storage.recipes.remove({'hashCode': recipe.id});
  updateRecipeState(recipe.id);
}

function scaleRecipe(recipe, targetServings) {
  $.each(recipe.ingredients, function() {
    this.quantity *= targetServings;
    this.quantity /= recipe.servings;
  });
  recipe.servings = targetServings;
}
