import 'jquery';
import 'bootstrap-table';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-table/dist/bootstrap-table.css';
import './search.css';

import '../autosuggest';
import { getState, loadPage, loadState } from '../state';
import { initTable, bindLoadEvent } from '../ui/recipe-list';

export { renderSearch, renderIndividual };

function pushSearch() {
  var state = {'action': 'search'};
  ['#include', '#exclude', '#equipment'].forEach(function (element) {
    var fragment = element.replace('#', '');
    var data = $(element).val();
    if (data.length > 0) {
      state[fragment] = data.join(',');
    }
  })
  var sortChoice = getState().sort;
  if (sortChoice) state['sort'] = sortChoice;

  var stateHash = decodeURIComponent($.param(state));

  // Simulate a results page change so that results are scrolled into view
  if (window.location.hash === `#${stateHash}`) {
    $('#search .recipe-list table').first().trigger('page-change.bs.table');
  }

  window.location.hash = stateHash;
}
$('#search form button').on('click', pushSearch);

function renderSearch() {
  var params = {
    include: $('#include').val(),
    exclude: $('#exclude').val(),
    equipment: $('#equipment').val(),
  };

  var state = getState();
  if (state.sort) params['sort'] = state.sort;

  $('#search .recipe-list table').bootstrapTable('refresh', {
    url: '/api/recipes/search?' + $.param(params),
    pageNumber: Number(state.page || 1)
  });

  loadPage('search');
}

function renderIndividual() {
  var id = getState().id;
  $('#search .recipe-list table').bootstrapTable('refresh', {
    url: '/api/recipes/' + encodeURIComponent(id) + '/view'
  });
}

function renderRefinement(refinement) {
  if (refinement == 'match_any') {
    return $('<div />', {
        'text': `Couldn't find recipes containing every ingredient - partial matches are displayed.`
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
  $('#search .recipe-list table').bootstrapTable('updateFormatText', 'formatNoMatches', message);
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
    {val: 'ingredients', text: 'fewest extras required'},
    {val: 'relevance', text: 'most ingredients used'},
    {val: 'duration', text: 'shortest time to make'},
  ];
  var sortChoice = getState().sort || sortOptions[0].val;

  var sortSelect = $('<select>', {'class': 'sort'}).attr('aria-label', 'Recipe sort selection');
  $(sortOptions).each(function() {
    var sortOption = $('<option>');
    sortOption.text(this.text);
    sortOption.attr('value', this.val);
    if (sortChoice === this.val) sortOption.attr('selected', 'selected');
    sortSelect.append(sortOption);
  });
  sortSelect.on('change', function() {
    var state = getState();
    state.sort = this.value;
    delete state.page;
    window.location.hash = decodeURIComponent($.param(state));
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

  window.onhashchange = loadState;
  loadState();
});
