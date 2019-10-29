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

function recipeRedirect() {
  gtag('event', 'generate_lead');
}

function pushSearch() {
  var state = {'action': 'search'};
  ['#include', '#exclude', '#equipment'].forEach(function (element) {
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
    exclude: $('#exclude').val(),
    equipment: $('#equipment').val(),
  };
  var sortChoice = $.bbq.getState('sort');
  if (sortChoice) params['sort'] = sortChoice;
  $('#search .recipe-list table').bootstrapTable('refresh', {
    url: '/api/recipes/search?' + $.param(params),
    pageNumber: Number($.bbq.getState('page') || 1)
  });
  scrollToResults('#search');
  gtag('event', 'search');
}

function executeView() {
  var id = $.bbq.getState('id');
  $('#search .recipe-list table').bootstrapTable('refresh', {
    url: '/api/recipes/' + encodeURIComponent(id) + '/view'
  });
  scrollToResults('#search');
}

function renderRefinement(refinement) {
  if (refinement == 'match_any') {
    return $('<div />', {
        'text': `Couldn't find recipes containining every ingredient - partial matches are displayed.`
    });
  }
  if (refinement.startsWith('removed:')) {
    var product = refinement.split(':')[1];
    $(`#search .include span.tag.badge:contains('${product}')`).css('background-color', 'silver');
    return $('<div />', {
        'text': `Ingredient '${product}' didn't match any recipes and has been removed from the search.  `
    });
  }
}

function emptyResultHandler(data) {
  if (data.total !== 0) return;
  var message = `Didn't find any recipes matching your search.  Send us a link via the feedback form if you know of any!`;
  if (data.authority === 'local') {
    message = `Couldn't reach the recipe search service.  This could be due to a connection problem on your device, or our service could be experiencing problems.`;
  }
  $('#search .recipe-list table').bootstrapTable('updateFormatText', 'NoMatches', message);
}

function refinementHandler(data) {
  var refinements = $('#search .refinements');
  refinements.empty();
  data.refinements = data.refinements || [];
  data.refinements.forEach(function(refinement) {
    refinements.append(renderRefinement(refinement));
  });
  refinements.toggleClass('collapse', data.refinements.length == 0);
}

function createSortPrompt() {
  var sortOptions = [
    {val: 'relevance', text: 'most relevant'},
    {val: 'ingredients', text: 'fewest extras required'},
    {val: 'duration', text: 'shortest time to make'},
  ];
  var sortChoice = $.bbq.getState('sort') || sortOptions[0].val;

  var sortSelect = $('<select>', {'class': 'sort'}).attr('aria-label', 'Recipe sort selection');
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

  return sortPrompt;
}

function addSorting() {
  var paginationDetail = $('#search div.recipe-list div.pagination-detail');
  if (!paginationDetail.find('select.sort').length) {
    var sortPrompt = createSortPrompt();
    paginationDetail.append(sortPrompt);
  }
}

$(function() {
  initTable('#search');
  bindLoadEvent('#search', emptyResultHandler);
  bindLoadEvent('#search', refinementHandler);
  bindLoadEvent('#search', addSorting);

  if ($.bbq.getState('exclude') || $.bbq.getState('equipment')) {
    $('#advanced-search').show();
  }
  $('#advanced-toggle a').on('click', function() {
    if ($('#advanced-search').is(':hidden')) {
      $('#advanced-toggle .indicator').html('&#9650;');
      $('#advanced-search').slideDown();
    } else {
      $('#advanced-toggle .indicator').html('&#9660;');
      $('#advanced-search').slideUp();
    }
  });
});
