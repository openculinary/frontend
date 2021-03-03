import convert from 'convert-units';
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

function volumeUnits(quantity) {
  if (quantity.val >= 1000) return 'l';
  if (235 <= quantity.val && quantity.val <= 250) return 'cup';
  if (quantity.val <= 15) return 'tsp';
  if (quantity.val <= 45) return 'Tbs';
  return 'ml';
}

function weightUnits(quantity) {
  if (quantity.val >= 1000) return 'kg';
  return 'g';
}

function targetUnits(quantity) {
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

function renderMagnitude(units, magnitude, fractions = true) {
  if (!magnitude) return magnitude;
  if (magnitude >= 50) {
    magnitude = magnitude / 5;
    magnitude = Math.round(magnitude) * 5;
    magnitude = Number(magnitude.toPrecision(3));
    magnitude = Math.round(magnitude);
    return magnitude.toFixed();
  }
  if (units && decimalMeasures.indexOf(units) >= 0) {
    return magnitude.toFixed(2) / 1;
  }
  if (!fractions) {
    return magnitude;
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

function renderUnits(units, magnitude) {
  const description = convert().describe(units);
  if (expandMeasures.indexOf(units) == -1) {
    return description.abbr;
  }
  if (magnitude <= 1) return description.singular.toLowerCase();
  return description.plural.toLowerCase();
}

function renderQuantity(quantity, fractions = true) {

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
