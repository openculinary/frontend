import 'jquery';

import { getRecipe } from '../common';
import { storage } from '../storage';
import { addProduct, removeProduct } from '../models/products';
import { updateRecipeState } from '../ui/recipe-list';

export { addRecipe, removeRecipe };

function addRecipe() {
  var recipe = getRecipe(this);

  storage.recipes.add({'hashCode': recipe.id, 'value': recipe});
  updateRecipeState(recipe.id);

  recipe.products.forEach(function (product) {
    addProduct(product, recipe.id);
  });

  gtag('event', 'add_to_cart');
  RecipeRadar.countly.add_event('addRecipe');
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
