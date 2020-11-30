import $ from 'jquery';
import Swipe from 'swipejs';

var current = 'garlic';
var include = [];
var exclude = [];

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
});
