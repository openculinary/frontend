import * as assert from 'assert';

import { renderQuantity } from '../src/app/conversion';

function fraction(nominator, denominator) {
  return `<sup>${nominator}</sup>&frasl;<sub>${denominator}</sub>`;
}

describe('unit conversion', function() {

  describe('liquids', function() {

    it('renders small volumes', function() {
      var rendered = renderQuantity({magnitude: 10, units: 'ml'});
      assert.equal(`2 teaspoons`, rendered);
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

  describe('rounding', function() {

    it('leaves small quantities unmodified', function() {
      var rendered = renderQuantity({magnitude: 3, units: 'g'});
      assert.equal('3 g', rendered);
    });

    it('rounds mid-size quantities', function() {
      var rendered = renderQuantity({magnitude: 63, units: 'g'});
      assert.equal('65 g', rendered);
    });

    it('removes precision from large quantities', function() {
      var rendered = renderQuantity({magnitude: 6005, units: 'g'});
      assert.equal('6 kg', rendered);
    });

  });

  describe('plurality', function() {

    it('renders less-than-individual measures as singular', function() {
      var rendered = renderQuantity({magnitude: 2.5, units: 'ml'});
      var expectedFraction = fraction(1, 2);
      assert.equal(`${expectedFraction} teaspoon`, rendered);
    });

    it('renders greater-than-individual measures as plural', function() {
      var rendered = renderQuantity({magnitude: 20, units: 'ml'});
      var expectedFraction = fraction(1, 3);
      assert.equal(`1 ${expectedFraction} tablespoons`, rendered);
    });

  });

  describe('exceptions', function() {

    it('renders non-standardized quantities', function() {
      var rendered = renderQuantity({magnitude: 1, units: 'clove'});
      assert.equal('1 clove', rendered);
    });

  });

});
