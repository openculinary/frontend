import { Ingredient, Product, db } from '../database';
import { addProduct } from './products';

export { addStandaloneIngredient, removeStandaloneIngredient };

function addStandaloneIngredient(product: Product) : void {
  const ingredient: Ingredient = {
    recipe_id: '',
    product_id: product.id,
    index: 0,
    markup: null,
    quantity: null,
    product: product,
  };
  addProduct(ingredient, ingredient.recipe_id, ingredient.index);
}

function removeStandaloneIngredient(product: Product) : void {
  db.ingredients
    .where("[recipe_id+product_id+index]")
    .between(
      ['', product.id, db.minKey()],
      ['', product.id, db.maxKey()]
    )
    .delete();
}
