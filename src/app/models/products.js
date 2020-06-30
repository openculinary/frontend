import 'jquery';

import { db } from '../database';
import { storage } from '../storage';

export { addProduct, removeProduct };

function addProduct(ingredient, recipeId, index) {
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
  db.ingredients.add({
    recipe_id: recipeId || '',
    product_id: product.product_id,
    index: index || 0,
  });
}

function removeProduct(product, recipeId) {
  db.ingredients
    .where("[recipe_id+product_id+index]")
    .between(
      [recipeId || '', product.product_id, db.minKey()],
      [recipeId || '', product.product_id, db.maxKey()]
    )
    .delete();

  if (recipeId) delete product.recipes[recipeId];
  if (Object.keys(product.recipes).length) return;

  storage.products.remove({'hashCode': product.product_id});
}
