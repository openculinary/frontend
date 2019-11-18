import 'jquery';

import { getRecipe } from './common';
import { removeMeal, renderMeals } from './pages/meals';
import { addProduct, removeProduct } from './pages/products';
import { storage } from './storage';
import { updateRecipeState } from './ui/recipe-list';

export { addRecipe, removeRecipe, recipeElement };

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

function addRecipe() {
  var recipe = getRecipe(this);

  storage.recipes.add({'hashCode': recipe.id, 'value': recipe});
  updateRecipeState(recipe.id);

  recipe.products.forEach(function (product) {
    addProduct(product, recipe.id);
  });

  gtag('event', 'add_to_cart');
}

function removeRecipe() {
  var recipe = getRecipe(this);

  var products = storage.products.load();
  $.each(products, function(productId) {
    var product = products[productId];
    if (recipe.id in product.recipes) {
      removeProduct(product, recipe.id);
    }
  });

  storage.recipes.remove({'hashCode': recipe.id});
  updateRecipeState(recipe.id);
}

$(function() {
  storage.recipes.on('state changed', renderRecipes);
  storage.recipes.on('state changed', renderMeals);
});
