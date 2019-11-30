import * as assert from 'assert';
import * as convert from 'convert-units';

import { renderQuantity } from '../src/app/conversion';

describe('unit conversion', function() {

  // https://en.wikipedia.org/wiki/Cooking_weights_and_measures
  // http://www.jsward.com/cooking/style.shtml
  describe('liquids', function() {

    it('renders small volumes', function() {
      var quantity = convert(10).from('ml');
      var rendered = renderQuantity(quantity);

      assert.equal('2/3 Tbs', rendered);
    });

    it('renders mid-size volumes', function() {
      var quantity = convert(50).from('ml');
      var rendered = renderQuantity(quantity);

      assert.equal('50 ml', rendered);
    });

  });

});
