import * as $ from 'jquery';
import 'bootstrap-table';
import { debounce } from 'debounce';

import '../autosuggest';
import { getRecipeById } from '../common';
import { i18nAttr, localize } from '../i18n';
import { getState, pushState, renderStateHash } from '../state';
import { scaleRecipe } from '../models/recipes';
import { initTable, bindLoadEvent } from './components/recipe-list';

export { renderRecipe, renderSearch };

function pushSearch() : void {
  const state = {'search': null, 'action': 'search'};
  ['#include', '#exclude', '#equipment'].forEach(function (element) {
    const fragment = element.replace('#', '');
    const data = $(element).val();
    if (data.length > 0) {
      state[fragment] = data.join(',');
    }
  })
  $('#search span.dietary-properties + ul :checkbox:checked').each(function() {
    state[this.id] = null;
  });
  const sortChoice = getState().sort;
  if (sortChoice) state['sort'] = sortChoice;

  // If the requested search is a repeat of the current state, perform a results refresh
  // This is done to ensure that the results are scrolled into view
  const stateHash = renderStateHash(state);
  if (`#${window.location.hash}` === stateHash) {
    $('#search table[data-row-attributes]').trigger('page-change.bs.table');
  }
  pushState(state, stateHash);
  triggerSearch();
}
$('#search form button').on('click', pushSearch);

function renderRecipe() : void {
  const state = getState();
  getRecipeById(state.id).then(recipe => {
    scaleRecipe(recipe, Number(state.servings) || recipe.servings);
    const recipeList = $('#search table[data-row-attributes]');
    recipeList.bootstrapTable('load', [recipe]);
    recipeList.trigger('page-change.bs.table');
  });
}

function renderSearch() : void {
  const ingredientsToInclude = $('#include').val();
  const ingredientsToExclude = $('#exclude').val();
  const equipmentToInclude = $('#equipment').val();
  const dietaryProperties = $('#search span.dietary-properties + ul :checkbox:checked').map((_, property) => property.id).toArray();

  const params = {
    ingredients: ingredientsToInclude.concat(ingredientsToExclude.map(name => `-${name}`)),
    equipment: equipmentToInclude,
  };

  let query = $.param(params);
  if (query.length) query += "&";
  query += dietaryProperties.join("&");

  const state = getState();
  if (state.sort) params['sort'] = state.sort;
  if (state.domains) params['domains'] = state.domains.split(',');

  $('#search table[data-row-attributes]').bootstrapTable('refresh', {
    url: '/api/recipes/search?' + query,
    pageNumber: Number(state.page || 1)
  });
}

function renderRefinement(refinement: string) : JQuery {
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

function triggerSearch() : void {
    $(window).trigger('popstate');
}
const debouncedSearchTrigger = debounce(triggerSearch, 1000);

function updateStateDomains() : void {
    const excludedDomains = $('#search .domain-facets input:not(:checked)').map((idx, item) => item.value);
    const state = getState();
    state.domains = '-' + $.makeArray(excludedDomains).join(',-');
    if (state.domains.length === 1) delete state.domains;
    const stateHash = renderStateHash(state);
    pushState(state, stateHash);

    debouncedSearchTrigger.clear();
    debouncedSearchTrigger();
}

function renderDomainFacet(domain: Record<string, string>, state?: boolean) : JQuery {
  const domainState = state === undefined ? true : state;
  const chip = $('<label />', {'class': 'badge bg-light rounded-pill text-dark'});
  const checkbox = $('<input />', {'type': 'checkbox', 'checked': domainState, 'value': domain.key});
  const icon = $('<img />', {'src': 'images/domains/' + domain.key + '.ico', 'alt':''});

  checkbox.on('change', updateStateDomains);

  chip.append(checkbox);
  chip.append(icon);
  chip.append(document.createTextNode(domain.key));
  return chip;
}

function emptyResultHandler(data) : void {
  if (data.total !== 0) return;
  let message = `Didn't find any recipes matching your search.  Send us a link via the feedback form if you know of any!`;
  if (data.authority === 'local') {
    message = `Couldn't reach the recipe search service.  This could be due to a connection problem on your device, or our service could be experiencing problems.`;
  }
  $('#search table[data-row-attributes]').bootstrapTable('updateFormatText', 'formatNoMatches', message);
}

function refinementHandler(data) : void {
  // Produce an array containing refinements that can be rendered
  data.refinements = data.refinements || [];
  data.refinements = data.refinements.map(renderRefinement);
  data.refinements = data.refinements.filter(refinement => refinement);

  // Fill and localize the refinement list element
  const refinements = $('#search .refinements').empty();
  data.refinements.map(refinement => refinements.append(refinement));
  localize(refinements);

  // Show or hide the refinement list
  refinements.toggleClass('collapse', data.refinements.length == 0);
}

function getDomainStates() : void {
  const domainStates = Object.create(null);
  const state = getState();
  if (!state.domains) return domainStates;
  state.domains.split(',').forEach(domainKey => {
    const excluded = domainKey.startsWith('-');
    domainKey = excluded ? domainKey.replace('-', '') : domainKey;
    domainStates[domainKey] = !excluded;
  });
  return domainStates;
}

function domainFacetsHandler(data) : void {
  const domainStates = getDomainStates();
  const domainFacets = $('#search .domain-facets').empty();
  $.each(data.facets.domains, function() {
    domainFacets.append(renderDomainFacet(this, domainStates[this.key]));
  });
  domainFacets.toggleClass('collapse', $.isEmptyObject(data.facets.domains));
}

function createSortPrompt() : void {
  const sortOptions = [
    {val: 'relevance', i18n: i18nAttr('search:sort-relevance')},
    {val: 'ingredients', i18n: i18nAttr('search:sort-ingredients')},
    {val: 'duration', i18n: i18nAttr('search:sort-duration')},
  ];

  const state = getState();
  const sortChoice = state.sort || sortOptions[0].val;

  const sortSelect = $('<select>', {'class': 'sort'}).attr('aria-label', 'Recipe sort selection');
  $(sortOptions).each(function() {
    const sortOption = $('<option>', {
      'data-i18n': this.i18n,
      'value': this.val
    });
    if (sortChoice === this.val) sortOption.attr('selected', 'selected');
    sortSelect.append(sortOption);
  });
  sortSelect.on('change', function() {
    const state = getState();

    // Write the new sort selection, and reset to the first page
    state.sort = this.value;
    delete state.page;

    const stateHash = renderStateHash(state);
    pushState(state, stateHash);
    triggerSearch();
  });

  const sortMessage = $('<span>', {
    'class': 'sort-prompt',
    'data-i18n': i18nAttr('search:sort-selection-prompt')}
  );

  const sortPrompt = $('<span>');
  sortPrompt.append(sortMessage);
  sortPrompt.append(sortSelect);
  return sortPrompt;
}

function addSorting() : void {
  const paginationDetail = '#search div.recipe-list div.pagination-detail';
  if ($(paginationDetail).find('select.sort').length === 0) {
    const sortPrompt = createSortPrompt();
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
