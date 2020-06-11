import './recipe.css';

import { getRecipeById } from '../common';
import { getState, loadPage } from '../state';

export { renderRecipe };

function renderRecipe() {
  var id = getState().id;
  var recipe = getRecipeById(id);

  $('#recipe div.title').text(recipe.title);

  loadPage('recipe');
}
