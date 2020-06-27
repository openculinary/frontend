import * as assert from 'assert';

import { renderIngredientHTML, renderDirectionHTML } from '../src/app/recipeml';

function ingredientHelper(markup, magnitude, units, state) {
  return {
    markup: markup,
    product: {state: state},
    quantity: {
      magnitude: magnitude,
      units: units
    }
  }
}

function directionHelper(markup) {
  return {
    markup: markup
  }
}

describe('html rendering', function() {

  it('renders simple product', function() {
    var recipeML = '<amt><qty>0.5</qty><unit>bag</unit></amt><ingredient>potato wedges</ingredient>';
    var expected = '<div class="quantity"><sup>1</sup>⁄<sub>2</sub> bag</div><div class="product"><span class="tag badge">potato wedges</span></div>';

    var ingredient = ingredientHelper(recipeML, 0.5, 'bag');
    var rendered = renderIngredientHTML(ingredient);

    assert.equal(expected, rendered);
  });

  it('renders contextual product', function() {
    var recipeML = '<amt><qty>1</qty><unit>whole</unit></amt>small <ingredient>onion</ingredient> diced';
    var expected = '<div class="quantity">1 whole</div><div class="product">small <span class="tag badge">onion</span> diced</div>';

    var ingredient = ingredientHelper(recipeML, 1, 'whole');
    var rendered = renderIngredientHTML(ingredient);

    assert.equal(expected, rendered);
  });

  it('renders without units', function() {
    var recipeML = '<amt><qty>1</qty></amt><ingredient>onion</ingredient>';
    var expected = '<div class="quantity">1</div><div class="product"><span class="tag badge">onion</span></div>';

    var ingredient = ingredientHelper(recipeML, 1);
    var rendered = renderIngredientHTML(ingredient);

    assert.equal(expected, rendered);
  });

  it('renders human quantities', function() {
    var recipeML = '<amt><qty>14.79</qty><unit>ml</unit></amt><ingredient>olive oil</ingredient>';
    var expected = '<div class="quantity">3 teaspoons</div><div class="product"><span class="tag badge">olive oil</span></div>';

    var ingredient = ingredientHelper(recipeML, 14.79, 'ml');
    var rendered = renderIngredientHTML(ingredient);

    assert.equal(expected, rendered);
  });

  it('always renders a quantity element', function() {
    var recipeML = '<ingredient>bananas</ingredient>';
    var expected = '<div class="quantity"></div><div class="product"><span class="tag badge">bananas</span></div>';

    var ingredient = ingredientHelper(recipeML);
    var rendered = renderIngredientHTML(ingredient);

    assert.equal(expected, rendered);
  });

  it('renders ingredient state', function() {
    var recipeML = '<ingredient>garlic</ingredient>';
    var expected = '<div class="quantity"></div><div class="product"><span class="tag badge available">garlic</span></div>';

    var ingredient = ingredientHelper(recipeML, null, null, 'available');
    var rendered = renderIngredientHTML(ingredient);

    assert.equal(expected, rendered);
  });

  it('renders simple direction', function() {
    var recipeML = 'place the <mark>casserole dish</mark> in the <mark>oven</mark>';
    var expected = '<li class="direction">place the <span class="equipment tag badge">casserole dish</span> in the <span class="equipment tag badge">oven</span></li>';

    var direction = directionHelper(recipeML);
    var rendered = renderDirectionHTML(direction);

    assert.equal(expected, rendered);
  });

});
