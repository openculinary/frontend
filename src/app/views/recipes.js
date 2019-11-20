import 'jquery';

import { storage } from '../storage';
import { removeMeal } from '../models/meals';
import { removeRecipe } from '../models/recipes';

export { recipeElement };

function recipeElement(recipe) {
  var link = $('<a />', {'class': 'remove fa fa-link', 'href': `#search&action=view&id=${recipe.id}`});
  var cloneRemove = $('<span />', {
    'click': removeMeal,
    'data-role': 'remove'
  });

  var title = $('<span />', {
    'class': 'tag badge badge-info',
    'text': recipe.title
  });
  title.append(cloneRemove);

  var remove = $('<a />', {
    'class': 'remove fa fa-trash-alt',
    'style': 'float: right; margin-left: 8px; margin-top: 3px;'
  });
  remove.on('click', removeRecipe);

  var item = $('<div />', {
    'style': 'float: left'
  });
  item.append(link);
  item.append(title);

  var container = $('<div />', {
    'class': 'recipe',
    'style': 'clear: both',
    'data-id': recipe.id
  });
  container.append(item);
  container.append(remove);

  return container;
}

function renderRecipes() {
  var recipes = storage.recipes.load();
  var recipesHtml = $('#meal-planner .recipes').empty();
  $.each(recipes, function(recipeId) {
    var recipe = recipes[recipeId];
    recipeElement(recipe).appendTo(recipesHtml);
  });
}

$(function() {
  storage.recipes.on('state changed', renderRecipes);
});
