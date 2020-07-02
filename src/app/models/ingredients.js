import { db } from '../database';
import { addProduct } from './products';

export { addStandaloneIngredient, removeStandaloneIngredient };

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
