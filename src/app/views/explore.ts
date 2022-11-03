import * as $ from 'jquery';
import Slip from 'slipjs';

import { localize } from '../i18n';
import { getState, pushState, renderStateHash } from '../state';
import { initTable } from './components/recipe-list';

export { renderExplore };

function pushExplore() {
  const state = {'explore': null, 'action': 'explore'};

  const stateHash: string = renderStateHash(state);
  pushState(state, stateHash);
  $(window).trigger('popstate');
}
$('#explore form button').on('click', pushExplore);

function renderExplore() : void {
  const state = getState();
  const params = {
    ingredients: state.ingredients ? state.ingredients.split(',') : [],
  };

  $.ajax({url: '/api/recipes/explore?' + $.param(params)}).then(data => {
    const previousList = $('#explore-choices .previous').empty();
    $.each(params.ingredients, function() {
      const cls: string = this.startsWith('-') ? 'exclude' : 'include';
      const product = this.replace('-', '');
      const choice = $('<li />', {'html': `<span class="${cls}">${product}</span>`});
      previousList.append(choice);
    });
    const nextList = $('#explore-choices .next').empty();
    $.each(data.facets.products, function() {
      const choice = $('<li />', {
        'data-value': this.key,
        'html': `<span>${this.key}</span>` + (this.count <= 10 ? ` (${this.count} results)` : ''),
      });
      nextList.append(choice);
    });

    if (data.results.length) {
      const recipeList = $('#explore table[data-row-attributes]');
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

  const choice: string = $(e.target).data('value');
  const prefix: string = e.detail.direction === 'left' ? '-' : '';
  const ingredient: string = prefix + choice;

  const state = getState();
  const ingredients: string[] = state.ingredients ? state.ingredients.split(',') : [];
  ingredients.push(ingredient);
  state.ingredients = ingredients.join(',');

  const stateHash: string = renderStateHash(state);
  pushState(state, stateHash);
  $(window).trigger('popstate');
}

$(function() {
  initTable('#explore');

  new Slip('#explore-choices .next', {keepSwipingPercent: 10});
  $('#explore-choices .next').on('slip:beforereorder', preventReorder);
  $('#explore-choices .next').on('slip:swipe', swipeHandler);
});
