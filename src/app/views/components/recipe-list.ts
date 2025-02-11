import { Duration } from 'luxon';
import * as $ from 'jquery';
import 'tablesaw/dist/stackonly/tablesaw.stackonly.jquery.js';

import { getRecipe } from '../../common';
import { renderQuantity } from '../../conversion';
import { Recipe, Starred, db } from '../../database';
import { i18nAttr, localize, resolvedLocale } from '../../i18n';
import { renderIngredientHTML } from '../../recipeml';
import { getState, pushState, renderStateHash } from '../../state';
import { addRecipe, scaleRecipe } from '../../models/recipes';
import { starRecipe, unstarRecipe } from '../../models/starred';

export {
    initTable,
    bindLoadEvent,
    recipeFormatter,
    rowAttributes,
    rowStyle,
    scrollToResults,
    updateRecipeState,
};

function attributionFormatter(recipe: Recipe) : $ {
  const container = $('<div />', {'class': 'attribution'});

  const title = $('<a />', {
    'class': 'title',
    'href': recipe.dst,
    'ping': `/api/redirect/recipe/${recipe.id}`,
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
  return $('<div />', {'class': 'star', 'html': '&#x269d;'});
}

function reportProblemFormatter() {
  const container = $('<a />');
  container.append($('<div />', {'class': 'report-problem', 'html': '&#x26a0;'}));
  container.append($('<div />', {'class': 'lh-lg', 'data-i18n': i18nAttr('search:result-report-problem')}));

  container.on('click', () => {
    console.log("TODO: open problem report dialog");
  });
  return container;
}

function nutritionFormatter(recipe) : $ {
  const nutrition = $('<td />', {'class': 'nutrition align-top'});
  if (recipe.nutrition) {
    nutrition.append($('<div />', {'html': '<strong>Nutrition (per serving)</strong>', 'class': 'heading'}));

    const nutritionFields = ['energy', 'fat', 'carbohydrates', 'fibre', 'protein'];
    nutritionFields.forEach(field => {
      if (!recipe.nutrition[field].magnitude) return;
      const fieldTitle = field.charAt(0).toUpperCase() + field.slice(1);
      nutrition.append($('<span />', {'html': `<strong>${fieldTitle}</strong>`, 'class': 'field'}));
      const quantity = renderQuantity(recipe.nutrition[field], false);
      nutrition.append($('<span />', {'html': `${quantity.magnitude || ''} ${quantity.units || ''}`.trim()}));
      nutrition.append($('<br />'));
    });
  }
  return nutrition;
}

function sidebarFormatter(recipe) : $ {
  const duration = Duration.fromObject({minutes: recipe.time}, {locale: resolvedLocale()});

  const sidebar = $('<td />', {'class': 'sidebar align-top'});

  const servingsInput = $('<input>', {
      'class': 'servings',
      'min': 1,
      'max': 50,
      'size': 3,
      'type': 'number',
      'value': recipe.servings,
  });
  servingsInput.attr('aria-label', 'Serving count selection');

  sidebar.append($('<span />', {'html': '<strong>Servings</strong>', 'class': 'field'}));
  sidebar.append($('<span />').append(servingsInput));
  sidebar.append($('<br />'));
  sidebar.append($('<span />', {'html': '<strong>Time</strong>', 'class': 'field'}));
  sidebar.append($('<span />', {'text': duration.shiftTo('minutes').toHuman()}));
  sidebar.append($('<br />'));

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
  row.append(nutritionFormatter(recipe));
  row.append(contentFormatter(recipe));
  row.append(sidebarFormatter(recipe));

  const table = $('<table />', {
    'class': 'tablesaw tablesaw-stack',
    'data-tablesaw-mode': 'stack'
  });
  table.append(row);

  const reportProblem = reportProblemFormatter();

  container.append(attribution);
  container.append(star);
  container.append(table);
  container.append(reportProblem);

  container.append($('<button />', {
    'class': 'add btn btn-outline-primary add-recipe float-right',
    'data-i18n': i18nAttr('search:result-add-recipe')
  }));

  return container.html();
}

function rowAttributes(row: HTMLElement) : Record<string, string> {
  return {'data-id': row.id};
}

function rowStyle() : Record<string, string> {
  return {'classes': 'recipe'};
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
  });
}

function updateRecipeState(recipeId: string) : void {
  void db.recipes.get(recipeId, (recipe?: Recipe) => {
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
  void db.starred.get(recipeId, (starred?: Starred) => {
    const isStarred = !!starred;

    const star = $(`${selector} div.recipe-list .recipe[data-id="${recipeId}"] .star`);
    star.html(isStarred ? '&#x2b50;' : '&#x269d;');
    star.off('click');
    star.on('click', () => {
      const toggleStarred = isStarred ? unstarRecipe : starRecipe;
      void getRecipe(star).then(toggleStarred).then(recipeId => { updateStarState(selector, recipeId) });
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
      $(input).on('change', () => { void getRecipe(input).then(updateServings); });
    });
    $(this).find('button.add-recipe').each((_, button) => {
      $(button).on('click', () => { void getRecipe(button).then(addRecipe).then(updateRecipeState); });
    });
    if (data && location.hash) {
      $(this).parents('div.recipe-list').show();
    }

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
