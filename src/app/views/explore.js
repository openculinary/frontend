import $ from 'jquery';
import Swipe from 'swipejs';

var current;
var include = [];
var exclude = [];

function explore() {
  var params = {include, exclude};
  var url = '/api/recipes/explore';
  if (include.length || exclude.length) url += '?' + $.param(params);

  $.ajax({url: url}).then(hits => {
    console.log(hits);
  });
}

function swipeSetup() {
  explore();
  current = 'tomato';
}

function swipeHandler(index, element, direction) {
  var target = (direction > 0) ? include : exclude;
  target.push(current);
  var params = {include, exclude};
  console.log(params);
  current = $(element).text();
}

$(function() {
  window.explore = new Swipe(document.getElementById('explore-swipe'), {
    draggable: true,
    callback: swipeHandler,
  });
  swipeSetup();
});
