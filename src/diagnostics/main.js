import * as $ from 'jquery';
import * as jsondiffpatch from 'jsondiffpatch';
import * as HtmlFormatter from 'jsondiffpatch/formatters/html'
import 'jsondiffpatch/formatters/styles/html.css'

function getRecipeId() {
  var urlParams = new URLSearchParams(window.location.hash.slice(1));
  return urlParams.get('id');
}

$(function() {
  var recipeId = getRecipeId();
  $.ajax({url: `/diagnostics/recipes/${recipeId}`}).then(recipe => {
    var jsondiff = jsondiffpatch.create();
    var diff = jsondiff.diff(recipe.indexed, recipe.crawled);
    $('#diff').html(HtmlFormatter.format(diff, recipe.indexed));
    eval($('#diff').find('script').html());
  });
});
