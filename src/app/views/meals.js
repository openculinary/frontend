import 'jquery';
import * as moment from 'moment';
import { Sortable } from 'sortablejs';

import './meals.css';

import { getRecipe } from '../common';
import { storage } from '../storage';
import { removeMeal } from '../models/meals';
import { removeRecipe } from '../models/recipes';
import { recipeElement } from '../views/recipes';

function minDate() {
  var thisHour = moment().startOf('hour');
  return thisHour.add(1, 'hours');
}

function defaultDate() {
  var today = moment().startOf('day');
  var endOfDay = today.add(17, 'hours');
  if (endOfDay < minDate()) endOfDay.add(1, 'day');
  return endOfDay;
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

function renderMeals() {
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
    var date = toRow.data('date');

    if (!(date in meals)) meals[date] = [];
    meals[date].push(recipe);

    storage.meals.remove({'hashCode': date});
    storage.meals.add({'hashCode': date, 'value': meals[date]});
  }

  if (toRow.length && !fromRow.length) {
    gtag('event', 'add_to_wishlist');
    RecipeRadar.countly.add_event('scheduleMeal');
  }
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
