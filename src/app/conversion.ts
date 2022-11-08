import * as assert from 'assert';
import * as convert from 'convert-units';
import * as mocha from 'mocha';
import Fraction from 'fraction.js';

import { Quantity } from './database';

export { renderQuantity };

const decimalMeasures = [
    'l',
    'kg',
];

const expandMeasures = [
    'Tbs',
    'tsp',
];

function volumeUnits(quantity) : string {
  if (quantity.val >= 1000) return 'l';
  if (235 <= quantity.val && quantity.val <= 250) return 'cup';
  if (quantity.val <= 15) return 'tsp';
  if (quantity.val <= 45) return 'Tbs';
  return 'ml';
}

function weightUnits(quantity) : string {
  if (quantity.val >= 1000) return 'kg';
  return 'g';
}

function targetUnits(quantity) : string {
  const measure = quantity.origin.measure;
  if (expandMeasures.indexOf(measure) >= 0) {
    return measure;
  }
  switch (measure) {
    case 'volume': return volumeUnits(quantity);
    case 'mass': return weightUnits(quantity);
    default: return quantity.origin.abbr;
  }
}

function renderMagnitude(units: string, magnitude: number, fractions = true) : string {
  if (!magnitude) return null;
  if (magnitude >= 50) {
    magnitude = magnitude / 5;
    magnitude = Math.round(magnitude) * 5;
    magnitude = Number(magnitude.toPrecision(3));
    magnitude = Math.round(magnitude);
    return magnitude.toFixed();
  }
  if (units && decimalMeasures.indexOf(units) >= 0) {
    return Number(magnitude.toFixed(2)).toString();
  }
  if (!fractions) {
    return magnitude.toString();
  }
  const result: string = new Fraction(magnitude).simplify(0.1).toFraction(true);
  if (result.indexOf('/') == -1) {
    return result;
  }
  const tokens = result.split(' ');
  const last: number = tokens.length - 1;
  tokens[last] = tokens[last].replace('/', '</sup>&frasl;<sub>');
  tokens[last] = `<sup>${tokens[last]}</sub>`;
  return tokens.join(' ');
}

function renderUnits(units: string, magnitude: number) : string {
  const description = convert().describe(units);
  if (expandMeasures.indexOf(units) == -1) {
    return description.abbr;
  }
  if (magnitude <= 1) return description.singular.toLowerCase();
  return description.plural.toLowerCase();
}

function renderQuantity(quantity: Quantity, fractions = true) : Record<string, number | string> {

  // Special case handling for 'pinch'
  if (quantity.units === 'ml' && quantity.magnitude <= 0.25) {
    return {
      'magnitude': null,
      'units': 'pinch'
    };
  }

  let fromQuantity;
  try {
    fromQuantity = convert(quantity.magnitude).from(quantity.units);
  } catch (e) {
    return {
      'magnitude': renderMagnitude(quantity.units, quantity.magnitude, fractions),
      'units': quantity.units
    };
  }

  // TODO: Consider retrieving 'native units' (named units as retrieved from
  // the original recipe) and using these as a first-preference for rendering
  // purposes
  const units = targetUnits(fromQuantity);
  const magnitude = fromQuantity.to(units);

  const renderedMagnitude = renderMagnitude(units, magnitude, fractions);
  const renderedUnits = renderUnits(units, magnitude);
  return {
    'magnitude': renderedMagnitude,
    'units': renderedUnits
  };
}

function fraction(nominator, denominator) {
  return `<sup>${nominator}</sup>&frasl;<sub>${denominator}</sub>`;
}

function renderQuantityHelper(quantity, fractions = true) {
  const rendered = renderQuantity(quantity, fractions);
  return `${rendered.magnitude || ''} ${rendered.units || ''}`.trim();
}

mocha.describe('unit conversion', function() {

  describe('liquids', function() {

    it('renders pinch volumes', function() {
      const rendered = renderQuantityHelper({magnitude: 0.25, units: 'ml'});
      assert.equal(`pinch`, rendered);
    });

    it('renders small volumes', function() {
      const rendered = renderQuantityHelper({magnitude: 10, units: 'ml'});
      assert.equal(`2 teaspoons`, rendered);
    });

    it('renders mid-size volumes', function() {
      const rendered = renderQuantityHelper({magnitude: 50, units: 'ml'});
      assert.equal('50 ml', rendered);
    });

    it('renders large volumes', function() {
      const rendered = renderQuantityHelper({magnitude: 1500, units: 'ml'});
      assert.equal('1.5 l', rendered);
    });

  });

  describe('weights', function() {

    it('renders mid-size weights', function() {
      const rendered = renderQuantityHelper({magnitude: 50, units: 'g'});
      assert.equal('50 g', rendered);
    });

    it('renders large weights', function() {
      const rendered = renderQuantityHelper({magnitude: 1500, units: 'g'});
      assert.equal('1.5 kg', rendered);
    });

  });

  describe('rounding', function() {

    it('leaves small quantities unmodified', function() {
      const rendered = renderQuantityHelper({magnitude: 3, units: 'g'});
      assert.equal('3 g', rendered);
    });

    it('rounds mid-size quantities', function() {
      const rendered = renderQuantityHelper({magnitude: 63, units: 'g'});
      assert.equal('65 g', rendered);
    });

    it('removes precision from large quantities', function() {
      const rendered = renderQuantityHelper({magnitude: 6005, units: 'g'});
      assert.equal('6 kg', rendered);
    });

  });

  describe('fractions', function() {

    it('renders fractional amounts', function() {
      const rendered = renderQuantityHelper({magnitude: 0.5, units: null});
      const expectedFraction = fraction(1, 2);
      assert.equal(expectedFraction, rendered);
    });

    it('can disable fractional rendering', function() {
      const rendered = renderQuantityHelper({magnitude: 0.75, units: null}, false);
      const expected = '0.75';
      assert.equal(expected, rendered);
    });

  });

  describe('plurality', function() {

    it('renders less-than-individual measures as singular', function() {
      const rendered = renderQuantityHelper({magnitude: 2.5, units: 'ml'});
      const expectedFraction = fraction(1, 2);
      assert.equal(`${expectedFraction} teaspoon`, rendered);
    });

    it('renders greater-than-individual measures as plural', function() {
      const rendered = renderQuantityHelper({magnitude: 20, units: 'ml'});
      const expectedFraction = fraction(1, 3);
      assert.equal(`1 ${expectedFraction} tablespoons`, rendered);
    });

  });

  describe('exceptions', function() {

    it('renders non-standardized quantities', function() {
      const rendered = renderQuantityHelper({magnitude: 1, units: 'clove'});
      assert.equal('1 clove', rendered);
    });

    it('renders units with empty magnitude', function() {
      const rendered = renderQuantityHelper({magnitude: undefined, units: 'in'});
      assert.equal('in', rendered);
    });

  });

});
