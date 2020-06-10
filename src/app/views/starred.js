import 'jquery';

import { getRecipeById } from '../common';
import { localize } from '../i18n';
import { storage } from '../storage';
import { initTable } from './components/recipe-list';

function renderStarred() {
  var data = [];
  var starred = storage.starred.load();
  $.each(starred, function (recipeId) {
    var recipe = getRecipeById(recipeId);
    if (recipe) data.push(recipe);
  });

  var recipeList = $('#starred-recipes table[data-row-attributes]');
  recipeList.bootstrapTable('load', data);
  recipeList.bootstrapTable('refreshOptions', {
    formatNoMatches: function() {
      return `
        <p data-i18n="[html]starred-recipes:empty-recipes"></p>
        <p data-i18n="[html]starred-recipes:feature-introduction"></p>
      `;
    }
  });
  localize(recipeList);
}

$(function() {
  initTable('#starred-recipes');

  storage.starred.on('state changed', renderStarred);
});
