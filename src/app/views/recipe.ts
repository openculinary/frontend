import * as dayjs from 'dayjs';
import * as duration from 'dayjs/plugin/duration';
import * as $ from 'jquery';

import { getRecipe, getRecipeById } from '../common';
import { Recipe, Starred, db } from '../database';
import { i18nAttr, localize } from '../i18n';
import { addRecipe, scaleRecipe } from '../models/recipes';
import { starRecipe, unstarRecipe } from '../models/starred';
import { renderIngredientHTML } from '../recipeml';
import { getState, loadPage, pushState, renderStateHash } from '../state';

export { renderRecipe };

dayjs.extend(duration);

function linkFormatter(recipe: Recipe) : JQuery {
  return $('<a />', {
    'class': 'link fa fa-link',
    'href': `#search&action=view&id=${recipe.id}`
  });
}

function starFormatter() : JQuery {
  return $('<div />', {'class': 'star far fa-star'});
}

function updateRecipeState(recipeId: string) : void {
  db.recipes.get(recipeId, (recipe?: Recipe) => {
    const isInRecipes = !!recipe;

    const addButton = $('#recipe button.add-recipe');
    addButton.prop('disabled', isInRecipes);
    addButton.toggleClass('btn-outline-primary', !isInRecipes);
    addButton.toggleClass('btn-outline-secondary', isInRecipes);
  });
}

function updateStarState(recipeId: string) : void {
  db.starred.get(recipeId, (starred?: Starred) => {
    const isStarred = !!starred;

    const star = $('#recipe .star');
    star.toggleClass('fas', isStarred);
    star.toggleClass('far', !isStarred);
    star.css('color', isStarred ? 'gold' : 'dimgray');
    star.off('click');
    star.on('click', () => {
      const toggleStarred = isStarred ? unstarRecipe : starRecipe;
      getRecipe(star).then(toggleStarred).then(updateStarState);
    });
  });
}

function updateServings() : void {
  const state = getState();
  state.servings = $('#recipe div.metadata input.servings').val();

  const stateHash: string = renderStateHash(state);
  pushState(state, stateHash);

  getRecipeById(state.id).then(renderIngredients);
}

function renderRecipe() : void {
  const state = getState();
  const container = $('#recipe');
  container.data('id', state.id);

  getRecipe(container).then(recipe => {
    const duration = dayjs.duration(recipe.time, 'minutes');

    const title = $('#recipe div.title').empty();
    const attribution = $('#recipe div.attribution').empty();
    const corner = $('#recipe div.corner').empty();
    const image = $('#recipe div.image').empty();
    const metadata = $('#recipe div.metadata').empty();

    const link = $('<a />', {'href': recipe.dst});

    if (recipe.author) {
      const author = $('<a />', {'href': recipe.author_url || recipe.dst, 'text': recipe.author});
      attribution.append(document.createTextNode('by '));
      attribution.append(author);
    }

    container.data('id', recipe.id);
    title.text(recipe.title);
    corner.append(linkFormatter(recipe));
    corner.append(starFormatter());
    image.append(link);

    title.on('click', evt => {
      if (evt.detail < 3) return;
      window.open(`/diagnostics/#recipe&id=${recipe.id}`);
    });

    const targetServings: number = Number(state.servings) || recipe.servings;
    const servingsInput = $('<input>', {
        'class': 'servings',
        'min': 1,
        'max': 50,
        'size': 2,
        'type': 'number',
        'value': recipe.servings,
    });
    servingsInput.attr('aria-label', 'Serving count selection');
    servingsInput.on('change', updateServings);

    metadata.append($('<div />', {'class': 'property', 'text': 'servings'}));
    metadata.append($('<div />', {'class': 'value'}).append(servingsInput));
    metadata.append($('<div />', {'class': 'property', 'text': 'time'}));
    metadata.append($('<div />', {'class': 'value', 'text': duration.as('minutes') + ' mins'}));

    renderIngredients(recipe);
    renderDirections(recipe);

    localize('#recipe');
    loadPage('recipe');

    updateRecipeState(recipe.id);
    updateStarState(recipe.id);
  });
}

function renderIngredients(recipe) : void {
  const ingredients = $('<div />', {'class': 'ingredients'});
  ingredients.append($('<div />', {
    'class': 'headline section-title',
    'data-i18n': i18nAttr('search:result-tab-ingredients')
  }));

  const servings: number = Number(getState().servings) || recipe.servings;
  scaleRecipe(recipe, servings);

  $.each(recipe.ingredients, (_, ingredient) => {
    ingredients.append(renderIngredientHTML(ingredient));
  });

  // TODO: i18n
  const addButton = $('<button />', {
    'class': 'headline btn btn-outline-primary add-recipe',
    'text': 'Add to shopping list'
  });
  addButton.on('click', () => { Promise.resolve(recipe).then(addRecipe).then(updateRecipeState); });

  ingredients.append(addButton);

  const existingIngredients = $('#recipe div.ingredients');
  existingIngredients.replaceWith(ingredients);

  localize('#recipe .ingredients');
}

function renderDirections(recipe) : void {
  const directions = $('<div />', {'class': 'directions'});

  directions.append($('<p />', {
    'html': `Please visit the <a href="${recipe.dst}">original source</a> to read the directions for this recipe.`
  }));

  const existingDirections = $('#recipe div.directions').empty();
  existingDirections.replaceWith(directions);

  localize('#recipe .directions');
}
