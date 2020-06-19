import 'jquery';

import { storage } from '../storage';

export { aggregateUnitQuantities, addProduct, removeProduct };

function aggregateUnitQuantities(product, recipeServings) {
  var unitQuantities = {};
  var recipes = storage.recipes.load();
  $.each(product.recipes, function(recipeId) {
    var defaultServings = recipes[recipeId] ? recipes[recipeId].servings : 1;
    var requestedServings = recipeServings[recipeId] || defaultServings;
    product.recipes[recipeId].amounts.forEach(function (amount) {
      if (!amount.units) amount.units = '';
      if (!(amount.units in unitQuantities)) unitQuantities[amount.units] = 0;
      unitQuantities[amount.units] += (amount.quantity * requestedServings) / defaultServings;
    });
  });
  $.each(unitQuantities, function(unit) {
    if (unitQuantities[unit] === 0) delete unitQuantities[unit];
  });
  return unitQuantities;
}

function addProduct(ingredient, recipeId) {
  var product = ingredient.product;
  if (!product.state) {
    product.state = 'required';
  }
  if (!product.recipes) {
    product.recipes = {};
  }

  var products = storage.products.load();
  if (product.product_id in products) {
    product.category = products[product.product_id].category;
    Object.assign(product.recipes, products[product.product_id].recipes);
  }

  if (recipeId) {
    if (!(recipeId in product.recipes)) {
      product.recipes[recipeId] = {amounts: []};
    }
    product.recipes[recipeId].amounts.push({
      quantity: ingredient.quantity,
      units: ingredient.units
    });
  }

  storage.products.remove({'hashCode': product.product_id});
  storage.products.add({'hashCode': product.product_id, 'value': product});
}

function removeProduct(product, recipeId) {
  if (recipeId) delete product.recipes[recipeId];
  if (Object.keys(product.recipes).length) return;

  storage.products.remove({'hashCode': product.product_id});
}
