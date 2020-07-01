import 'jquery';

import { db } from '../database';

export { addProduct, removeProduct };

function addProduct(ingredient, recipeId, index) {
  var product = ingredient.product;
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
    magnitude: ingredient.quantity && ingredient.quantity.magnitude,
    units: ingredient.quantity && ingredient.quantity.units,
  });
}

function removeProduct(product, recipeId) {
  db.ingredients
    .where("[recipe_id+product_id+index]")
    .between(
      [recipeId || '', product.id, db.minKey()],
      [recipeId || '', product.id, db.maxKey()]
    )
    .delete();
}
