import * as assert from 'assert';
import * as convert from 'convert-units';

import { renderQuantity } from '../src/app/conversion';

function fraction(nominator, denominator) {
  return `<sup>${nominator}</sup>&frasl;<sub>${denominator}</sub>`;
}

describe('unit conversion', function() {

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

    it('renders large volumes', function() {
      var quantity = convert(1500).from('ml');
      var rendered = renderQuantity(quantity);

      assert.equal('1.5 l', rendered);
    });

  });

  describe('weights', function() {

    it('renders mid-size weights', function() {
      var quantity = convert(50).from('g');
      var rendered = renderQuantity(quantity);

      assert.equal('50 g', rendered);
    });

    it('renders large weights', function() {
      var quantity = convert(1500).from('g');
      var rendered = renderQuantity(quantity);

      assert.equal('1.5 kg', rendered);
    });

  });

});
