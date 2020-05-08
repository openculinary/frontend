import * as assert from 'assert';

import { renderIngredientHTML, renderDirectionHTML } from '../src/app/recipeml';

function recipeMLHelper(ingredient, product_id, quantity, units, preamble, postamble) {
    return `<amt><qty>${quantity}</qty><unit>${units}</unit></amt>${preamble}<ingredient href="products/${product_id}">${ingredient}</ingredient>${postamble}`;
}

describe('html rendering', function() {

  it('renders simple product', function() {
    var recipeML = '<amt><qty>0.5</qty><unit>bag</unit></amt><ingredient>potato wedges</ingredient>';
    var expected = '<div class="quantity"><sup>1</sup>⁄<sub>2</sub> bag</div><div class="product"><span class="tag badge">potato wedges</span></div>';

    var rendered = renderIngredientHTML(recipeML);

    assert.equal(expected, rendered);
  });

  it('renders contextual product', function() {
    var recipeML = '<amt><qty>1</qty><unit>whole</unit></amt>small <ingredient>onion</ingredient> diced';
    var expected = '<div class="quantity">1 whole</div><div class="product">small <span class="tag badge">onion</span> diced</div>';

    var rendered = renderIngredientHTML(recipeML);

    assert.equal(expected, rendered);
  });

  it('renders without units', function() {
    var recipeML = '<amt><qty>1</qty></amt><ingredient>onion</ingredient>';
    var expected = '<div class="quantity">1</div><div class="product"><span class="tag badge">onion</span></div>';

    var rendered = renderIngredientHTML(recipeML);

    assert.equal(expected, rendered);
  });

  it('renders human quantities', function() {
    var recipeML = '<amt><qty>14.79</qty><unit>ml</unit></amt><ingredient>olive oil</ingredient>';
    var expected = '<div class="quantity">3 teaspoons</div><div class="product"><span class="tag badge">olive oil</span></div>';

    var rendered = renderIngredientHTML(recipeML);

    assert.equal(expected, rendered);
  });

  it('always renders a quantity element', function() {
    var recipeML = '<ingredient>bananas</ingredient>';
    var expected = '<div class="quantity"></div><div class="product"><span class="tag badge">bananas</span></div>';

    var rendered = renderIngredientHTML(recipeML);

    assert.equal(expected, rendered);
  });

  it('renders ingredient state', function() {
    var recipeML = '<ingredient>garlic</ingredient>';
    var expected = '<div class="quantity"></div><div class="product"><span class="tag badge available">garlic</span></div>';

    var rendered = renderIngredientHTML(recipeML, 'available');

    assert.equal(expected, rendered);
  });

  it('renders simple direction', function() {
    var recipeML = 'place the <mark>casserole dish</mark> in the <mark>oven</mark>';
    var expected = '<li>place the <div class="equipment">casserole dish</div> in the <div class="equipment">oven</div></li>';

    var rendered = renderDirectionHTML(recipeML);

    assert.equal(expected, rendered);
  });

});
