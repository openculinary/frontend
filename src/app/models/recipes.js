import 'jquery';

import { getRecipe } from '../common';
import { db } from '../database';
import { getState } from '../state';
import { storage } from '../storage';
import { addProduct } from '../models/products';
import { updateRecipeState } from '../views/components/recipe-list';

export { addRecipe, removeRecipe, scaleRecipe };

function addRecipe() {
  getRecipe(this).then(recipe => {
    var state = getState();
    if (state.servings) scaleRecipe(recipe, Number(state.servings));

    storage.recipes.add({'hashCode': recipe.id, 'value': recipe});
    db.recipes.add({
      id: recipe.id,
      title: recipe.title,
      image_url: recipe.image_url,
      time: recipe.time,
      servings: recipe.servings,
      rating: recipe.rating,
      domain: recipe.domain,
      dst: recipe.dst,
    });

    updateRecipeState(recipe.id);

    for (var index in recipe.ingredients) {
      addProduct(recipe.ingredients[index], recipe.id, Number(index));
    }
  });
}

function removeRecipe() {
  getRecipe(this).then(recipe => {
    db.transaction('rw', db.recipes, db.meals, db.ingredients, () => {
      db.recipes
        .delete(recipe.id);
      db.meals
        .where({recipe_id: recipe.id})
        .delete();
      db.ingredients
        .where({recipe_id: recipe.id})
        .delete();
    }).then(() => {
      updateRecipeState(recipe.id);
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
