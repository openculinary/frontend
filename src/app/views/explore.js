import $ from 'jquery';
import Slip from 'slipjs';

import { localize } from '../i18n';
import { initTable } from './components/recipe-list';

var choices = [];
var include = [];
var exclude = [];

function explore() {
  var params = {include, exclude};
  var url = '/api/recipes/explore';
  if (include.length || exclude.length) url += '?' + $.param(params);

  var choiceList = $('#explore-choices').empty();
  $.ajax({url: url}).then(data => {
    $.each(data.facets.products, function(idx) {
      choices[idx] = this.key;
      var choice = $('<li />', {
        'data-index': idx,
        'text': this.key,
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
  var idx = $(e.target).data('index');
  var target = e.detail.direction === 'left' ? exclude : include;
  target.push(choices[idx]);
  explore();
}

$(function() {
  initTable('#explore');

  new Slip('#explore-choices');
  $('#explore-choices').on('slip:beforereorder', preventReorder);
  $('#explore-choices').on('slip:swipe', swipeHandler);

  explore();
});
