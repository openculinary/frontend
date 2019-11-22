import 'jquery';

import { getRecipeById } from '../common';
import { storage } from '../storage';
import { initTable } from '../ui/recipe-list';

function renderStarred() {
  var data = [];
  var starred = storage.starred.load();
  $.each(starred, function (recipeId) {
    var recipe = getRecipeById(recipeId);
    if (recipe) data.push(recipe);
  });

  var recipeList = $('#starred-recipes div.recipe-list table');
  recipeList.bootstrapTable('load', data);
  recipeList.bootstrapTable('refreshOptions', {
    formatNoMatches: function() {
      return `
        <p>You don't have any starred recipes at the moment.</p>
        <p>Recipes you star in <a href='#search'>search</a> results will appear here.</p>
      `;
    }
  });
}

$(function() {
  initTable('#starred-recipes');

  storage.starred.on('state changed', renderStarred);
});