import { db } from '../database';

export { addProduct };

function addProduct(ingredient, recipeId, index) {
  var product = ingredient.product;
  db.products.put({
    id: product.product_id,
    ...product
  });
  db.ingredients.add({
    recipe_id: recipeId,
    product_id: product.product_id,
    index: index,
    ...ingredient
  });
}
