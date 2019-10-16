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
    'data-id': recipe.id,
    'data-title': recipe.title
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
  var recipes = storage.recipes.load();

  var recipe = getRecipe(this);
  recipes[recipe.id] = {
    id: recipe.id,
    title: recipe.title
  };

  updateRecipeState(recipe.id, recipes);

  storage.recipes.add({'hashCode': recipe.id, 'value': recipe});

  recipe.products.forEach(function (product) {
    addProduct(product, recipe.id);
  });

  gtag('event', 'add_to_cart');
}

function removeRecipe() {
  var recipes = storage.recipes.load();

  var recipe = getRecipe(this);
  delete recipes[recipe.id];

  var products = storage.products.load();
  $.each(products, function(productId) {
    var product = products[productId];
    if (recipe.id in product.recipes) {
      removeProduct(product, recipe.id);
    }
  });

  updateRecipeState(recipe.id, recipes);

  storage.recipes.remove({'hashCode': recipe.id});
}

function updateRecipeState(recipeId, recipes) {
  var addButton = $(`#search .results .recipe[data-id="${recipeId}"] button.add-to-shopping-list`);
  var isInShoppingList = recipeId in recipes;
  addButton.prop('disabled', isInShoppingList);
  addButton.toggleClass('btn-outline-primary', !isInShoppingList);
  addButton.toggleClass('btn-outline-secondary', isInShoppingList);
}

$(function() {
  storage.recipes.on('state changed', renderMeals);
  storage.recipes.on('state changed', renderRecipes);
});
