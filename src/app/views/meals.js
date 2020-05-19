import 'jquery';
import * as moment from 'moment';
import { Sortable } from 'sortablejs';
import i18next from 'i18next';

import './meals.css';

import { getRecipe } from '../common';
import { i18nAttr, localize } from '../i18n';
import { storage } from '../storage';
import { removeMeal } from '../models/meals';
import { removeRecipe } from '../models/recipes';
import { recipeElement } from '../views/recipes';

function defaultDate() {
  var today = moment().locale(i18next.language).startOf('day');
  return today;
}

function filterMeals(meals) {
  var startDate = defaultDate();
  var recipes = storage.recipes.load();
  $.each(meals, function(date) {
    if (date === 'undefined') delete meals[date];
    if (moment(date).isBefore(startDate, 'day')) delete meals[date];
    if (meals[date]) meals[date] = meals[date].filter(meal => meal.id in recipes);
  });
  return meals;
}

function updateHints() {
    var recipes = storage.recipes.load();
    var hints = [];
    if (Object.keys(recipes).length) {
        hints.push($('<p />', {'data-i18n': i18nAttr('meal-planner:hint-drag')}));
    } else {
        hints.push($('<p />', {'data-i18n': i18nAttr('meal-planner:empty-meal-planner')}));
        hints.push($('<p />', {'data-i18n': i18nAttr('meal-planner:feature-introduction')}));
    }
    $('#meal-planner div.hints').empty().append(hints);
    localize('#meal-planner div.hints');
}

function renderMeals() {
  updateHints();

  var meals = filterMeals(storage.meals.load());
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

    if (date in meals) {
      $.each(meals[date], function (index, recipe) {
        var element = recipeElement(recipe);
        cell.append(element);
      });
    }

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

  populateNotifications(meals);
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
    var index = meals[date].map(function(recipe) { return recipe.id; }).indexOf(recipe.id)

    if (index >= 0) meals[date].splice(index, 1);
    if (!meals[date].length) delete meals[date];

    storage.meals.remove({'hashCode': date});
    if (date in meals) storage.meals.add({'hashCode': date, 'value': meals[date]});
  }

  var toRow = $(evt.to).parents('tr');
  if (toRow.length) {
    // eslint-disable-next-line no-redeclare
    var date = toRow.data('date');

    if (!(date in meals)) meals[date] = [];
    meals[date].push(recipe);

    storage.meals.remove({'hashCode': date});
    storage.meals.add({'hashCode': date, 'value': meals[date]});
  }
}

function populateNotifications(meals) {
  var recipes = storage.recipes.load();
  var empty = Object.keys(recipes).length == 0;
  $('header span.notification.meal-planner').toggle(!empty);
  if (empty) return;

  var total = Object.keys(meals).length;
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
  storage.recipes.on('state changed', renderMeals);
});
