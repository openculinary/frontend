import 'jquery';

import { storage } from '../storage';

export { addProduct, removeProduct };

function addProduct(ingredient, recipeId) {
  var product = ingredient.product;
  product.state = product.state || 'required';
  product.recipes = product.recipes || {};

  var products = storage.products.load();
  if (product.product_id in products) {
    product.category = products[product.product_id].category;
    Object.assign(product.recipes, products[product.product_id].recipes);
  }

  if (recipeId) {
    product.recipes[recipeId] = product.recipes[recipeId] || {quantities: []};
    product.recipes[recipeId].quantities.push({
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
