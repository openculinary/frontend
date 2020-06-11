import 'jquery';
import * as moment from 'moment';
import 'tablesaw/dist/stackonly/tablesaw.stackonly.jquery.js';

import 'tablesaw/dist/stackonly/tablesaw.stackonly.css';
import './recipe-list.css'

import { getRecipe } from '../../common';
import { i18nAttr, localize } from '../../i18n';
import { renderIngredientHTML } from '../../recipeml';
import { getState, pushState } from '../../state';
import { storage } from '../../storage';
import { addRecipe } from '../../models/recipes';
import { starRecipe, unstarRecipe } from '../../models/starred';

export {
    initTable,
    bindLoadEvent,
    recipeFormatter,
    rowAttributes,
    updateRecipeState,
    updateStarState,
};

function titleFormatter(recipe) {
  var title = $('<div />', {'class': 'title'});
  $('<img />', {'src': 'images/domains/' + recipe.domain + '.ico', 'alt':''}).appendTo(title);
  $('<a />', {
    'href': recipe.dst,
    'text': recipe.title,
    'target': '_blank',
    'rel': 'noreferrer'
  }).appendTo(title);
  return title;
}

function starFormatter() {
  return $('<div />', {'class': 'star far fa-star'});
}

function sidebarFormatter(recipe) {
  var duration = moment.duration(recipe.time, 'minutes');
  var sidebar = $('<td />', {'class': 'sidebar align-top'});

  var link = $('<a />', {'href': `#search&action=view&id=${recipe.id}`});
  $('<img />', {'src': recipe.image_url, 'alt': recipe.title}).appendTo(link);
  link.appendTo(sidebar);

  $('<span />', {'html': '<strong>serves</strong>'}).appendTo(sidebar);
  $('<span />', {'text': recipe.servings}).appendTo(sidebar);
  $('<br />').appendTo(sidebar);
  $('<span />', {'html': '<strong>time</strong>'}).appendTo(sidebar);
  $('<span />', {'text': duration.as('minutes') + ' mins'}).appendTo(sidebar);

  // TODO: i18n
  var destination = $('<a />', {'href': recipe.dst});
  destination.append($('<button />', {
    'class': 'btn btn-outline-primary',
    'text': `View on ${recipe.domain}`
  }));
  sidebar.append(destination);

  sidebar.append($('<button />', {
    'class': 'btn btn-outline-primary add-recipe',
    'data-i18n': i18nAttr('search:result-add-recipe')
  }));

  return sidebar;
}

function contentFormatter(recipe) {
  var content = $('<td />', {'class': 'content align-top'});

  var ingredients = $('<div  />', {'class': 'ingredients'});
  $.each(recipe.ingredients, function() {
    ingredients.append(renderIngredientHTML(this.markup, this.product.state));
    ingredients.append($('<div  />', {'style': 'clear: both'}));
  });
  content.append(ingredients);

  return content;
}

function recipeFormatter(value, recipe) {
  var container = $('<div />');
  var title = titleFormatter(recipe);
  var star = starFormatter();
  var table = $('<table />', {
    'class': 'tablesaw tablesaw-stack',
    'data-tablesaw-mode': 'stack'
  });
  var row = $('<tr />');
  row.append(sidebarFormatter(recipe));
  row.append(contentFormatter(recipe));
  row.appendTo(table);
  container.append(title);
  container.append(star);
  container.append(table);
  return container.html();
}

function rowAttributes(row) {
  return {
    'class': 'recipe',
    'data-id': row.id
  }
}

function scrollToResults(selector, delay) {
  var scrollTop = $(`${selector} table[data-row-attributes]`).offset().top - $('header').height() - 80;
  $('html, body').animate({scrollTop: scrollTop}, delay || 500);
}

function bindPageChange(selector) {
  $(`${selector} table[data-row-attributes]`).on('page-change.bs.table', function(e, number) {
    // Write the new page number into the application's state
    var state = getState();
    if (number > 1) state.page = number;
    else delete state.page;

    var stateHash = decodeURIComponent($.param(state));
    pushState(state, `${selector}&${stateHash}`);

    scrollToResults(selector, 50);
  });
}

function updateRecipeState(recipeId) {
  var recipes = storage.recipes.load();
  var isInRecipes = recipeId in recipes;

  var addButton = $(`div.recipe-list .recipe[data-id="${recipeId}"] button.add-recipe`);
  addButton.prop('disabled', isInRecipes);
  addButton.toggleClass('btn-outline-primary', !isInRecipes);
  addButton.toggleClass('btn-outline-secondary', isInRecipes);
}

function updateStarState(recipeId) {
  var starred = storage.starred.load();
  var isStarred = recipeId in starred;

  var star = $(`div.recipe-list .recipe[data-id="${recipeId}"] .star`);
  star.toggleClass('fas', isStarred);
  star.toggleClass('far', !isStarred);
  star.css('color', isStarred ? 'gold' : 'dimgray');
  star.off('click');
  star.on('click', isStarred ? unstarRecipe : starRecipe);
}

function bindPostBody(selector) {
  $(`${selector} table[data-row-attributes]`).on('post-body.bs.table', function(e, data) {
    data.forEach(function (row) {
      updateRecipeState(row.id);
      updateStarState(row.id);
    });

    $(this).find('.sidebar button.add-recipe').on('click', addRecipe);
    $(this).parents('div.recipe-list').show();

    // If the user is on the page containing this table, scroll it into view
    var state = getState();
    if (selector.substring(1) in state) {
      scrollToResults(selector);
    }

    // Localize search result elements
    localize(selector);
  });
}

function bindLoadEvent(selector, callback) {
  $(`${selector} table[data-row-attributes]`).on('load-success.bs.table', function(e, data) {
    callback(data);
  });
}

function initTable(selector) {
  bindPageChange(selector);
  bindPostBody(selector);
}
