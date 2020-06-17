import 'jquery';

import { storage } from '../storage';

export { aggregateUnitQuantities, addProduct, removeProduct };

function aggregateUnitQuantities(product, mealCounts) {
  var unitQuantities = {};
  $.each(product.recipes, function(recipeId) {
    var multiple = mealCounts[recipeId] || 1;
    product.recipes[recipeId].amounts.forEach(function (amount) {
      if (!amount.units) amount.units = '';
      if (!(amount.units in unitQuantities)) unitQuantities[amount.units] = 0;
      unitQuantities[amount.units] += amount.quantity * multiple;
    });
  });
  $.each(unitQuantities, function(unit) {
    if (unitQuantities[unit] === 0) delete unitQuantities[unit];
  });
  return unitQuantities;
}

function addProduct(product, recipeId) {
  var products = storage.products.load();
  if (!product.state) {
    product.state = 'required';
  }
  if (!product.recipes) {
    product.recipes = {};
  }
  if (product.product_id in products) {
    product.category = products[product.product_id].category;
    Object.assign(product.recipes, products[product.product_id].recipes);
  }
  if (recipeId) {
    if (!(recipeId in product.recipes)) {
      product.recipes[recipeId] = {amounts: []};
    }
    product.recipes[recipeId].amounts.push({
      quantity: product.quantity,
      units: product.units
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
