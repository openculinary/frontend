function renderToken(token) {
  switch (token.type) {
    case 'text': return renderText(token);
    case 'product': return renderProduct(token);
    case 'quantity': return renderQuantity(token);
    case 'units': return renderUnits(token);
    default: return '';
  }
}

function renderText(token) {
  if (!token.value) return '';
  return token.value;
}

function renderProduct(token) {
  return '<span class="tag badge ' + token.state + '">' + token.value + '</span>'
}

function renderQuantity(token) {
  if (!token.value) return '';
  return float2rat(token.value);
}

function renderUnits(token) {
  return renderText(token);
}

function titleFormatter(recipe) {
  var title = $('<div />', {'class': 'title'});
  $('<img />', {'src': 'images/domains/' + recipe.domain + '.ico', 'alt':''}).appendTo(title);
  $('<a />', {
    'href': recipe.src,
    'text': recipe.title,
    'target': '_blank',
    'rel': 'noreferrer'
  }).appendTo(title);
  return title;
}

function sidebarFormatter(recipe) {
  var duration = moment.duration(recipe.time, 'minutes');
  var sidebar = $('<td />', {'class': 'sidebar'});
  $('<img />', {'src': recipe.image_url, 'alt': recipe.title}).appendTo(sidebar);
  $('<span />', {'html': '<strong>serves</strong>'}).appendTo(sidebar);
  $('<span />', {'text': recipe.servings}).appendTo(sidebar);
  $('<br />').appendTo(sidebar);
  $('<span />', {'html': '<strong>time</strong>'}).appendTo(sidebar);
  $('<span />', {'text': duration.as('minutes') + ' mins'}).appendTo(sidebar);
  return sidebar;
}

function contentFormatter(recipe) {
  var content = $('<td />', {'class': 'content'});

  var tabs = $('<div />', {'class': 'nav tabs'});
  tabs.append($('<a />', {
    'class': 'nav-link active',
    'text': 'Ingredients',
    'data-target': 'ingredients'
  }));
  tabs.append($('<a />', {
    'class': 'nav-link',
    'text': 'Directions',
    'data-target': 'directions'
  }));
  content.append(tabs);

  var ingredients = $('<div />', {'class': 'tab ingredients'});
  var ingredientList = $('<ul />');
  $.each(recipe.ingredients, function() {
    ingredientList.append($('<li />', {'html': this.tokens.map(renderToken).join('')}));
  });
  ingredients.append(ingredientList);
  ingredients.append($('<button />', {
    'class': 'btn btn-outline-primary add-to-shopping-list',
    'text': 'Add to shopping list'
  }));
  content.append(ingredients);

  var directions = $('<div />', {'class': 'tab directions collapse'});
  var directionList = $('<ul />');
  $.each(recipe.directions, function() {
    directionList.append($('<li />', {'html': this.tokens.map(renderToken).join('')}));
  });
  directions.append(directionList);
  content.append(directions);

  return content;
}

function recipeFormatter(value, recipe, index) {
  var container = $('<div />');
  var title = titleFormatter(recipe);
  var table = $('<table />', {
    'class': 'tablesaw tablesaw-stack',
    'data-tablesaw-mode': 'stack'
  });
  var row = $('<tr />');
  row.append(sidebarFormatter(recipe));
  row.append(contentFormatter(recipe));
  row.appendTo(table);
  container.append(title);
  container.append(table);
  return container.html();
}

function getRecipeProducts(recipe) {
  var recipeProducts = [];
  recipe.ingredients.forEach(function(ingredient) {
    var productToken, quantityToken, unitsToken;
    ingredient.tokens.forEach(function(token) {
      if (token.type == 'product') productToken = token;
      if (token.type == 'quantity') quantityToken = token;
      if (token.type == 'units') unitsToken = token;
    });

    recipeProducts.push({
      product: productToken.value,
      category: productToken.category,
      singular: productToken.singular,
      plural: productToken.plural,
      state: productToken.state,
      quantity: quantityToken ? quantityToken.value : null,
      units: unitsToken ? unitsToken.value : null
    });
  });
  return recipeProducts;
}

function rowAttributes(row) {
  return {
    'class': 'recipe',
    'data-id': row.id,
    'data-title': row.title,
    'data-products': JSON.stringify(getRecipeProducts(row))
  }
}

function selectTab() {
  var recipe = getRecipe(this);
  var target = $(this).data('target');
  $(`#search .results .recipe[data-id="${recipe.id}"] div.tabs a`).removeClass('active');
  $(`#search .results .recipe[data-id="${recipe.id}"] div.tabs a[data-target="${target}"]`).addClass('active');
  $(`#search .results .recipe[data-id="${recipe.id}"] div.tab`).addClass('collapse');
  $(`#search .results .recipe[data-id="${recipe.id}"] div.tab.${target}`).removeClass('collapse');
}

function recipeRedirect() {
  gtag('event', 'generate_lead');
}

function scrollToSearchResults() {
  var scrollTop = $('#search .results').offset().top - $('header').height() - 32;
  $('html, body').animate({scrollTop: scrollTop}, 500);
}

function pushSearch() {
  var state = {'action': 'search'};
  ['#include', '#exclude'].forEach(function (element) {
    var fragment = element.replace('#', '');
    var data = $(element).val();
    if (data.length > 0) {
      state[fragment] = data.join(',');
    }
  })
  var sortChoice = $.bbq.getState('sort');
  if (sortChoice) state['sort'] = sortChoice;
  // bbq merge mode 2: completely replace fragment state
  $.bbq.pushState(state, 2);
}
$('#search button').click($.throttle(1000, true, pushSearch));

function executeSearch() {
  var params = {
    include: $('#include').val(),
    exclude: $('#exclude').val()
  };
  var sortChoice = $.bbq.getState('sort');
  if (sortChoice) params['sort'] = sortChoice;
  $('#search .results table').bootstrapTable('refresh', {
    url: '/api/recipes/search?' + $.param(params),
    pageNumber: Number($.bbq.getState('page') || 1)
  });
  $('#search .results').show();
  scrollToSearchResults();
  gtag('event', 'search');
}

function executeView() {
  var id = $.bbq.getState('id');
  $('#search .results').show();
  $('#search .results table').bootstrapTable('refresh', {
    url: '/api/recipes/' + encodeURIComponent(id) + '/view'
  });
  scrollToSearchResults();
}

$('#search .results table').on('page-change.bs.table', function(e, number, size) {
  $(window).off('hashchange').promise().then(function () {;
    if (number > 1) $.bbq.pushState({'page': number});
    else $.bbq.removeState('page');
    scrollToSearchResults();
  }).promise().then(function() {
    $(window).on('hashchange', loadState);
  });
});

function renderRefinement(refinement) {
  if (refinement == 'match_any') {
    return $('<div />', {
        'text': `Couldn't find recipes containining every ingredient - partial matches are displayed.`
    });
  }
  if (refinement.startsWith('removed:')) {
    var product = refinement.split(':')[1];
    $(`span.positive + div.bootstrap-tagsinput span.tag.badge:contains('${product}')`).css('background-color', 'silver');
    return $('<div />', {
        'text': `Ingredient '${product}' didn't match any recipes and has been removed from the search.  `
    });
  }
}

$('#search .results table').on('load-success.bs.table', function(e, data) {
  $(`span.positive + div.bootstrap-tagsinput span.tag.badge`).css('background-color', '');
  var refinements = $('#search .refinements');
  refinements.empty();
  data.refinements.forEach(function(refinement) {
    refinements.append(renderRefinement(refinement));
  });
  refinements.toggleClass('collapse', data.refinements.length == 0);

  var sortOptions = [
    {val: 'relevance', text: 'most relevant'},
    {val: 'ingredients', text: 'fewest extras required'},
    {val: 'duration', text: 'shortest time to make'},
  ];
  var sortChoice = $.bbq.getState('sort') || sortOptions[0].val;

  var sortSelect = $('<select>').attr('aria-label', 'Recipe sort selection');
  $(sortOptions).each(function() {
    var sortOption = $('<option>');
    sortOption.text(this.text);
    sortOption.attr('value', this.val);
    if (sortChoice === this.val) sortOption.attr('selected', 'selected');
    sortSelect.append(sortOption);
  });
  sortSelect.on('change', function() {
    var sort = this.value;
    $(window).off('hashchange').promise().then(function () {
      $.bbq.removeState('page');
      $(window).on('hashchange', loadState).promise().then(function () {
        $.bbq.pushState({'sort': sort});
      });
    });
  });

  var sortPrompt = $('<span>').text('Order by ');
  sortSelect.appendTo(sortPrompt);

  var paginationDetail = $('#search .results div.pagination-detail').empty();
  if ($.bbq.getState('action') === 'search') sortPrompt.appendTo(paginationDetail);

  $(this).find('.title a').on('click', recipeRedirect);
  $(this).find('.content .tabs a.nav-link').on('click', selectTab);
  $(this).find('.content button.add-to-shopping-list').on('click', addRecipe);
});

$('#search .results table').on('post-body.bs.table', function(data) {
  var data = $(this).bootstrapTable('getData');
  if (!Array.isArray(data)) return;

  var recipes = storage.recipes.load();
  data.forEach(function (row) {
    updateRecipeState(row.id, recipes);
  });
});
