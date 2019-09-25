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

function contentFormatter(value, row, index) {
  var content = $('<div />');
  $('<img />', {'src': 'images/domains/' + row.domain + '.ico', 'alt': ''}).appendTo(content);
  $('<a />', {
    'href': row.src,
    'text': row.title,
    'target': '_blank',
    'rel': 'noreferrer'
  }).appendTo(content);
  var ingredients = $('<ul />', {'class': 'ingredients'}).appendTo(content);
  $.each(row.ingredients, function() {
    $('<li />', {'html': this.tokens.map(renderToken).join('')}).appendTo(ingredients);
  });
  var directions = $('<ul />', {'class': 'directions collapse'}).appendTo(content);
  $.each(row.directions, function() {
    $('<li />', {'html': this.tokens.map(renderToken).join('')}).appendTo(directions);
  });
  return content.html();
}

function metadataFormatter(value, row, index) {
  var duration = moment.duration(row.time, 'minutes');
  var metadata = $('<div />');
  $('<img />', {'src': row.image_url, 'alt': row.title}).appendTo(metadata);
  $('<span />', {'html': '<strong>serves</strong>'}).appendTo(metadata);
  $('<span />', {'text': row.servings}).appendTo(metadata);
  $('<br />').appendTo(metadata);
  $('<span />', {'html': '<strong>time</strong>'}).appendTo(metadata);
  $('<span />', {'text': duration.as('minutes') + ' mins'}).appendTo(metadata);
  $('<button />', {
    'class': 'btn btn-outline-primary toggle-directions',
    'text': 'View instructions'
  }).appendTo(metadata);
  $('<button />', {
    'class': 'btn btn-outline-primary add-to-shopping-list',
    'text': 'Add to shopping list'
  }).appendTo(metadata);
  return metadata.html();
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

function toggleDirections() {
  var recipe = getRecipe(this);
  $(`#search .results .recipe[data-id="${recipe.id}"] ul.ingredients`).toggleClass('collapse');
  $(`#search .results .recipe[data-id="${recipe.id}"] ul.directions`).toggleClass('collapse');
  $(this).text($(this).text() === 'View instructions' ? 'View ingredients' : 'View instructions');
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

$('#search .results table').on('load-success.bs.table', function() {
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

  $(this).find('.metadata button.add-to-shopping-list').on('click', addRecipeToShoppingList);
  $(this).find('.metadata button.toggle-directions').on('click', toggleDirections);
  $(this).find('.recipe a').on('click', recipeRedirect);
});

$('#search .results table').on('post-body.bs.table', function(data) {
  var data = $(this).bootstrapTable('getData');
  if (!Array.isArray(data)) return;

  var shoppingList = loadShoppingList();
  data.forEach(function (row) {
    updateRecipeState(row.id, shoppingList);
  });
});