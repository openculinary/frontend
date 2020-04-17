import 'jquery';
import 'bootstrap-table';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-table/dist/bootstrap-table.css';
import './search.css';

import '../autosuggest';
import { localize } from '../i18n';
import { initTable, bindLoadEvent } from '../ui/recipe-list';

export { renderSearch, renderIndividual };

function pushSearch() {
  var state = {'action': 'search'};
  if (history.state && history.state.sort) state['sort'] = history.state.sort;

  ['#include', '#exclude', '#equipment'].forEach(function (element) {
    var fragment = element.replace('#', '');
    var data = $(element).val();
    if (data.length > 0) {
      state[fragment] = data.join(',');
    }
  })

  // If the requested search is a repeat of the current state, perform a results refresh
  // This is done to ensure that the results are scrolled into view
  var stateHash = decodeURIComponent($.param(state));
  if (window.location.hash === `#${stateHash}`) {
    $('#search table[data-row-attributes]').trigger('page-change.bs.table');
  }
  window.history.pushState(state, '', `#${stateHash}`);
  $(window).trigger('popstate');
}
$('#search form button').on('click', pushSearch);

function renderSearch() {
  var params = {
    include: $('#include').val(),
    exclude: $('#exclude').val(),
    equipment: $('#equipment').val(),
  };

  var state = history.state || {};
  if (state.sort) params['sort'] = state.sort;

  $('#search table[data-row-attributes]').bootstrapTable('refresh', {
    url: '/api/recipes/search?' + $.param(params),
    pageNumber: Number(state.page || 1)
  });
}

function renderIndividual() {
  var id = history.state.id;
  $('#search table[data-row-attributes]').bootstrapTable('refresh', {
    url: '/api/recipes/' + encodeURIComponent(id) + '/view'
  });
}

function renderRefinement(refinement) {
  if (refinement == 'empty_query') {
    return $('<div />', {
      'data-i18n': '[html]search:refinement-empty-query'
    });
  }
  if (refinement == 'match_any') {
    return $('<div />', {
      'data-i18n': '[html]search:refinement-partial-results'
    });
  }
  if (refinement.startsWith('removed:')) {
    var product = refinement.split(':')[1];
    $('#include').next('.select2').find(`li[title~='${product}']`).css('text-decoration', 'line-through');
    return $('<div />', {
      'data-i18n': '[html]search:refinement-ingredient-removed',
      'data-i18n-options': JSON.stringify({product: product})
    });
  }
}

function emptyResultHandler(data) {
  if (data.total !== 0) return;
  var message = `Didn't find any recipes matching your search.  Send us a link via the feedback form if you know of any!`;
  if (data.authority === 'local') {
    message = `Couldn't reach the recipe search service.  This could be due to a connection problem on your device, or our service could be experiencing problems.`;
  }
  $('#search table[data-row-attributes]').bootstrapTable('updateFormatText', 'formatNoMatches', message);
}

function refinementHandler(data) {
  // Produce an array containing refinements that can be rendered
  data.refinements = data.refinements || [];
  data.refinements = data.refinements.map(renderRefinement);
  data.refinements = data.refinements.filter(refinement => refinement);

  // Fill and localize the refinement list element
  var refinements = $('#search .refinements').empty();
  data.refinements.map(refinement => refinements.append(refinement));
  localize(refinements);

  // Show or hide the refinement list
  refinements.toggleClass('collapse', data.refinements.length == 0);
}

function createSortPrompt() {
  var sortOptions = [
    {val: 'ingredients', text: 'fewest extras required'},
    {val: 'relevance', text: 'most ingredients used'},
    {val: 'duration', text: 'shortest time to make'},
  ];

  var state = history.state || {};
  var sortChoice = state.sort || sortOptions[0].val;

  var sortSelect = $('<select>', {'class': 'sort'}).attr('aria-label', 'Recipe sort selection');
  $(sortOptions).each(function() {
    var sortOption = $('<option>');
    sortOption.text(this.text);
    sortOption.attr('value', this.val);
    if (sortChoice === this.val) sortOption.attr('selected', 'selected');
    sortSelect.append(sortOption);
  });
  sortSelect.on('change', function() {
    var state = history.state;

    // Write the new sort selection, and reset to the first page
    state.sort = this.value;
    delete state.page;

    var stateHash = decodeURIComponent($.param(state));
    history.pushState(state, '', `#${stateHash}`);
    $(window).trigger('popstate');
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
});
