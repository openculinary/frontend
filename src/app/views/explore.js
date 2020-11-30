import $ from 'jquery';
import Slip from 'slipjs';

import { localize } from '../i18n';
import { initTable } from './components/recipe-list';

var stack = [];
var include = [];
var exclude = [];

function explore() {
  var params = {include, exclude};
  var url = '/api/recipes/explore';
  if (include.length || exclude.length) url += '?' + $.param(params);

  var choiceList = $('#explore-choices').empty();
  $.each(stack, function() {
    var cls = this.target === include ? 'include' : 'exclude';
    var choice = $('<li />', {'html': `<span class="${cls}">${this.choice}</span>`});
    choiceList.append(choice);
  });
  $.ajax({url: url}).then(data => {
    $.each(data.facets.products, function(idx) {
      var choice = $('<li />', {
        'data-value': this.key,
        'html': `<span>${this.key}</span>`,
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
  var target = e.detail.direction === 'left' ? exclude : include;
  stack.push({choice: choice, target: target});
  target.push(choice);
  explore();
}

$(function() {
  initTable('#explore');

  new Slip('#explore-choices');
  $('#explore-choices').on('slip:beforereorder', preventReorder);
  $('#explore-choices').on('slip:swipe', swipeHandler);

  explore();
});
