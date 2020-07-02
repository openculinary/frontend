import 'jquery';

import { getRecipe } from '../common';
import { db } from '../database';
import { getState } from '../state';
import { addProduct } from '../models/products';

export { addRecipe, removeRecipe, scaleRecipe };

function addRecipe(element, callback) {
  getRecipe(element).then(recipe => {
    var state = getState();
    if (state.servings) scaleRecipe(recipe, Number(state.servings));

    db.transaction('rw', db.recipes, db.products, db.ingredients, () => {
      db.recipes.add(recipe).then(() => {
        $.each(recipe.ingredients, (index, ingredient) => {
          addProduct(ingredient, recipe.id, index);
        });
      });
    }).then(() => {
      callback && callback(recipe.id);
    });
  });
}

function removeRecipe(element, callback) {
  getRecipe(element).then(recipe => {
    db.transaction('rw', db.recipes, db.meals, db.ingredients, () => {
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
    }).then(() => {
      callback && callback(recipe.id);
    });
  });
}

function scaleRecipe(recipe, targetServings) {
  $.each(recipe.ingredients, function() {
    this.quantity.magnitude *= targetServings;
    this.quantity.magnitude /= recipe.servings;
  });
  recipe.servings = targetServings;
}
