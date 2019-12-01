import * as assert from 'assert';
import * as convert from 'convert-units';

import { renderQuantity } from '../src/app/conversion';

function fraction(nominator, denominator) {
  return `<sup>${nominator}</sup>&frasl;<sub>${denominator}</sub>`;
}

describe('unit conversion', function() {

  // https://en.wikipedia.org/wiki/Cooking_weights_and_measures
  // http://www.jsward.com/cooking/style.shtml
  describe('liquids', function() {

    it('renders small volumes', function() {
      var quantity = convert(10).from('ml');
      var rendered = renderQuantity(quantity);

      var expectedFraction = fraction(2, 3);
      assert.equal(`${expectedFraction} tablespoons`, rendered);
    });

    it('renders mid-size volumes', function() {
      var quantity = convert(50).from('ml');
      var rendered = renderQuantity(quantity);

      assert.equal('50 ml', rendered);
    });

  });

});
