import $ from 'jquery';

function getRecipeId() {
  var urlParams = new URLSearchParams(window.location.hash.slice(1));
  return urlParams.get('id');
}

$(function() {
  console.log(getRecipeId());
});
