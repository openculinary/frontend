import 'jquery';

import { getRecipeById } from '../common';
import { db } from '../database';
import { localize } from '../i18n';
import { initTable } from './components/recipe-list';

function renderStarred() {
  db.starred.toCollection().keys(keys => {
    var promises = keys.map(key => getRecipeById(key));
    Promise.all(promises).then(recipes => {
      var recipeList = $('#starred-recipes table[data-row-attributes]');
      recipeList.bootstrapTable('load', recipes);
      recipeList.bootstrapTable('refreshOptions', {
        formatNoMatches: function() {
          return `
            <p data-i18n="[html]starred-recipes:empty-recipes"></p>
            <p data-i18n="[html]starred-recipes:feature-introduction"></p>
          `;
        }
      });
      localize(recipeList);
    });
  });
}

$(function() {
  initTable('#starred-recipes');

  db.on('changes', changes => { changes.find(c => c.table === 'starred') && renderStarred() });

  renderStarred();
});
