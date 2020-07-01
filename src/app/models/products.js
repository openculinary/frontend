import { db } from '../database';

export { addProduct, addStandaloneIngredient, removeStandaloneIngredient };

function addProduct(ingredient, recipeId, index) {
  var product = ingredient.product;
  db.products.put({
    id: product.product_id,
    category: product.category,
    singular: product.singular,
    plural: product.plural,
  });
  db.ingredients.add({
    recipe_id: recipeId,
    product_id: product.product_id,
    index: index,
    magnitude: ingredient.quantity && ingredient.quantity.magnitude,
    units: ingredient.quantity && ingredient.quantity.units,
  });
}

function addStandaloneIngredient(product) {
  addProduct({product: product}, '', 0);
}

function removeStandaloneIngredient(product) {
  db.ingredients
    .where("[recipe_id+product_id+index]")
    .between(
      ['', product.id, db.minKey()],
      ['', product.id, db.maxKey()]
    )
    .delete();
}
