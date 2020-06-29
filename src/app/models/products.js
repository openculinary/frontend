import 'jquery';

import { db } from '../database';
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
    product.recipes[recipeId].quantities.push(ingredient.quantity);
  }

  storage.products.remove({'hashCode': product.product_id});
  storage.products.add({'hashCode': product.product_id, 'value': product});
  db.products.put({
    id: product.product_id,
    category: product.category,
    singular: product.singular,
    plural: product.plural,
  });
}

function removeProduct(product, recipeId) {
  if (recipeId) delete product.recipes[recipeId];
  if (Object.keys(product.recipes).length) return;

  storage.products.remove({'hashCode': product.product_id});
  db.products.delete(product.product_id);
}
