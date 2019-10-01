function loadRecipes() {
  var recipes = JSON.parse(window.localStorage.getItem('recipes')) || {};

  var meals = loadMeals();
  var recipeCounts = {};
  $.each(meals, function(date) {
    meals[date].forEach(function (recipe) {
      if (!(recipe.id in recipeCounts)) recipeCounts[recipe.id] = 0;
      recipeCounts[recipe.id]++;
    });
  });
  $.each(recipes, function(recipeId) {
    recipes[recipeId].multiple = recipeCounts[recipeId] || 1;
  });

  return recipes;
}

function storeRecipes(recipes) {
  window.localStorage.setItem('recipes', JSON.stringify(recipes));
}

function recipeElement(recipe) {
  var remove = $('<a />', {'class': 'remove fa fa-trash-alt'});
  remove.on('click', removeRecipe);

  // TODO: Make this implicit; reload and filter meal plan after recipe removals
  remove.on('click', removeRecipeFromMeals);

  var link = $('<a />', {'class': 'remove fa fa-link', 'href': `#search&action=view&id=${recipe.id}`});

  var title = $('<span />', {
    'class': 'tag badge badge-info',
    'text': recipe.title
  });
  var cloneRemove = $('<span />', {
    'click': removeMeal,
    'data-role': 'remove'
  });
  var item = $('<div />', {
    'class': 'recipe',
    'data-id': recipe.id,
    'data-title': recipe.title
  });

  link.appendTo(item);
  remove.appendTo(item);
  cloneRemove.appendTo(title);
  title.appendTo(item);
  return item;
}

function renderRecipes(recipes) {
  var recipesHtml = $('#meal-planner .recipes').empty();
  $.each(recipes, function(recipeId) {
    var recipe = recipes[recipeId];
    recipeElement(recipe).appendTo(recipesHtml);
  });
}

function addRecipe() {
  var recipes = loadRecipes();

  var recipe = getRecipe(this);
  recipes[recipe.id] = {
    id: recipe.id,
    title: recipe.title,
    multiple: 1
  };

  updateRecipeState(recipe.id, recipes);

  if (recipeCollab) {
    recipeCollab.add({'hashCode': recipe.id, 'value': recipe});
  }

  storeRecipes(recipes);
  renderRecipes(recipes);

  var products = loadProducts();
  $.each(recipe.products, function(productId) {
    var product = recipe.products[productId];
    addProduct(products, product, recipe.id);
  });

  storeProducts(products);
  renderProducts(products);

  gtag('event', 'add_to_cart');
}

function removeRecipe() {
  var recipes = loadRecipes();

  var recipe = getRecipe(this);
  delete recipes[recipe.id];

  var products = loadProducts();
  $.each(products, function(productId) {
    var product = products[productId];
    if (recipe.id in product.recipes) {
      removeProduct(products, product, recipe.id);
    }
  });

  storeProducts(products);
  renderProducts(products);

  updateRecipeState(recipe.id, recipes);

  if (recipeCollab) {
    recipeCollab.remove({'hashCode': recipe.id});
  }

  storeRecipes(recipes);
  renderRecipes(recipes);
}

function updateRecipeState(recipeId, recipes) {
  var addButton = $(`#search .results .recipe[data-id="${recipeId}"] button.add-to-shopping-list`);
  var isInShoppingList = recipeId in recipes;
  addButton.prop('disabled', isInShoppingList);
  addButton.toggleClass('btn-outline-primary', !isInShoppingList);
  addButton.toggleClass('btn-outline-secondary', isInShoppingList);
}

$(function () {
  var recipes = loadRecipes();
  renderRecipes(recipes);
});
