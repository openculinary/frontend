import * as convert from 'convert-units';

import { float2rat } from './common';

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
  var measure = quantity.origin.measure;
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
  var result = float2rat(magnitude);
  if (result.indexOf('/') == -1) {
    return result;
  }
  result = result.split(' ');
  var last = result.length - 1;
  result[last] = result[last].replace('/', '</sup>&frasl;<sub>');
  result[last] = `<sup>${result[last]}</sub>`;
  result = result.join(' ');
  return result;
}

function renderUnits(units, magnitude) {
  var description = convert().describe(units);
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

  var fromQuantity;
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
  var units = targetUnits(fromQuantity);
  var magnitude = fromQuantity.to(units);

  var renderedMagnitude = renderMagnitude(units, magnitude, fractions);
  var renderedUnits = renderUnits(units, magnitude);
  return {
    'magnitude': renderedMagnitude,
    'units': renderedUnits
  };
}
