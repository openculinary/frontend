import * as assert from 'assert';
import { describe, it } from 'mocha';

import { Direction, Ingredient } from './database';
import { renderIngredientHTML, renderDirectionHTML } from './recipeml';

function ingredientHelper(markup, magnitude = null, units = null, state = null) : Ingredient {
  return {
    recipe_id: null,
    index: 0,
    markup: markup,
    product_id: null,
    product: {
      id: null,
      category: null,
      singular: null,
      plural: null,
      state: state
    },
    quantity: {
      magnitude: magnitude,
      units: units
    }
  }
}

function directionHelper(markup) : Direction {
  return {
    recipe_id: null,
    index: 0,
    markup: markup
  }
}

describe('html rendering', function() {

  it('renders simple product', function() {
    const recipeML = '<amt><qty>0.5</qty><unit>bag</unit></amt><ingredient>potato wedges</ingredient>';
    const expected = '<div class="quantity"><sup>1</sup>⁄<sub>2</sub> bag</div><div class="ingredient"><span class="product">potato wedges</span></div>';

    const ingredient = ingredientHelper(recipeML, 0.5, 'bag');
    const rendered = renderIngredientHTML(ingredient);

    assert.equal(expected, rendered);
  });

  it('renders contextual product', function() {
    const recipeML = '<amt><qty>1</qty><unit>whole</unit></amt>small <ingredient>onion</ingredient> diced';
    const expected = '<div class="quantity">1 whole</div><div class="ingredient">small <span class="product">onion</span> diced</div>';

    const ingredient = ingredientHelper(recipeML, 1, 'whole');
    const rendered = renderIngredientHTML(ingredient);

    assert.equal(expected, rendered);
  });

  it('renders without units', function() {
    const recipeML = '<amt><qty>1</qty></amt><ingredient>onion</ingredient>';
    const expected = '<div class="quantity">1</div><div class="ingredient"><span class="product">onion</span></div>';

    const ingredient = ingredientHelper(recipeML, 1);
    const rendered = renderIngredientHTML(ingredient);

    assert.equal(expected, rendered);
  });

  it('renders human quantities', function() {
    const recipeML = '<amt><qty>14.79</qty><unit>ml</unit></amt><ingredient>olive oil</ingredient>';
    const expected = '<div class="quantity">3 teaspoons</div><div class="ingredient"><span class="product">olive oil</span></div>';

    const ingredient = ingredientHelper(recipeML, 14.79, 'ml');
    const rendered = renderIngredientHTML(ingredient);

    assert.equal(expected, rendered);
  });

  it('always renders a quantity element', function() {
    const recipeML = '<ingredient>bananas</ingredient>';
    const expected = '<div class="quantity"></div><div class="ingredient"><span class="product">bananas</span></div>';

    const ingredient = ingredientHelper(recipeML);
    const rendered = renderIngredientHTML(ingredient);

    assert.equal(expected, rendered);
  });

  it('renders ingredient state', function() {
    const recipeML = '<ingredient>garlic</ingredient>';
    const expected = '<div class="quantity"></div><div class="ingredient"><span class="product available">garlic</span></div>';

    const ingredient = ingredientHelper(recipeML, null, null, 'available');
    const rendered = renderIngredientHTML(ingredient);

    assert.equal(expected, rendered);
  });

  it('renders simple direction', function() {
    const recipeML = 'place the <mark class="equipment vessel">casserole dish</mark> in the <mark class="equipment appliance">oven</mark>';
    const expected = '<li class="direction">place the <span class="equipment">casserole dish</span> in the <span class="equipment">oven</span></li>';

    const direction = directionHelper(recipeML);
    const rendered = renderDirectionHTML(direction);

    assert.equal(expected, rendered);
  });

  it('renders directions with actions and equipment', function() {
    const recipeML = '<mark class="action">heat</mark> the <mark class="equipment appliance">oven</mark> to 200 F';
    const expected = '<li class="direction"><span class="action">heat</span> the <span class="equipment">oven</span> to 200 F</li>';

    const direction = directionHelper(recipeML);
    const rendered = renderDirectionHTML(direction);

    assert.equal(expected, rendered);
  });

});
