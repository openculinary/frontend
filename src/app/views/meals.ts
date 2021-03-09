import * as $ from 'jquery';
import * as moment from 'moment';
import { Sortable } from 'sortablejs';
import i18next from 'i18next';

import { getMealId, getRecipe } from '../common';
import { Recipe, Meal, db } from '../database';
import { i18nAttr, localize } from '../i18n';
import { getState } from '../state';
import { removeMeal } from '../models/meals';
import { removeRecipe } from '../models/recipes';
import { updateRecipeState } from './components/recipe-list';

function defaultDate() {
  const state = getState();
  let date = null;
  try {
    date = moment(state['start-date'])
  } catch (e) {} /* eslint-disable-line no-empty */
  if (!date) date = moment();
  return date.locale(i18next.language).startOf('day');
}

function updateHints() {
  db.recipes.count(count => {
    const hints: string[] = [];
    if (count) {
        hints.push($('<p />', {'data-i18n': i18nAttr('meal-planner:hint-drag')}));
    } else {
        hints.push($('<p />', {'data-i18n': i18nAttr('meal-planner:empty-meal-planner')}));
        hints.push($('<p />', {'data-i18n': i18nAttr('meal-planner:feature-introduction')}));
    }
    $('#meal-planner div.hints').empty().append(hints);
    localize('#meal-planner div.hints');
  });
}

function recipeElement(recipe: Recipe, meal?: Meal) {
  const cloneRemove = $('<span />', {
    'click': removeMeal,
    'data-role': 'remove'
  });
  const title = $('<span />', {
    'class': 'tag badge badge-info',
    'text': recipe.title
  });
  title.append(cloneRemove);

  const servings = $('<span />', {
    'class': 'tag badge servings',
    'text': recipe.servings
  });

  const remove = $('<a />', {
    'class': 'remove fa fa-trash-alt',
    'style': 'float: right; margin-left: 8px; margin-top: 3px;'
  });
  remove.on('click', () => { getRecipe(remove).then(removeRecipe).then(updateRecipeState) });

  // TODO: only include 'servings' parameter when the value overrides the recipe default
  // This may require some data model refactoring
  const link = $('<a />', {
    'class': 'link fa fa-link',
    'href': `#search&action=view&id=${recipe.id}&servings=${recipe.servings}`
  });
  const item = $('<div />', {'style': 'float: left'});
  item.append(link);
  item.append(title);

  const container = $('<div />', {
    'class': 'recipe',
    'style': 'clear: both',
    'data-id': recipe.id,
    'data-meal-id': meal && meal.id
  });
  container.append(item);
  container.append(servings);
  container.append(remove);

  return container;
}

function renderRecipes() {
  const container = $('#meal-planner .recipes').empty();
  db.recipes.each(recipe => {
    container.append(recipeElement(recipe));
  });

  populateNotifications();
  updateHints();
}

function renderMeals() {
  const idxDate = defaultDate();
  const endDate = defaultDate().add(1, 'week');

  const scheduler = $('#meal-planner table').empty();
  for (; idxDate < endDate; idxDate.add(1, 'day')) {
    const date = idxDate.format('YYYY-MM-DD');
    const day = idxDate.format('dddd');

    const row = $('<tr />', {
      'data-date': date,
      'class': `weekday-${idxDate.day()}`
    });
    const header = $('<th />', {
      'html': `<div class="day">${day}</div><div class="date">${date}</div>`
    });
    const cell = $('<td />');

    row.append(header);
    row.append(cell);
    scheduler.append(row);
  }

  db.transaction('r', db.meals, db.recipes, () => {
    db.meals.each(meal => {
      db.recipes.get(meal.recipe_id, recipe => {
        const cell = $(`#meal-planner table tr[data-date="${meal.datetime}"] td`);
        cell.append(recipeElement(recipe, meal));
      });
    });
  });

  $('#meal-planner td').each(function(index, element) {
    Sortable.create(element, {
      group: {
        name: 'meal-planner'
      },
      delay: 100,
      onEnd: scheduleMeal
    });
  });

  populateNotifications();
}

function dragMeal(evt) {
  const elements = [evt.item, evt.clone];
  elements.forEach(function (element) {
    const recipeRemove = $(element).find('a.remove');
    recipeRemove.off('click');
    recipeRemove.on('click', () => { getRecipe(recipeRemove).then(removeRecipe).then(updateRecipeState) });

    const mealRemove = $(element).find('span[data-role="remove"]');
    mealRemove.off('click');
    mealRemove.on('click', removeMeal);
  });
}

function scheduleMeal(evt) {
  getRecipe(evt.item).then(recipe => {
    const toRow = $(evt.to).parents('tr');
    if (!toRow.length) return;
    const date = toRow.data('date');
    // TODO: Can we avoid duplicate work across getRecipe and getMealId calls here?
    getMealId(evt.item).then(mealId => {
      db.meals.put({
        id: mealId,
        recipe_id: recipe.id,
        datetime: date,
        servings: recipe.servings,
      }).then(id => {
        $(evt.item).data('meal-id', id);
      });
    });
  });
}

function populateNotifications() {
  db.recipes.count(count => {
    const empty: boolean = count === 0;
    $('header span.notification.meal-planner').toggle(!empty);
    if (empty) return;

    // TODO: Figure out why display:block is being applied incorrectly, and
    // then remove this workaround
    $('header span.notification.meal-planner').css({'display': 'inline'});

    db.meals.count(total => {
      $('header span.notification.meal-planner').text(total);
    });
  });
}

$(function() {
  $('#meal-planner .recipes').each(function(index, element) {
    Sortable.create(element, {
      group: {
        name: 'meal-planner',
        pull: 'clone',
        put: false
      },
      delay: 100,
      sort: false,
      onClone: dragMeal,
      onEnd: scheduleMeal
    });
  });

  db.on('changes', changes => { changes.find(c => c.table === 'meals') && renderMeals() });
  db.on('changes', changes => { changes.find(c => c.table === 'recipes') && renderRecipes() });

  renderMeals();
  renderRecipes();
});
