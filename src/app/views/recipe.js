import './recipe.css';

import { getRecipeById } from '../common';
import { renderIngredientHTML, renderDirectionHTML } from '../recipeml';
import { getState, loadPage } from '../state';

export { renderRecipe };

function renderRecipe() {
  var id = getState().id;
  var recipe = getRecipeById(id);

  var title = $('#recipe div.title').empty();
  var image = $('#recipe div.image').empty();
  var ingredients = $('#recipe div.ingredients').empty();
  var directions = $('#recipe div.directions').empty();

  var link = $('<a />', {'href': recipe.dst});
  $('<img />', {'src': recipe.image_url, 'alt': recipe.title}).appendTo(link);

  title.text(recipe.title);
  image.append(link);
  $.each(recipe.ingredients, function() {
    ingredients.append(renderIngredientHTML(this.markup, this.product.state));
    ingredients.append($('<div  />', {'style': 'clear: both'}));
  });
  $.each(recipe.directions, function() {
    directions.append(renderDirectionHTML(this.markup));
    directions.append($('<div  />', {'style': 'clear: both'}));
  });

  loadPage('recipe');
}
