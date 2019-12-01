import * as assert from 'assert';

import { renderIngredient } from '../src/app/conversion';

function fraction(nominator, denominator) {
  return `<sup>${nominator}</sup>&frasl;<sub>${denominator}</sub>`;
}

describe('unit conversion', function() {

  describe('liquids', function() {

    it('renders small volumes', function() {
      var rendered = renderIngredient({quantity: 10, units: 'ml'});
      var expectedFraction = fraction(2, 3);
      assert.equal(`${expectedFraction} tablespoons`, rendered);
    });

    it('renders mid-size volumes', function() {
      var rendered = renderIngredient({quantity: 50, units: 'ml'});
      assert.equal('50 ml', rendered);
    });

    it('renders large volumes', function() {
      var rendered = renderIngredient({quantity: 1500, units: 'ml'});
      assert.equal('1.5 l', rendered);
    });

  });

  describe('weights', function() {

    it('renders mid-size weights', function() {
      var rendered = renderIngredient({quantity: 50, units: 'g'});
      assert.equal('50 g', rendered);
    });

    it('renders large weights', function() {
      var rendered = renderIngredient({quantity: 1500, units: 'g'});
      assert.equal('1.5 kg', rendered);
    });

  });

});
