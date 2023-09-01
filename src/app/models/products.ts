import { Ingredient, db } from '../database';

export { addProduct };

function addProduct(ingredient: Ingredient, recipeId: string, index: number) : void {
  const product = ingredient.product;
  void db.transaction('rw', db.products, db.ingredients, () => {
    void db.products.put({
      id: product.id,
      ...product
    });
    void db.ingredients.add({
      recipe_id: recipeId,
      product_id: product.id,
      index: index,
      ...ingredient
    });
  });
}
