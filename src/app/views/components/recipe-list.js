import 'jquery';
import * as moment from 'moment';
import 'tablesaw/dist/stackonly/tablesaw.stackonly.jquery.js';

import { getRecipe } from '../../common';
import { db } from '../../database';
import { i18nAttr, localize } from '../../i18n';
import { renderIngredientHTML } from '../../recipeml';
import { getState, pushState, renderStateHash } from '../../state';
import { addRecipe } from '../../models/recipes';
import { starRecipe, unstarRecipe } from '../../models/starred';

export {
    initTable,
    bindLoadEvent,
    recipeFormatter,
    rowAttributes,
};

function titleFormatter(recipe) {
  var container = $('<div />', {'class': 'title'});

  var icon = $('<img />', {'src': 'images/domains/' + recipe.domain + '.ico', 'alt':''});
  var title = $('<a />', {
    'href': `#search&action=view&id=${recipe.id}`,
    'text': recipe.title,
  });

  container.append(icon);
  container.append(title);

  return container;
}

function starFormatter() {
  return $('<div />', {'class': 'star far fa-star'});
}

function sidebarFormatter(recipe) {
  var duration = moment.duration(recipe.time, 'minutes');

  var link = $('<a />', {'href': `#search&action=view&id=${recipe.id}`});
  var img = $('<img />', {'src': recipe.image_url, 'alt': recipe.title});
  link.append(img);

  var sidebar = $('<td />', {'class': 'sidebar align-top'});
  sidebar.append(link);

  sidebar.append($('<span />', {'html': '<strong>serves</strong>'}));
  sidebar.append($('<span />', {'text': recipe.servings}));
  sidebar.append($('<br />'));
  sidebar.append($('<span />', {'html': '<strong>time</strong>'}));
  sidebar.append($('<span />', {'text': duration.as('minutes') + ' mins'}));

  // TODO: i18n
  var destination = $('<a />', {
    'href': recipe.dst,
    'target': '_blank',
    'rel': 'noreferrer'
  });
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
    ingredients.append(renderIngredientHTML(this));
    ingredients.append($('<div  />', {'style': 'clear: both'}));
  });
  content.append(ingredients);

  return content;
}

function recipeFormatter(value, recipe) {
  var container = $('<div />');

  var title = titleFormatter(recipe);
  var star = starFormatter();

  var row = $('<tr />');
  row.append(sidebarFormatter(recipe));
  row.append(contentFormatter(recipe));

  var table = $('<table />', {
    'class': 'tablesaw tablesaw-stack',
    'data-tablesaw-mode': 'stack'
  });
  table.append(row);

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

    // Special-case: perform a search action when returning to search results
    var page = selector.substring(1);
    if (page === 'search') state['action'] = page;

    var stateHash = renderStateHash(state);
    pushState(state, stateHash);

    scrollToResults(selector, 50);
  });
}

function updateRecipeState(recipeId) {
  db.recipes.get(recipeId, recipe => {
    var isInRecipes = !!recipe;

    var addButton = $(`div.recipe-list .recipe[data-id="${recipeId}"] button.add-recipe`);
    addButton.prop('disabled', isInRecipes);
    addButton.toggleClass('btn-outline-primary', !isInRecipes);
    addButton.toggleClass('btn-outline-secondary', isInRecipes);
  });
}

function updateStarState(selector, recipeId) {
  db.starred.get(recipeId, starred => {
    var isStarred = !!starred;

    var star = $(`${selector} div.recipe-list .recipe[data-id="${recipeId}"] .star`);
    star.toggleClass('fas', isStarred);
    star.toggleClass('far', !isStarred);
    star.css('color', isStarred ? 'gold' : 'dimgray');
    star.off('click');
    star.on('click', () => {
      var toggleStarred = isStarred ? unstarRecipe : starRecipe;
      getRecipe(star).then(toggleStarred).then(recipeId => { updateStarState(selector, recipeId) });
    });
  });
}

function bindPostBody(selector) {
  $(`${selector} table[data-row-attributes]`).on('post-body.bs.table', function(e, data) {
    data.forEach(function (row) {
      updateRecipeState(row.id);
      updateStarState(selector, row.id);
    });

    $(this).find('.sidebar button.add-recipe').each((_, button) => {
      $(button).on('click', () => { getRecipe(button).then(addRecipe).then(updateRecipeState); });
    });
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
