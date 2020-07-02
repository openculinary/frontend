import 'jquery';

import { getRecipe } from '../common';
import { db } from '../database';
import { getState } from '../state';
import { addProduct } from '../models/products';

export { addRecipe, removeRecipe, scaleRecipe };

async function addRecipe(recipe) {
  return db.transaction('rw', db.recipes, db.products, db.ingredients, () => {
    db.recipes.add(recipe).then(() => {
      $.each(recipe.ingredients, (index, ingredient) => {
        addProduct(ingredient, recipe.id, index);
      });
    });
  }).then(() => recipe.id);
}

async function removeRecipe(recipe) {
  return db.transaction('rw', db.recipes, db.meals, db.ingredients, () => {
    db.recipes
      .delete(recipe.id);
    db.meals
      .where("recipe_id")
      .equals(recipe.id)
      .delete();
    db.ingredients
      .where("recipe_id")
      .equals(recipe.id)
      .delete();
  }).then(() => recipe.id);
}

function scaleRecipe(recipe, targetServings) {
  $.each(recipe.ingredients, function() {
    this.quantity.magnitude *= targetServings;
    this.quantity.magnitude /= recipe.servings;
  });
  recipe.servings = targetServings;
}
