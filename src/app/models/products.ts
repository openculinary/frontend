import { types } from 'document';

import { db } from '../database';

export { addProduct };

function addProduct(ingredient: types.Ingredient, recipeId: string, index: number) : void {
  const product = ingredient.product;
  db.transaction('rw', db.products, db.ingredients, () => {
    db.products.put({
      id: product.id,
      ...product
    });
    db.ingredients.add({
      recipe_id: recipeId,
      product_id: product.id,
      index: index,
      ...ingredient
    });
  });
}
