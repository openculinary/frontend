import * as assert from 'assert';

import { renderQuantity } from '../src/app/conversion';

function fraction(nominator, denominator) {
  return `<sup>${nominator}</sup>&frasl;<sub>${denominator}</sub>`;
}

describe('unit conversion', function() {

  describe('liquids', function() {

    it('renders small volumes', function() {
      var rendered = renderQuantity({magnitude: 10, units: 'ml'});
      var expectedFraction = fraction(2, 3);
      assert.equal(`${expectedFraction} tablespoons`, rendered);
    });

    it('renders mid-size volumes', function() {
      var rendered = renderQuantity({magnitude: 50, units: 'ml'});
      assert.equal('50 ml', rendered);
    });

    it('renders large volumes', function() {
      var rendered = renderQuantity({magnitude: 1500, units: 'ml'});
      assert.equal('1.5 l', rendered);
    });

  });

  describe('weights', function() {

    it('renders mid-size weights', function() {
      var rendered = renderQuantity({magnitude: 50, units: 'g'});
      assert.equal('50 g', rendered);
    });

    it('renders large weights', function() {
      var rendered = renderQuantity({magnitude: 1500, units: 'g'});
      assert.equal('1.5 kg', rendered);
    });

  });

  describe('exceptions', function() {

    it('renders non-standardized quantities', function() {
      var rendered = renderQuantity({magnitude: 1, units: 'clove'});
      assert.equal('1 clove', rendered);
    });

  });

});
