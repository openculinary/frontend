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
import { addRecipe, scaleRecipe } from '../../models/recipes';
import { starRecipe, unstarRecipe } from '../../models/starred';

export {
    initTable,
    bindLoadEvent,
    recipeFormatter,
    rowAttributes,
    updateRecipeState,
};

dayjs.extend(duration);

function attributionFormatter(recipe: Recipe) : JQuery {
  const container = $('<div />', {'class': 'attribution'});

  const title = $('<a />', {
    'class': 'title',
    'href': recipe.dst,
    'text': recipe.title,
  });

  container.append(title);

  if (recipe.author) {
    container.append($('<br />'));
    container.append(document.createTextNode('by '));

    const author = recipe.author_url ? $('<a />', {'href': recipe.author_url}) : $('<span />');
    author.addClass('author');
    author.text(recipe.author);

    container.append(author);
  }

  return container;
}

function starFormatter() {
  return $('<div />', {'class': 'star', 'html': '&#x2b50;'});
}

function thumbnailFormatter(recipe) : JQuery {
  const container = $('<td />', {'class': 'thumbnail align-top'});
  const link = $('<a />', {'href': recipe.dst});
  const img = $('<img />', {
    'class': 'thumbnail',
    'src': recipe.image_url,
    'alt': recipe.title,
  });
  link.append(img);
  container.append(link);
  return container;
}

function sidebarFormatter(recipe) : JQuery {
  const duration = dayjs.duration(recipe.time, 'minutes');

  const sidebar = $('<td />', {'class': 'sidebar align-top'});

  const servingsInput = $('<input>', {
      'class': 'servings',
      'min': 1,
      'max': 50,
      'size': 2,
      'type': 'number',
      'value': recipe.servings,
  });
  servingsInput.attr('aria-label', 'Serving count selection');

  sidebar.append($('<span />', {'html': '<strong>Servings</strong>', 'class': 'field'}));
  sidebar.append($('<span />').append(servingsInput));
  sidebar.append($('<br />'));
  sidebar.append($('<span />', {'html': '<strong>Time</strong>', 'class': 'field'}));
  sidebar.append($('<span />', {'text': duration.as('minutes') + ' mins'}));
  sidebar.append($('<br />'));

  if (recipe.nutrition) {
    sidebar.append($('<div />', {'html': '<strong>Nutrition (per serving)</strong>', 'class': 'heading'}));

    const nutritionFields = ['energy', 'fat', 'carbohydrates', 'fibre', 'protein'];
    nutritionFields.forEach(field => {
      if (!recipe.nutrition[field].magnitude) return;
      const fieldTitle = field.charAt(0).toUpperCase() + field.slice(1);
      sidebar.append($('<span />', {'html': `<strong>${fieldTitle}</strong>`, 'class': 'field'}));
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
    sidebar.append($('<span />', {'class': 'field'}).append($('<strong />', {'data-i18n': `[html]dietary-properties:${property}`})));
    sidebar.append($('<span />').append($('<img />', {
      'class': `dietary-property ${property.split('_').join('-')}`,
      'style': `-webkit-mask: url(images/symbols/${property}.svg)`,
      'data-i18n': `[title]dietary-properties:${property}`,
    })));
    sidebar.append($('<br />'));
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

  return content;
}

function recipeFormatter(value: HTMLElement, recipe: Recipe) : HTMLElement {
  const container = $('<div />');

  const attribution = attributionFormatter(recipe);
  const star = starFormatter();

  const row = $('<tr />');
  row.append(thumbnailFormatter(recipe));
  row.append(contentFormatter(recipe));
  row.append(sidebarFormatter(recipe));

  const table = $('<table />', {
    'class': 'tablesaw tablesaw-stack',
    'data-tablesaw-mode': 'stack'
  });
  table.append(row);

  container.append(attribution);
  container.append(star);
  container.append(table);

  container.append($('<button />', {
    'class': 'add btn btn-outline-primary add-recipe float-right',
    'data-i18n': i18nAttr('search:result-add-recipe')
  }));

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
    if (page === 'search' && !state.action) state['action'] = page;

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

function updateServings(recipe: Recipe) : void {
  const recipeRow = $(`div.recipe-list .recipe[data-id="${recipe.id}"]`);

  const servings: number = recipeRow.find('input.servings').val();
  scaleRecipe(recipe, servings);

  const updatedContent = contentFormatter(recipe);
  recipeRow.find('.content').replaceWith(updatedContent);
}

function updateStarState(selector: string, recipeId: string) : void {
  db.starred.get(recipeId, (starred?: Starred) => {
    const isStarred = !!starred;

    const star = $(`${selector} div.recipe-list .recipe[data-id="${recipeId}"] .star`);
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

    $(this).find('input.servings').each((_, input) => {
      $(input).on('change', () => { getRecipe(input).then(updateServings); });
    });
    $(this).find('button.add-recipe').each((_, button) => {
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
