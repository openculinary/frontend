import $ from 'jquery';
import * as moment from 'moment';

import { getRecipe, getRecipeById } from '../common';
import { db } from '../database';
import { i18nAttr, localize } from '../i18n';
import { addRecipe, scaleRecipe } from '../models/recipes';
import { starRecipe, unstarRecipe } from '../models/starred';
import { renderIngredientHTML, renderDirectionHTML } from '../recipeml';
import { getState, loadPage, pushState, renderStateHash } from '../state';

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

function updateRecipeState(recipeId) {
  db.recipes.get(recipeId, recipe => {
    var isInRecipes = !!recipe;

    var addButton = $('#recipe button.add-recipe');
    addButton.prop('disabled', isInRecipes);
    addButton.toggleClass('btn-outline-primary', !isInRecipes);
    addButton.toggleClass('btn-outline-secondary', isInRecipes);
  });
}

function updateStarState(recipeId) {
  db.starred.get(recipeId, starred => {
    var isStarred = !!starred;

    var star = $('#recipe .star');
    star.toggleClass('fas', isStarred);
    star.toggleClass('far', !isStarred);
    star.css('color', isStarred ? 'gold' : 'dimgray');
    star.off('click');
    star.on('click', () => {
      var toggleStarred = isStarred ? unstarRecipe : starRecipe;
      getRecipe(star).then(toggleStarred).then(updateStarState);
    });
  });
}

function updateServings() {
  var state = getState();
  state.servings = $('#recipe div.metadata input.servings').val();

  var stateHash = renderStateHash(state);
  pushState(state, stateHash);

  getRecipeById(state.id).then(renderIngredients);
}

function renderRecipe() {
  var state = getState();
  var container = $('#recipe');
  container.data('id', state.id);

  getRecipe(container).then(recipe => {
    var duration = moment.duration(recipe.time, 'minutes');

    var title = $('#recipe div.title').empty();
    var corner = $('#recipe div.corner').empty();
    var image = $('#recipe div.image').empty();
    var metadata = $('#recipe div.metadata').empty();

    var link = $('<a />', {'href': recipe.dst});
    var img = $('<img />', {'src': recipe.image_url, 'alt': recipe.title});
    link.append(img);

    container.data('id', recipe.id);
    title.text(recipe.title);
    corner.append(starFormatter());
    image.append(link);

    title.on('click', evt => {
      if (evt.detail < 3) return;
      window.open(`/diagnostics/#recipe&id=${recipe.id}`);
    });

    var targetServings = Number(state.servings) || recipe.servings;
    var servingsInput = $('<input>', {
        'class': 'servings',
        'min': 1,
        'max': 50,
        'type': 'number',
    });
    servingsInput.attr('aria-label', 'Serving count selection');
    servingsInput.val(targetServings);
    servingsInput.on('change', updateServings);

    metadata.append($('<div />', {'class': 'property', 'text': 'servings'}));
    metadata.append($('<div />', {'class': 'value'}).append(servingsInput));
    metadata.append($('<div />', {'class': 'property', 'text': 'time'}));
    metadata.append($('<div />', {'class': 'value', 'text': duration.as('minutes') + ' mins'}));

    renderIngredients(recipe);
    renderDirections(recipe);

    localize('#recipe');
    loadPage('recipe');

    updateRecipeState(recipe.id);
    updateStarState(recipe.id);
  });
}

function renderIngredients(recipe) {
  var ingredients = $('<div />', {'class': 'ingredients'});
  ingredients.append($('<div />', {
    'class': 'headline section-title',
    'data-i18n': i18nAttr('search:result-tab-ingredients')
  }));

  var servings = Number(getState().servings) || recipe.servings;
  scaleRecipe(recipe, servings);

  $.each(recipe.ingredients, function() {
    ingredients.append(renderIngredientHTML(this));
  });

  // TODO: i18n
  var addButton = $('<button />', {
    'class': 'headline btn btn-outline-primary add-recipe',
    'text': 'Add to shopping list'
  });
  addButton.on('click', () => { Promise.resolve(recipe).then(addRecipe).then(updateRecipeState); });

  ingredients.append(addButton);

  var existingIngredients = $('#recipe div.ingredients');
  existingIngredients.replaceWith(ingredients);

  localize('#recipe .ingredients');
}

function renderDirections(recipe) {
  var directions = $('<div />', {'class': 'directions'});
  directions.append($('<div />', {
    'class': 'section-title',
    'data-i18n': i18nAttr('search:result-tab-directions')
  }));

  var directionList  = $('<ol />');
  $.each(recipe.directions, function() {
    var directionHTML = renderDirectionHTML(this);
    var direction = $(directionHTML);
    direction.hover(hoverDirection, unhoverDirection);
    direction.click(markDirection);
    directionList.append(direction);
  });
  directions.append(directionList);

  var existingDirections = $('#recipe div.directions').empty();
  existingDirections.replaceWith(directions);

  localize('#recipe .directions');
}
