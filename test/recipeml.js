import * as assert from 'assert';

import { renderToHTML } from '../src/app/recipeml';

function recipeMLHelper(ingredient, product_id, quantity, units, preamble, postamble) {
    return `<amt><qty>${quantity}</qty><unit>${units}</unit></amt>${preamble}<ingredient href="products/${product_id}">${ingredient}</ingredient>${postamble}`;
}

describe('html rendering', function() {

  it('renders simple product', function() {
    var recipeML = '<amt><qty>half</qty><unit>bag</unit></amt><ingredient>potato wedges</ingredient>';
    var expected = '<div class="quantity">half bag</div><div class="product"><span class="tag badge required">potato wedges</span></div>';

    var rendered = renderToHTML(recipeML);

    assert.equal(expected, rendered);
  });

  it('renders contextual product', function() {
    var recipeML = '<amt><qty>1</qty><unit>whole</unit></amt>small <ingredient>onion</ingredient> diced';
    var expected = '<div class="quantity">1 whole</div><div class="product">small <span class="tag badge required">onion</span> diced</div>';

    var rendered = renderToHTML(recipeML);

    assert.equal(expected, rendered);
  });

  it('renders without units', function() {
    var recipeML = '<amt><qty>1</qty></amt><ingredient>onion</ingredient>';
    var expected = '<div class="quantity">1</div><div class="product"><span class="tag badge required">onion</span></div>';

    var rendered = renderToHTML(recipeML);

    assert.equal(expected, rendered);
  });

});
