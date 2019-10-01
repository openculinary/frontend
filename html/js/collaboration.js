async function createSet(app, collaborationId, callback) {
  var s = (await app.collaborate(collaborationId, 'rwlwwset')).shared;
  var fns = {add: s.add, remove: s.remove};
  s.add = function(value) { fns.add(Date.now(), value) };
  s.remove = function(value) { fns.remove(Date.now(), value) };
  s.on('state changed', callback);
  return s;
}

function generateCollaborationId() {
  var byteArray = new Uint8Array(16);
  window.crypto.getRandomValues(byteArray);
  return base58.encode(byteArray);
}

function getCollaborationId(createSession) {
  var collaborationId;
  if (!collaborationId) collaborationId = $.bbq.getState('collaborationId');
  if (!collaborationId) collaborationId = window.localStorage.getItem('collaborationId');
  if (!collaborationId) collaborationId = createSession ? generateCollaborationId() : null;
  if (createSession) window.localStorage.setItem('collaborationId', collaborationId);
  return collaborationId;
}

function handleRecipeChanges(state) {
  updateCollaborationState();
}

function handleMealChanges(state) {
  updateCollaborationState();
}

function handleShoppingListChanges(state) {
  updateCollaborationState();
}

function updateCollaborationState() {
  var meals = {}
  mealPlanCollab.value().forEach(function(date) {
    meals[date.hashCode] = date.value;
  });

  storeMeals(meals);
  renderMeals(meals);

  var products = {};
  productCollab.value().forEach(function(product) {
    products[product.hashCode] = product.value;
  });

  storeProducts(products);
  renderProducts(products);

  var recipes = loadRecipes();
  recipeCollab.value().forEach(function(recipe) {
    recipes[recipe.hashCode] = recipe.value;
  });

  storeRecipes(recipes);
  renderRecipes(recipes);
}

function clearCollaborationState() {
  if (productCollab) productCollab.stop(), productCollab = null;
  if (mealPlanCollab) mealPlanCollab.stop(), mealPlanCollab = null;
  if (recipeCollab) recipeCollab.stop(), recipeCollab = null;
  if (app) app = null;

  var link = $('#collaboration-link');
  link.attr('href', null);
  link.css('color', 'silver');
  link.on('click', joinCollaborationSession);
}

var app, recipeCollab, mealPlanCollab, productCollab;
async function joinCollaborationSession() {
  var link = $('#collaboration-link');
  link.removeClass();
  link.addClass('nav-link fa fa-spinner fa-spin')
  link.off('click');

  $.ajaxSetup({'cache': true});
  $.getScript('vendors/npm/peer-base.min.js', async function() {
    var collaborationId = getCollaborationId(true);
    app = window.peerBase(`rr-app-${collaborationId}`);
    await app.start();

    recipeCollab = await createSet(app, `rs-collab-${collaborationId}`, handleRecipeChanges);
    mealPlanCollab = await createSet(app, `mp-collab-${collaborationId}`, handleMealChanges);
    productCollab = await createSet(app, `sl-collab-${collaborationId}`, handleShoppingListChanges);

    link.removeClass();
    link.addClass('nav-link fa fa-share-alt-square')
    link.attr('href', `#action=join&collaborationId=${collaborationId}`);
    link.css('color', 'lime');
    link.on('dblclick', leaveCollaborationSession);
  });
}

function leaveCollaborationSession() {
  clearCollaborationState();
}

$(function () {
  clearCollaborationState();
  var collaborationId = getCollaborationId();
  if (collaborationId) joinCollaborationSession();
});
