import $ from 'jquery';
import Slip from 'slipjs';

import { localize } from '../i18n';
import { getState, pushState, renderStateHash } from '../state';
import { initTable } from './components/recipe-list';

export { renderExplore };

function pushExplore() {
  var state = {'explore': null, 'action': 'explore'};

  // If the requested search is a repeat of the current state, perform a results refresh
  // This is done to ensure that the results are scrolled into view
  var stateHash = renderStateHash(state);
  if (`#${window.location.hash}` === stateHash) {
    $('#explore table[data-row-attributes]').trigger('page-change.bs.table');
  }
  pushState(state, stateHash);
  $(window).trigger('popstate');
}
$('#explore form button').on('click', pushExplore);

function renderExplore() {
  var state = getState();
  var params = {
    ingredients: state.ingredients ? state.ingredients.split(',') : [],
  };

  $.ajax({url: '/api/recipes/explore?' + $.param(params)}).then(data => {
    var previousList = $('#explore-choices .previous').empty();
    $.each(params.ingredients, function() {
      var cls = this.startsWith('-') ? 'exclude' : 'include';
      var product = this.replace('-', '');
      var choice = $('<li />', {'html': `<span class="${cls}">${product}</span>`});
      previousList.append(choice);
    });
    var nextList = $('#explore-choices .next').empty();
    $.each(data.facets.products, function() {
      var choice = $('<li />', {
        'data-value': this.key,
        'html': `<span>${this.key}</span>` + (this.count <= 10 ? ` (${this.count} results)` : ''),
      });
      nextList.append(choice);
    });

    if (data.results.length) {
      var recipeList = $('#explore table[data-row-attributes]');
      recipeList.bootstrapTable('load', data.results);
      localize(recipeList);
    }
  });
}

function preventReorder(e) {
  e.preventDefault();
}

function swipeHandler(e) {
  // NB: Use CSS visibility rather than jQuery 'hide' to avoid page layout jumping
  $(e.target).css('visibility', 'hidden');

  var choice = $(e.target).data('value');
  var prefix = e.detail.direction === 'left' ? '-' : '';
  var ingredient = prefix + choice;

  var state = getState();
  var ingredients = state.ingredients ? state.ingredients.split(',') : [];
  ingredients.push(ingredient);
  state.ingredients = ingredients.join(',');

  var stateHash = renderStateHash(state);
  pushState(state, stateHash);
  $(window).trigger('popstate');
}

$(function() {
  initTable('#explore');

  new Slip('#explore-choices .next', {keepSwipingPercent: 10});
  $('#explore-choices .next').on('slip:beforereorder', preventReorder);
  $('#explore-choices .next').on('slip:swipe', swipeHandler);
});
