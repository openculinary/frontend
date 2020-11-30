import $ from 'jquery';
import Swipe from 'swipejs';

$(function() {
  window.explore = new Swipe(document.getElementById('explore-swipe'), {
    draggable: true,
  });
});
