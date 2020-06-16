import * as moment from 'moment';

import './recipe.css';

import { getRecipeById } from '../common';
import { i18nAttr, localize } from '../i18n';
import { addRecipe } from '../models/recipes';
import { starRecipe, unstarRecipe } from '../models/starred';
import { renderIngredientHTML, renderDirectionHTML } from '../recipeml';
import { getState, loadPage } from '../state';
import { storage } from '../storage';

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

function starFormatter() {
  return $('<div />', {'class': 'star far fa-star'});
}

function updateRecipeState() {
  var recipes = storage.recipes.load();
  var recipeId = $('#recipe').data('id');
  var isInRecipes = recipeId in recipes;

  var addButton = $('#recipe button.add-recipe');
  addButton.prop('disabled', isInRecipes);
  addButton.toggleClass('btn-outline-primary', !isInRecipes);
  addButton.toggleClass('btn-outline-secondary', isInRecipes);
}

function updateStarState() {
  var starred = storage.starred.load();
  var recipeId = $('#recipe').data('id');
  var isStarred = recipeId in starred;

  var star = $('#recipe .star');
  star.toggleClass('fas', isStarred);
  star.toggleClass('far', !isStarred);
  star.css('color', isStarred ? 'gold' : 'dimgray');
  star.off('click');
  star.on('click', isStarred ? unstarRecipe : starRecipe);
  star.on('click', updateStarState);
}

function renderRecipe() {
  var id = getState().id;
  var recipe = getRecipeById(id);
  var duration = moment.duration(recipe.time, 'minutes');

  var container = $('#recipe');
  var title = $('#recipe div.title').empty();
  var corner = $('#recipe div.corner').empty();
  var image = $('#recipe div.image').empty();
  var metadata = $('#recipe div.metadata').empty();
  var ingredients = $('#recipe div.ingredients').empty();
  var directions = $('#recipe div.directions').empty();

  var link = $('<a />', {'href': recipe.dst});
  $('<img />', {'src': recipe.image_url, 'alt': recipe.title}).appendTo(link);

  container.data('id', recipe.id);
  title.text(recipe.title);
  corner.append(starFormatter());
  image.append(link);

  metadata.append($('<div />', {'class': 'property', 'text': 'servings'}));
  metadata.append($('<div />', {'class': 'value', 'text': recipe.servings}));
  metadata.append($('<div />', {'class': 'property', 'text': 'time'}));
  metadata.append($('<div />', {'class': 'value', 'text': duration.as('minutes') + ' mins'}));

  ingredients.append($('<div />', {
    'class': 'headline section-title',
    'data-i18n': i18nAttr('search:result-tab-ingredients')
  }));

  $.each(recipe.ingredients, function() {
    ingredients.append(renderIngredientHTML(this.markup, this.product.state));
  });

  // TODO: i18n
  var addButton = $('<button />', {
    'class': 'headline btn btn-outline-primary add-recipe',
    'text': 'Add to shopping list'
  });
  addButton.on('click', addRecipe);

  ingredients.append(addButton);

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

  updateStarState();
}

$(function() {
  storage.recipes.on('state changed', updateRecipeState);
});
