import 'jquery';
import 'bootstrap-table';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-table/dist/bootstrap-table.css';
import './search.css';

import '../autosuggest';
import { i18nAttr, localize } from '../i18n';
import { getState, pushState } from '../state';
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

  // If the requested search is a repeat of the current state, perform a results refresh
  // This is done to ensure that the results are scrolled into view
  var stateHash = decodeURIComponent($.param(state));
  if (window.location.hash === `#${stateHash}`) {
    $('#search table[data-row-attributes]').trigger('page-change.bs.table');
  }
  pushState(state, `#${stateHash}`);
  $(window).trigger('popstate');
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

  $('#search table[data-row-attributes]').bootstrapTable('refresh', {
    url: '/api/recipes/search?' + $.param(params),
    pageNumber: Number(state.page || 1)
  });
}

function renderIndividual() {
  var id = getState().id;
  $('#search table[data-row-attributes]').bootstrapTable('refresh', {
    url: '/api/recipes/' + encodeURIComponent(id) + '/view'
  });
}

function renderRefinement(refinement) {
  if (refinement == 'empty_query') {
    return $('<div />', {
      'data-i18n': i18nAttr('search:refinement-empty-query')
    });
  }
  if (refinement == 'match_any') {
    return $('<div />', {
      'data-i18n': i18nAttr('search:refinement-partial-results')
    });
  }
}

function emptyResultHandler(data) {
  if (data.total !== 0) return;
  var message = i18nAttr('search:results-empty');
  if (data.authority === 'local') {
    message = i18nAttr('search:results-failed');
  }

  var target = '#search table[data-row-attributes]';
  $(target).bootstrapTable('updateFormatText', 'formatNoMatches', message);
  localize(target);
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
    {val: 'ingredients', text: i18nAttr('search:sort-ingredients')},
    {val: 'relevance', text: i18nAttr('search:sort-relevance')},
    {val: 'duration', text: i18nAttr('search:sort-duration')},
  ];

  var state = getState();
  var sortChoice = state.sort || sortOptions[0].val;

  var sortSelect = $('<select>', {'class': 'sort'}).attr('aria-label', i18nAttr('search:sort-selection-label'));
  $(sortOptions).each(function() {
    var sortOption = $('<option>');
    sortOption.text(this.text);
    sortOption.attr('value', this.val);
    if (sortChoice === this.val) sortOption.attr('selected', 'selected');
    sortSelect.append(sortOption);
  });
  sortSelect.on('change', function() {
    var state = getState();

    // Write the new sort selection, and reset to the first page
    state.sort = this.value;
    delete state.page;

    var stateHash = decodeURIComponent($.param(state));
    pushState(state, `#${stateHash}`);
    $(window).trigger('popstate');
  });

  var sortPrompt = $('<span>').text(i18nAttr('search:sort-selection-prompt'));
  sortSelect.appendTo(sortPrompt);

  return sortPrompt;
}

function addSorting() {
  var target = '#search div.recipe-list div.pagination-detail';
  var paginationDetail = $(target);
  if (!paginationDetail.find('select.sort').length) {
    var sortPrompt = createSortPrompt();
    paginationDetail.append(sortPrompt);
  }
  localize(target);
}

$(function() {
  initTable('#search');
  bindLoadEvent('#search', emptyResultHandler);
  bindLoadEvent('#search', refinementHandler);
  bindLoadEvent('#search', addSorting);
});
