import 'jquery';
import * as moment from 'moment';
import 'tablesaw/dist/stackonly/tablesaw.stackonly.jquery.js';

import 'tablesaw/dist/stackonly/tablesaw.stackonly.css';
import './recipe-list.css'

import { getRecipe } from '../common';
import { i18nAttr, localize } from '../i18n';
import { renderIngredientHTML, renderDirectionHTML } from '../recipeml';
import { getState, pushState } from '../state';
import { storage } from '../storage';
import { addRecipe } from '../models/recipes';
import { starRecipe, unstarRecipe } from '../models/starred';

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
  $('<img />', {'src': recipe.image_url, 'alt': recipe.title}).appendTo(sidebar);
  $('<span />', {'html': '<strong>serves</strong>'}).appendTo(sidebar);
  $('<span />', {'text': recipe.servings}).appendTo(sidebar);
  $('<br />').appendTo(sidebar);
  $('<span />', {'html': '<strong>time</strong>'}).appendTo(sidebar);
  $('<span />', {'text': duration.as('minutes') + ' mins'}).appendTo(sidebar);
  return sidebar;
}

function contentFormatter(recipe) {
  var content = $('<td />', {'class': 'content align-top'});

  var tabs = $('<div />', {'class': 'nav tabs'});
  tabs.append($('<a />', {
    'class': 'nav-link active',
    'data-i18n': i18nAttr('search:result-tab-ingredients'),
    'data-target': 'ingredients'
  }));
  tabs.append($('<a />', {
    'class': 'nav-link',
    'data-i18n': i18nAttr('search:result-tab-directions'),
    'data-target': 'directions'
  }));
  content.append(tabs);

  var ingredients = $('<div />', {'class': 'tab ingredients'});
  var ingredientList = $('<div  />');
  $.each(recipe.ingredients, function() {
    ingredientList.append(renderIngredientHTML(this.markup, this.product.state));
    ingredientList.append($('<div  />', {'style': 'clear: both'}));
  });
  ingredients.append(ingredientList);
  ingredients.append($('<button />', {
    'class': 'btn btn-outline-primary add-to-shopping-list',
    'data-i18n': i18nAttr('search:result-add-to-shopping-list')
  }));
  content.append(ingredients);

  var directions = $('<div />', {'class': 'tab directions collapse'});
  var directionList = $('<ul />');
  $.each(recipe.directions, function() {
    directionList.append(renderDirectionHTML(this.markup));
  });
  directions.append(directionList);
  content.append(directions);

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
    pushState(state, `#${stateHash}`);

    scrollToResults(selector, 50);
  });
}

function updateRecipeState(recipeId) {
  var recipes = storage.recipes.load();
  var isInShoppingList = recipeId in recipes;

  var addButton = $(`div.recipe-list .recipe[data-id="${recipeId}"] button.add-to-shopping-list`);
  addButton.prop('disabled', isInShoppingList);
  addButton.toggleClass('btn-outline-primary', !isInShoppingList);
  addButton.toggleClass('btn-outline-secondary', isInShoppingList);
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

function selectTab() {
  var recipe = getRecipe(this);
  var target = $(this).data('target');
  var recipeList = $(this).parents('table[data-row-attributes]');

  $(recipeList).find(`.recipe[data-id="${recipe.id}"] div.tabs a`).removeClass('active');
  $(recipeList).find(`.recipe[data-id="${recipe.id}"] div.tabs a[data-target="${target}"]`).addClass('active');
  $(recipeList).find(`.recipe[data-id="${recipe.id}"] div.tab`).addClass('collapse');
  $(recipeList).find(`.recipe[data-id="${recipe.id}"] div.tab.${target}`).removeClass('collapse');
}

function bindPostBody(selector) {
  $(`${selector} table[data-row-attributes]`).on('post-body.bs.table', function(e, data) {
    data.forEach(function (row) {
      updateRecipeState(row.id);
      updateStarState(row.id);
    });

    $(this).find('.content .tabs a.nav-link').on('click', selectTab);
    $(this).find('.content button.add-to-shopping-list').on('click', addRecipe);
    $(this).parents('div.recipe-list').show();

    // If the user is on the page containing this table, scroll it into view
    var state = getState();
    if (`#${state.action}` === selector) {
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
