import * as $ from 'jquery';
import { DateTime } from 'luxon';
import { Sortable } from 'sortablejs';

import { getMealId, getRecipe } from '../common';
import { Recipe, Meal, db } from '../database';
import { i18nAttr, localize, resolvedLocale } from '../i18n';
import { getState, pushState, renderStateHash } from '../state';
import { removeMeal } from '../models/meals';
import { removeRecipe } from '../models/recipes';
import { updateRecipeState } from './components/recipe-list';

export {};

function defaultDate() {
  const locale = resolvedLocale();
  const queryDate = getState()['start-date'];
  if (queryDate) return DateTime.fromISO(queryDate, {locale});
  const tableDate = $('#meal-planner table tr[data-date]').data('date');
  if (tableDate) return DateTime.fromISO(tableDate, {locale});
  return DateTime.now().reconfigure({locale}).startOf('day');
}

function updateHints() {
  void db.recipes.count(count => {
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
    'class': 'title',
    'text': recipe.title
  });
  title.append(cloneRemove);

  const servings = $('<span />', {
    'class': 'servings',
    'text': recipe.servings
  });

  const remove = $('<a />', {
    'class': 'remove',
    'style': 'float: right; margin-left: 8px; margin-top: 3px;',
    'html': '&#x1f5d1',
  });
  remove.on('click', () => { void getRecipe(remove).then(removeRecipe).then(updateRecipeState) });

  // TODO: only include 'servings' parameter when the value overrides the recipe default
  // This may require some data model refactoring
  const link = $('<a />', {
    'class': 'link',
    'href': `#search&action=view&id=${recipe.id}&servings=${recipe.servings}`,
    'html': '&#x1f517;'
  });
  const item = $('<div />', {'style': 'float: left'});
  item.append(link);
  item.append(title);

  const container = $('<div />', {
    'class': 'recipe meal',
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
  void db.recipes.each(recipe => {
    container.append(recipeElement(recipe));
  });

  populateNotifications();
  updateHints();
}

function pushSchedulerNavigation() {
  const date = $(this).data('date');
  const state = {'meal-planner': null, 'start-date': date};
  const stateHash: string = renderStateHash(state);
  pushState(state, stateHash);
  $(window).trigger('popstate');
}

function schedulerNavigationHyperlink(target, targetDate) {
  const arrow = target == 'forward' ? '&#x21d2;' : '&#x21d0';
  const date = targetDate.toISODate();
  return $('<a />', {
    'class': target,
    'click': pushSchedulerNavigation,
    'data-date': date,
    'href': `#meal-planner&start-date=${date}`,
    'html': arrow
  });
}

function renderMeals() {
  let idxDate = defaultDate();
  const prevDate = idxDate.plus({weeks: -1});
  const nextDate = defaultDate().plus({weeks: 1});
  const todaysDate = DateTime.now().setLocale(resolvedLocale()).startOf('day');

  const schedulerNavigation = $('#meal-planner div.scheduler-navigation').empty();
  schedulerNavigation.append(schedulerNavigationHyperlink('backward', prevDate));
  schedulerNavigation.append(schedulerNavigationHyperlink('forward', nextDate));

  const scheduler = $('#meal-planner table').empty();
  for (; idxDate < nextDate; idxDate = idxDate.plus({days: 1})) {
    const date = idxDate.toISODate();
    const dayIsToday = idxDate.equals(todaysDate);

    const row = $('<tr />', {
      'data-date': date,
      'class': `weekday-${idxDate.weekday}` + (dayIsToday ? ' today': '')
    });
    const header = $('<th />', {
      'html': `<div class="day">${idxDate.weekdayLong}</div><div class="date">${date}</div>`
    });
    const cell = $('<td />');

    row.append(header);
    row.append(cell);
    scheduler.append(row);
  }

  void db.transaction('r', db.meals, db.recipes, () => {
    void db.meals.each(meal => {
      void db.recipes.get(meal.recipe_id, recipe => {
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
    recipeRemove.on('click', () => { void getRecipe(recipeRemove).then(removeRecipe).then(updateRecipeState) });

    const mealRemove = $(element).find('span[data-role="remove"]');
    mealRemove.off('click');
    mealRemove.on('click', removeMeal);
  });
}

function scheduleMeal(evt) {
  void getRecipe(evt.item).then(recipe => {
    const toRow = $(evt.to).parents('tr');
    if (!toRow.length) return;
    const date = toRow.data('date');
    // TODO: Can we avoid duplicate work across getRecipe and getMealId calls here?
    void getMealId(evt.item).then(mealId => {
      void db.meals.put({
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
  void db.recipes.count(count => {
    const empty: boolean = count === 0;
    $('header span.notification.meal-planner').toggle(!empty);
    if (empty) return;

    // TODO: Figure out why display:block is being applied incorrectly, and
    // then remove this workaround
    $('header span.notification.meal-planner').css({'display': 'inline'});

    void db.meals.count(total => {
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

  $('body > div.container[id="meal-planner"]').on('page:load', () => {
    renderMeals();
    renderRecipes();
  });

  renderMeals();
  renderRecipes();
});
