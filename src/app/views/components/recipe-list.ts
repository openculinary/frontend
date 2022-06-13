import * as dayjs from 'dayjs';
import * as duration from 'dayjs/plugin/duration';
import * as $ from 'jquery';
import 'tablesaw/dist/stackonly/tablesaw.stackonly.jquery.js';

import { getRecipe } from '../../common';
import { renderQuantity } from '../../conversion';
import { Recipe, Starred, db } from '../../database';
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
    updateRecipeState,
};

dayjs.extend(duration);

function titleFormatter(recipe: Recipe) : JQuery {
  const container = $('<div />', {'class': 'title'});

  const title = $('<a />', {
    'href': recipe.dst,
    'text': recipe.title,
  });

  container.append(title);

  return container;
}

function starFormatter() {
  return $('<div />', {'class': 'star far fa-star'});
}

function sidebarFormatter(recipe) : JQuery {
  const duration = dayjs.duration(recipe.time, 'minutes');

  const sidebar = $('<td />', {'class': 'sidebar align-top'});

  sidebar.append($('<span />', {'html': '<strong>serves</strong>', 'class': 'field'}));
  sidebar.append($('<span />', {'text': recipe.servings}));
  sidebar.append($('<br />'));
  sidebar.append($('<span />', {'html': '<strong>time</strong>', 'class': 'field'}));
  sidebar.append($('<span />', {'text': duration.as('minutes') + ' mins'}));
  sidebar.append($('<br />'));

  if (recipe.nutrition) {
    sidebar.append($('<div />', {'html': '<strong>nutrition (per serving)</strong>', 'class': 'heading'}));

    const nutritionFields = ['energy', 'fat', 'carbohydrates', 'fibre', 'protein'];
    nutritionFields.forEach(field => {
      if (!recipe.nutrition[field].magnitude) return;
      sidebar.append($('<span />', {'html': `<strong>${field}</strong>`, 'class': 'field'}));
      const quantity = renderQuantity(recipe.nutrition[field], false);
      sidebar.append($('<span />', {'html': `${quantity.magnitude || ''} ${quantity.units || ''}`.trim()}));
      sidebar.append($('<br />'));
    });
  }

  const properties = [
    'is_dairy_free',
    'is_gluten_free',
    'is_vegan',
    'is_vegetarian',
  ];
  properties.forEach(property => {
    if (!recipe[property]) return;
    sidebar.append($('<img />', {
      'class': `dietary-property ${property.split('_').join('-')}`,
      'style': `-webkit-mask: url(images/symbols/${property}.svg)`,
      'data-i18n': `[title]dietary-properties:${property}`,
    }));
  });

  return sidebar;
}

function contentFormatter(recipe) {
  const content = $('<td />', {'class': 'content align-top'});

  const ingredients = $('<div  />', {'class': 'ingredients'});
  $.each(recipe.ingredients, function() {
    ingredients.append(renderIngredientHTML(this));
    ingredients.append($('<div  />', {'style': 'clear: both'}));
  });
  content.append(ingredients);
  content.append($('<br />'));

  content.append($('<button />', {
    'class': 'add btn btn-outline-primary add-recipe',
    'data-i18n': i18nAttr('search:result-add-recipe')
  }));

  return content;
}

function recipeFormatter(value: HTMLElement, recipe: Recipe) : HTMLElement {
  const container = $('<div />');

  const title = titleFormatter(recipe);
  const star = starFormatter();

  const row = $('<tr />');
  row.append(sidebarFormatter(recipe));
  row.append(contentFormatter(recipe));

  const table = $('<table />', {
    'class': 'tablesaw tablesaw-stack',
    'data-tablesaw-mode': 'stack'
  });
  table.append(row);

  container.append(title);
  container.append(star);
  container.append(table);

  return container.html();
}

function rowAttributes(row: HTMLElement) : Record<string, string> {
  return {
    'class': 'recipe',
    'data-id': row.id
  }
}

function scrollToResults(selector: string, delay?: number) : void {
  const scrollTop = $(`${selector} table[data-row-attributes]`).offset().top - $('header').height() - 80;
  $('html, body').animate({scrollTop: scrollTop}, delay || 500);
}

function bindPageChange(selector: string) : void {
  $(`${selector} table[data-row-attributes]`).on('page-change.bs.table', function(e, number) {
    // Write the new page number into the application's state
    const state = getState();
    if (number > 1) state.page = number;
    else delete state.page;

    // Special-case: perform a search action when returning to search results
    const page = selector.substring(1);
    if (page === 'search') state['action'] = page;

    const stateHash: string = renderStateHash(state);
    pushState(state, stateHash);

    scrollToResults(selector, 50);
  });
}

function updateRecipeState(recipeId: string) : void {
  db.recipes.get(recipeId, (recipe?: Recipe) => {
    const isInRecipes = !!recipe;

    const addButton = $(`div.recipe-list .recipe[data-id="${recipeId}"] button.add-recipe`);
    addButton.prop('disabled', isInRecipes);
    addButton.toggleClass('btn-outline-primary', !isInRecipes);
    addButton.toggleClass('btn-outline-secondary', isInRecipes);
  });
}

function updateStarState(selector: string, recipeId: string) : void {
  db.starred.get(recipeId, (starred?: Starred) => {
    const isStarred = !!starred;

    const star = $(`${selector} div.recipe-list .recipe[data-id="${recipeId}"] .star`);
    star.toggleClass('fas', isStarred);
    star.toggleClass('far', !isStarred);
    star.css('color', isStarred ? 'gold' : 'dimgray');
    star.off('click');
    star.on('click', () => {
      const toggleStarred = isStarred ? unstarRecipe : starRecipe;
      getRecipe(star).then(toggleStarred).then(recipeId => { updateStarState(selector, recipeId) });
    });
  });
}

function bindPostBody(selector: string) : void {
  $(`${selector} table[data-row-attributes]`).on('post-body.bs.table', function(e, data) {
    data.forEach(function (row) {
      updateRecipeState(row.id);
      updateStarState(selector, row.id);
    });

    $(this).find('.sidebar button.add-recipe').each((_, button) => {
      $(button).on('click', () => { getRecipe(button).then(addRecipe).then(updateRecipeState); });
    });
    $(this).parents('div.recipe-list').show();

    // Localize search result elements
    localize(selector);
  });
}

function bindLoadEvent(selector: string, callback: (data) => void) : void {
  $(`${selector} table[data-row-attributes]`).on('load-success.bs.table', function(e, data) {
    callback(data);
  });
}

function initTable(selector: string) : void {
  bindPageChange(selector);
  bindPostBody(selector);
}
