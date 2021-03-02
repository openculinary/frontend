import $ from 'jquery';
import * as moment from 'moment';
import { Sortable } from 'sortablejs';
import i18next from 'i18next';

import { getRecipe } from '../common';
import { db } from '../database';
import { i18nAttr, localize } from '../i18n';
import { removeMeal } from '../models/meals';
import { removeRecipe } from '../models/recipes';
import { updateRecipeState } from './components/recipe-list';

function defaultDate() {
  return moment().locale(i18next.language).startOf('day');
}

function updateHints() {
  db.recipes.count(count => {
    var hints = [];
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

function recipeElement(recipe, meal) {
  var cloneRemove = $('<span />', {
    'click': removeMeal,
    'data-role': 'remove'
  });
  var title = $('<span />', {
    'class': 'tag badge badge-info',
    'text': recipe.title
  });
  title.append(cloneRemove);

  var servings = $('<span />', {
    'class': 'tag badge servings',
    'text': recipe.servings
  });

  var remove = $('<a />', {
    'class': 'remove fa fa-trash-alt',
    'style': 'float: right; margin-left: 8px; margin-top: 3px;'
  });
  remove.on('click', () => { getRecipe(remove).then(removeRecipe).then(updateRecipeState) });

  // TODO: only include 'servings' parameter when the value overrides the recipe default
  // This may require some data model refactoring
  var link = $('<a />', {
    'class': 'link fa fa-link',
    'href': `#search&action=view&id=${recipe.id}&servings=${recipe.servings}`
  });
  var item = $('<div />', {'style': 'float: left'});
  item.append(link);
  item.append(title);

  var container = $('<div />', {
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
  var container = $('#meal-planner .recipes').empty();
  db.recipes.each(recipe => {
    container.append(recipeElement(recipe));
  });

  populateNotifications();
  updateHints();
}

function renderMeals() {
  var idxDate = defaultDate();
  var endDate = defaultDate().add(1, 'week');

  var scheduler = $('#meal-planner table').empty();
  for (; idxDate < endDate; idxDate.add(1, 'day')) {
    var date = idxDate.format('YYYY-MM-DD');
    var day = idxDate.format('dddd');

    var row = $('<tr />', {
      'data-date': date,
      'class': `weekday-${idxDate.day()}`
    });
    var header = $('<th />', {'text': day});
    var cell = $('<td />');

    row.append(header);
    row.append(cell);
    scheduler.append(row);
  }

  db.transaction('r', db.meals, db.recipes, () => {
    db.meals.each(meal => {
      db.recipes.get(meal.recipe_id, recipe => {
        var cell = $(`#meal-planner table tr[data-date="${meal.datetime}"] td`);
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
  var elements = [evt.item, evt.clone];
  elements.forEach(function (element) {
    var recipeRemove = $(element).find('a.remove');
    recipeRemove.off('click');
    recipeRemove.on('click', () => { getRecipe(recipeRemove).then(removeRecipe).then(updateRecipeState) });

    var mealRemove = $(element).find('span[data-role="remove"]');
    mealRemove.off('click');
    mealRemove.on('click', removeMeal);
  });
}

function scheduleMeal(evt) {
  getRecipe(evt.item).then(recipe => {
    var toRow = $(evt.to).parents('tr');
    if (!toRow.length) return;
    var date = toRow.data('date');
    db.meals.put({
      id: recipe.mealId,
      recipe_id: recipe.id,
      datetime: date,
      servings: recipe.servings,
    }).then(id => {
      $(evt.item).data('meal-id', id);
    });
  });
}

function populateNotifications() {
  db.recipes.count(count => {
    var empty = count === 0;
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
