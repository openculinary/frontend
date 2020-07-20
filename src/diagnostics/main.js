import $ from 'jquery';
import { create as jsondiffpatch, formatters as diffformatters } from 'jsondiffpatch';
import 'jsondiffpatch/dist/formatters-styles/html.css'

function getRecipeId() {
  var urlParams = new URLSearchParams(window.location.hash.slice(1));
  return urlParams.get('id');
}

$(function() {
  var recipeId = getRecipeId();
  $.ajax({url: `/diagnostics/recipes/${recipeId}`}).then(recipe => {
    var jsondiff = jsondiffpatch();
    var diff = jsondiff.diff(recipe.indexed, recipe.crawled);
    $('#diff').html(diffformatters.html.format(diff, recipe.indexed));
    eval($('#diff').find('script').html());
  });
});
