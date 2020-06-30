import 'jquery';
import * as moment from 'moment';
import { Sortable } from 'sortablejs';
import i18next from 'i18next';

import { getRecipe } from '../common';
import { db } from '../database';
import { i18nAttr, localize } from '../i18n';
import { storage } from '../storage';
import { removeMeal } from '../models/meals';
import { removeRecipe } from '../models/recipes';

function defaultDate() {
  return moment().locale(i18next.language).startOf('day');
}

function updateHints() {
    var count = db.recipes.count();
    var hints = [];
    if (count) {
        hints.push($('<p />', {'data-i18n': i18nAttr('meal-planner:hint-drag')}));
    } else {
        hints.push($('<p />', {'data-i18n': i18nAttr('meal-planner:empty-meal-planner')}));
        hints.push($('<p />', {'data-i18n': i18nAttr('meal-planner:feature-introduction')}));
    }
    $('#meal-planner div.hints').empty().append(hints);
    localize('#meal-planner div.hints');
}

function recipeElement(recipe) {
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
  remove.on('click', removeRecipe);

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
    'data-meal-id': recipe.mealId
  });
  container.append(item);
  container.append(servings);
  container.append(remove);

  return container;
}

function renderRecipes() {
  var container = $('#meal-planner .recipes').empty();
  var recipes = db.recipes.toArray();
  $.each(recipes, function(recipeId) {
    var recipe = recipes[recipeId];
    container.append(recipeElement(recipe));
  });
}

function renderMeals() {
  updateHints();

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

    var meals = db.meals.where({datetime: date}).toArray();
    $.each(meals, function (index, meal) {
      var recipe = db.recipes.get(meal.recipe_id);
      cell.append(recipeElement(recipe));
    });

    row.append(header);
    row.append(cell);
    scheduler.append(row);
  }

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
    recipeRemove.on('click', removeRecipe);

    var mealRemove = $(element).find('span[data-role="remove"]');
    mealRemove.off('click');
    mealRemove.on('click', removeMeal);
  });
}

function scheduleMeal(evt) {
  var meals = storage.meals.load();
  var recipe = getRecipe(evt.item);

  var fromRow = $(evt.from).parents('tr');
  if (fromRow.length) {
    var date = fromRow.data('date');
    var index = meals[date].map(meal => meal.id).indexOf(recipe.id)

    if (index >= 0) meals[date].splice(index, 1);
    if (!meals[date].length) delete meals[date];

    storage.meals.remove({'hashCode': date});
    if (date in meals) storage.meals.add({'hashCode': date, 'value': meals[date]});
  }

  var toRow = $(evt.to).parents('tr');
  if (toRow.length) {
    // eslint-disable-next-line no-redeclare
    var date = toRow.data('date');
    db.meals.put({
      id: recipe.mealId,
      recipe_id: recipe.id,
      datetime: date,
      servings: recipe.servings,
    }).then(id => {
      recipe.mealId = id;

      meals[date] = meals[date] || [];
      meals[date].push(recipe);

      storage.meals.remove({'hashCode': date});
      storage.meals.add({'hashCode': date, 'value': meals[date]});
    });
  }
}

function populateNotifications(meals) {
  var empty = db.recipes.count() === 0;
  $('header span.notification.meal-planner').toggle(!empty);
  if (empty) return;

  var total = db.meals.count();
  $('header span.notification.meal-planner').text(total);
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

  storage.meals.on('state changed', renderMeals);
  storage.recipes.on('state changed', renderRecipes);
  storage.recipes.on('state changed', renderMeals);
});
