import $ from 'jquery';
import 'bootstrap-table';

import '../autosuggest';
import { i18nAttr, localize } from '../i18n';
import { getState, pushState, renderStateHash } from '../state';
import { initTable, bindLoadEvent } from './components/recipe-list';

export { renderSearch };

function pushSearch() {
  var state = {'search': null, 'action': 'search'};
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
  var stateHash = renderStateHash(state);
  if (`#${window.location.hash}` === stateHash) {
    $('#search table[data-row-attributes]').trigger('page-change.bs.table');
  }
  pushState(state, stateHash);
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
  if (state.domains) params['domains'] = state.domains.split(',');

  $('#search table[data-row-attributes]').bootstrapTable('refresh', {
    url: '/api/recipes/search?' + $.param(params),
    pageNumber: Number(state.page || 1)
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

function renderDomainFacet(domain, state) {
  var domainState = state === undefined ? true : state;
  var chip = $('<label />', {'class': 'badge badge-light badge-pill'});
  var checkbox = $('<input />', {'type': 'checkbox', 'checked': domainState, 'value': domain});
  var icon = $('<img />', {'src': 'images/domains/' + domain + '.ico', 'alt':''});

  checkbox.on('change', () => {
    var excludedDomains = $('#search .domain-facets input:not(:checked)').map((idx, item) => item.value);
    var state = getState();
    state.domains = '-' + $.makeArray(excludedDomains).join(',-');
    if (state.domains.length === 1) delete state.domains;
    var stateHash = renderStateHash(state);
    pushState(state, stateHash);
    $(window).trigger('popstate');
  });

  chip.append(checkbox);
  chip.append(icon);
  chip.append(document.createTextNode(domain));
  return chip;
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

function getDomainStates() {
  var domainStates = {};
  var state = getState();
  if (!state.domains) return domainStates;
  state.domains.split(',').forEach(domain => {
    var excluded = domain.startsWith('-');
    domain = excluded ? domain.replace('-', '') : domain;
    domainStates[domain] = !excluded;
  });
  return domainStates;
}

function domainFacetsHandler(data) {
  var domainStates = getDomainStates();
  var domainFacets = $('#search .domain-facets').empty();
  for (var domain in data.facets.domains) {
    domainFacets.append(renderDomainFacet(domain, domainStates[domain]));
  }
  domainFacets.toggleClass('collapse', Object.keys(data.facets.domains).length == 0);
}

function createSortPrompt() {
  var sortOptions = [
    {val: 'relevance', i18n: i18nAttr('search:sort-relevance')},
    {val: 'ingredients', i18n: i18nAttr('search:sort-ingredients')},
    {val: 'duration', i18n: i18nAttr('search:sort-duration')},
  ];

  var state = getState();
  var sortChoice = state.sort || sortOptions[0].val;

  var sortSelect = $('<select>', {'class': 'sort'}).attr('aria-label', 'Recipe sort selection');
  $(sortOptions).each(function() {
    var sortOption = $('<option>', {
      'data-i18n': this.i18n,
      'value': this.val
    });
    if (sortChoice === this.val) sortOption.attr('selected', 'selected');
    sortSelect.append(sortOption);
  });
  sortSelect.on('change', function() {
    var state = getState();

    // Write the new sort selection, and reset to the first page
    state.sort = this.value;
    delete state.page;

    var stateHash = renderStateHash(state);
    pushState(state, stateHash);
    $(window).trigger('popstate');
  });

  var sortMessage = $('<span>', {
    'class': 'sort-prompt',
    'data-i18n': i18nAttr('search:sort-selection-prompt')}
  );

  var sortPrompt = $('<span>');
  sortPrompt.append(sortMessage);
  sortPrompt.append(sortSelect);
  return sortPrompt;
}

function addSorting() {
  var paginationDetail = '#search div.recipe-list div.pagination-detail';
  if ($(paginationDetail).find('select.sort').length === 0) {
    var sortPrompt = createSortPrompt();
    $(paginationDetail).append(sortPrompt);
  }
  localize(paginationDetail);
}

$(function() {
  initTable('#search');
  bindLoadEvent('#search', emptyResultHandler);
  bindLoadEvent('#search', refinementHandler);
  bindLoadEvent('#search', domainFacetsHandler);
  bindLoadEvent('#search', addSorting);
});
