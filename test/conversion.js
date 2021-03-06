import * as assert from 'assert';

import { renderQuantity } from '../src/app/conversion';

function fraction(nominator, denominator) {
  return `<sup>${nominator}</sup>&frasl;<sub>${denominator}</sub>`;
}

function renderQuantityHelper(quantity, fractions = true) {
  var rendered = renderQuantity(quantity, fractions);
  return `${rendered.magnitude || ''} ${rendered.units || ''}`.trim();
}

describe('unit conversion', function() {

  describe('liquids', function() {

    it('renders pinch volumes', function() {
      var rendered = renderQuantityHelper({magnitude: 0.25, units: 'ml'});
      assert.equal(`pinch`, rendered);
    });

    it('renders small volumes', function() {
      var rendered = renderQuantityHelper({magnitude: 10, units: 'ml'});
      assert.equal(`2 teaspoons`, rendered);
    });

    it('renders mid-size volumes', function() {
      var rendered = renderQuantityHelper({magnitude: 50, units: 'ml'});
      assert.equal('50 ml', rendered);
    });

    it('renders large volumes', function() {
      var rendered = renderQuantityHelper({magnitude: 1500, units: 'ml'});
      assert.equal('1.5 l', rendered);
    });

  });

  describe('weights', function() {

    it('renders mid-size weights', function() {
      var rendered = renderQuantityHelper({magnitude: 50, units: 'g'});
      assert.equal('50 g', rendered);
    });

    it('renders large weights', function() {
      var rendered = renderQuantityHelper({magnitude: 1500, units: 'g'});
      assert.equal('1.5 kg', rendered);
    });

  });

  describe('rounding', function() {

    it('leaves small quantities unmodified', function() {
      var rendered = renderQuantityHelper({magnitude: 3, units: 'g'});
      assert.equal('3 g', rendered);
    });

    it('rounds mid-size quantities', function() {
      var rendered = renderQuantityHelper({magnitude: 63, units: 'g'});
      assert.equal('65 g', rendered);
    });

    it('removes precision from large quantities', function() {
      var rendered = renderQuantityHelper({magnitude: 6005, units: 'g'});
      assert.equal('6 kg', rendered);
    });

  });

  describe('fractions', function() {

    it('renders fractional amounts', function() {
      var rendered = renderQuantityHelper({magnitude: 0.5, units: null});
      var expectedFraction = fraction(1, 2);
      assert.equal(expectedFraction, rendered);
    });

    it('can disable fractional rendering', function() {
      var rendered = renderQuantityHelper({magnitude: 0.75, units: null}, false);
      var expected = '0.75';
      assert.equal(expected, rendered);
    });

  });

  describe('plurality', function() {

    it('renders less-than-individual measures as singular', function() {
      var rendered = renderQuantityHelper({magnitude: 2.5, units: 'ml'});
      var expectedFraction = fraction(1, 2);
      assert.equal(`${expectedFraction} teaspoon`, rendered);
    });

    it('renders greater-than-individual measures as plural', function() {
      var rendered = renderQuantityHelper({magnitude: 20, units: 'ml'});
      var expectedFraction = fraction(1, 3);
      assert.equal(`1 ${expectedFraction} tablespoons`, rendered);
    });

  });

  describe('exceptions', function() {

    it('renders non-standardized quantities', function() {
      var rendered = renderQuantityHelper({magnitude: 1, units: 'clove'});
      assert.equal('1 clove', rendered);
    });

    it('renders units with empty magnitude', function() {
      var rendered = renderQuantityHelper({magnitude: undefined, units: 'in'});
      assert.equal('in', rendered);
    });

  });

});
