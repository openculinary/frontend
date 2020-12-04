import $ from 'jquery';
import Slip from 'slipjs';

import { localize } from '../i18n';
import { initTable } from './components/recipe-list';

var path = [];

function explore() {
  var url = '/api/recipes/explore';
  if (path.length) url += '?' + $.param({ingredients: path});

  var choiceList = $('#explore-choices').empty();
  $.each(path, function() {
    var cls = this.startsWith('-') ? 'exclude' : 'include';
    var product = this.replace('-', '');
    var choice = $('<li />', {'html': `<span class="${cls}">${product}</span>`});
    choiceList.append(choice);
  });
  $.ajax({url: url}).then(data => {
    $.each(data.facets.products, function() {
      var choice = $('<li />', {
        'data-value': this.key,
        'html': `<span>${this.key}</span>` + (this.count <= 10 ? ` (${this.count} results)` : ''),
      });
      choiceList.append(choice);
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
  var choice = $(e.target).data('value');
  var prefix = e.detail.direction === 'left' ? '-' : '';
  path.push(prefix + choice);
  explore();
}

$(function() {
  initTable('#explore');

  new Slip('#explore-choices', {keepSwipingPercent: 25});
  $('#explore-choices').on('slip:beforereorder', preventReorder);
  $('#explore-choices').on('slip:swipe', swipeHandler);

  explore();
});
