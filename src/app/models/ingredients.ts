import { Ingredient, Product, db } from '../database';
import { addProduct } from './products';

export { addStandaloneIngredient, removeStandaloneIngredient };

function addStandaloneIngredient(product: Product) {
  const ingredient: Ingredient = {
    recipe_id: '',
    product_id: null,
    index: 0,
    markup: null,
    quantity: null,
    product: product,
  };
  addProduct(ingredient, ingredient.recipe_id, ingredient.index);
}

function removeStandaloneIngredient(product: Product) {
  db.ingredients
    .where("[recipe_id+product_id+index]")
    .between(
      ['', product.id, db.minKey()],
      ['', product.id, db.maxKey()]
    )
    .delete();
}
