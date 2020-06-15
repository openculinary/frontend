import './recipe.css';

import { getRecipeById } from '../common';
import { i18nAttr, localize } from '../i18n';
import { renderIngredientHTML, renderDirectionHTML } from '../recipeml';
import { getState, loadPage } from '../state';

export { renderRecipe };

function hoverDirection() {
  $(this).addClass('hover');
}

function unhoverDirection() {
  $(this).removeClass('hover');
}

function markDirection() {
  $('#recipe div.directions li.direction').removeClass('mark');
  $(this).addClass('mark');
}

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

  ingredients.append($('<div />', {
    'class': 'headline section-title',
    'data-i18n': i18nAttr('search:result-tab-ingredients')
  }));

  $.each(recipe.ingredients, function() {
    ingredients.append(renderIngredientHTML(this.markup, this.product.state));
  });

  directions.append($('<div />', {
    'class': 'section-title',
    'data-i18n': i18nAttr('search:result-tab-directions')
  }));

  var directionList  = $('<ol />');
  $.each(recipe.directions, function() {
    var directionHTML = renderDirectionHTML(this.markup);
    var direction = $(directionHTML);
    direction.hover(hoverDirection, unhoverDirection);
    direction.click(markDirection);
    directionList.append(direction);
  });
  directions.append(directionList);

  localize('#recipe');
  loadPage('recipe');
}
