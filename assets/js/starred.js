function renderStarred() {
  var data = [];
  var starred = storage.starred.load();
  $.each(starred, function (recipeId) {
    var recipe = getRecipeById(recipeId);
    if (recipe) data.push(recipe);
  });

  var recipeList = $('#starred-recipes div.recipe-list table');
  recipeList.bootstrapTable('load', data);
  recipeList.bootstrapTable('refreshOptions', {
    formatNoMatches: function() {
      return `
        <p>You don't have any starred recipes at the moment.</p>
        <p>Recipes you star in <a href='#search'>search</a> results will appear here.</p>
      `;
    }
  });
}

function starRecipe() {
  var recipe = getRecipe(this);

  storage.starred.add({'hashCode': recipe.id, 'value': recipe});
  updateStarState(recipe.id);

  gtag('event', 'select_content');
}

function unstarRecipe() {
  var recipe = getRecipe(this);

  storage.starred.remove({'hashCode': recipe.id});
  updateStarState(recipe.id);
}

$(function() {
  storage.starred.on('state changed', renderStarred);

  initTable('#starred-recipes');
});
