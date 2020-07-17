import $ from 'jquery';
import { create as jsondiffpatch, formatters as diffformatters } from 'jsondiffpatch';

function getRecipeId() {
  var urlParams = new URLSearchParams(window.location.hash.slice(1));
  return urlParams.get('id');
}

$(function() {
  var recipeId = getRecipeId();
  $.ajax({url: `/diagnostics/recipes/${recipeId}`}).then(recipe => {
    var diff = jsondiffpatch().diff(recipe.indexed, recipe.crawled);
    $('#diff').html(diffformatters.html.format(diff, recipe.indexed));
    diffformatters.html.hideUnchanged();
    eval($('#diff').find('script').html());
  });
});
