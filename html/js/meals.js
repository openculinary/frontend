function filterMeals(meals) {
  var startDate = defaultDate();
  $.each(meals, function(date) {
    if (date === 'undefined') delete meals[date];
    if (moment(date).isBefore(startDate, 'day')) delete meals[date];
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
    new Sortable(element, {
      group: {
        name: 'meal-planner'
      },
      delay: 100,
      onEnd: endHandler
    });
  });
}

function removeMeal() {
  var meals = storage.meals.load();
  var recipe = getRecipe(this);

  var date = $(this).parents('tr').data('date');
  var index = meals[date].map(function(recipe) { return recipe.id; }).indexOf(recipe.id);

  if (index >= 0) meals[date].splice(index, 1);
  if (!meals[date].length) delete meals[date];

  storage.meals.remove({'hashCode': date});
  if (date in meals) storage.meals.add({'hashCode': date, 'value': meals[date]});
}

function removeRecipeFromMeals() {
  var meals = storage.meals.load();
  var recipe = getRecipe(this);

  $.each(meals, function(date) {
    meals[date] = meals[date].filter(meal => meal.id != recipe.id);
    if (!meals[date].length) delete meals[date];

    storage.meals.remove({'hashCode': date});
    if (date in meals) storage.meals.add({'hashCode': date, 'value': meals[date]});
  });
}

function cloneHandler(evt) {
  var elements = [evt.item, evt.clone];
  elements.forEach(function (element) {
    var recipeRemove = $(element).find('a.remove');
    recipeRemove.off('click');
    recipeRemove.on('click', removeRecipe);
    recipeRemove.on('click', removeRecipeFromMeals);

    var mealRemove = $(element).find('span[data-role="remove"]');
    mealRemove.off('click');
    mealRemove.on('click', removeMeal);

    gtag('event', 'add_to_wishlist');
  });
}

function endHandler(evt) {
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
}

$(function() {
  $('#meal-planner .recipes').each(function(index, element) {
    new Sortable(element, {
      group: {
        name: 'meal-planner',
        pull: 'clone',
        put: false
      },
      delay: 100,
      sort: false,
      onClone: cloneHandler,
      onEnd: endHandler
    });
  });
});

$(function() {
  storage.meals.on('state changed', renderMeals);
  storage.meals.on('state changed', renderProducts);
});
