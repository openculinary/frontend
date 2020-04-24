import * as assert from 'assert';

import { renderToHTML } from '../src/app/recipeml';

function recipeMLHelper(ingredient, product_id, quantity, units) {
    return `<amt><qty>${quantity}</qty><unit>${units}</unit></amt><ingredient href="products/${product_id}">${ingredient}</ingredient>`;
}

function expectedProductHTML(product, quantity, units) {
  return `<div class="quantity">${quantity} ${units}</div><div class="product">${product}</div>`;
}

describe('html rendering', function() {

  it('renders simple product', function() {
    var recipeML = recipeMLHelper('potato wedges', 'potato_wedg', 'half', 'bag');
    var expected = expectedProductHTML('potato wedges', 'half', 'bag');

    var rendered = renderToHTML(recipeML);

    assert.equal(expected, rendered);
  });

});
