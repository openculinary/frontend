import $ from 'jquery';
import Swipe from 'swipejs';

import { localize } from '../i18n';
import { initTable } from './components/recipe-list';

var choices = [];
var include = [];
var exclude = [];

function explore() {
  var params = {include, exclude};
  var url = '/api/recipes/explore';
  if (include.length || exclude.length) url += '?' + $.param(params);

  var card = $('#explore div.card-body').empty();
  $.ajax({url: url}).then(data => {
    $.each(data.facets.products, function(idx) {
      var wrapper = $('<div />', {class: 'swipe-wrap'});
      wrapper.append($('<div />', {class: 'choice'})); // empty left-swipe placeholder
      wrapper.append($('<div />', {class: 'choice', text: this.key}));
      wrapper.append($('<div />', {class: 'choice'})); // empty right-swipe placeholder

      var container = $('<div />', {
        'class': 'swipe-container',
        'data-index': idx
      });
      container.append(wrapper);
      card.append(container);

      choices[idx] = this.key;
      new Swipe(container[0], {
        draggable: true,
        callback: swipeHandler
      });
    });

    if (data.results.length) {
      var recipeList = $('#explore table[data-row-attributes]');
      recipeList.bootstrapTable('load', data.results);
      localize(recipeList);
    }
  });
}

function swipeHandler(index, element, direction) {
  var idx = $(element).parents('div.swipe-container').data('index');
  var target = (direction > 0) ? include : exclude;
  target.push(choices[idx]);
  explore();
}

$(function() {
  initTable('#explore');

  explore();
});
