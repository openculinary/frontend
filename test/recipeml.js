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
    var expected = '<div class="quantity"><sup>1</sup>⁄<sub>2</sub> bag</div><div class="ingredient"><span class="product">potato wedges</span></div>';

    var ingredient = ingredientHelper(recipeML, 0.5, 'bag');
    var rendered = renderIngredientHTML(ingredient);

    assert.equal(expected, rendered);
  });

  it('renders contextual product', function() {
    var recipeML = '<amt><qty>1</qty><unit>whole</unit></amt>small <ingredient>onion</ingredient> diced';
    var expected = '<div class="quantity">1 whole</div><div class="ingredient">small <span class="product">onion</span> diced</div>';

    var ingredient = ingredientHelper(recipeML, 1, 'whole');
    var rendered = renderIngredientHTML(ingredient);

    assert.equal(expected, rendered);
  });

  it('renders without units', function() {
    var recipeML = '<amt><qty>1</qty></amt><ingredient>onion</ingredient>';
    var expected = '<div class="quantity">1</div><div class="ingredient"><span class="product">onion</span></div>';

    var ingredient = ingredientHelper(recipeML, 1);
    var rendered = renderIngredientHTML(ingredient);

    assert.equal(expected, rendered);
  });

  it('renders human quantities', function() {
    var recipeML = '<amt><qty>14.79</qty><unit>ml</unit></amt><ingredient>olive oil</ingredient>';
    var expected = '<div class="quantity">3 teaspoons</div><div class="ingredient"><span class="product">olive oil</span></div>';

    var ingredient = ingredientHelper(recipeML, 14.79, 'ml');
    var rendered = renderIngredientHTML(ingredient);

    assert.equal(expected, rendered);
  });

  it('always renders a quantity element', function() {
    var recipeML = '<ingredient>bananas</ingredient>';
    var expected = '<div class="quantity"></div><div class="ingredient"><span class="product">bananas</span></div>';

    var ingredient = ingredientHelper(recipeML);
    var rendered = renderIngredientHTML(ingredient);

    assert.equal(expected, rendered);
  });

  it('renders ingredient state', function() {
    var recipeML = '<ingredient>garlic</ingredient>';
    var expected = '<div class="quantity"></div><div class="ingredient"><span class="product available">garlic</span></div>';

    var ingredient = ingredientHelper(recipeML, null, null, 'available');
    var rendered = renderIngredientHTML(ingredient);

    assert.equal(expected, rendered);
  });

  it('renders simple direction', function() {
    var recipeML = 'place the <mark class="equipment vessel">casserole dish</mark> in the <mark class="equipment appliance">oven</mark>';
    var expected = '<li class="direction">place the <span class="equipment">casserole dish</span> in the <span class="equipment">oven</span></li>';

    var direction = directionHelper(recipeML);
    var rendered = renderDirectionHTML(direction);

    assert.equal(expected, rendered);
  });

  it('renders directions with actions and equipment', function() {
    var recipeML = '<mark class="action">heat</mark> the <mark class="equipment appliance">oven</mark> to 200 F';
    var expected = '<li class="direction"><span class="action">heat</span> the <span class="equipment">oven</span> to 200 F</li>';

    var direction = directionHelper(recipeML);
    var rendered = renderDirectionHTML(direction);

    assert.equal(expected, rendered);
  });

});
