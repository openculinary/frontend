import * as convert from 'convert-units';

import { float2rat } from './common';

export { renderQuantity };

const expandMeasures = [
    'Tbs',
    'tsp',
];

function volumeUnits(quantity) {
  if (quantity.val >= 1000) return 'l';
  if (quantity.val <= 5) return 'tsp';
  if (quantity.val <= 20) return 'Tbs';
  return 'ml';
}

function weightUnits(quantity) {
  if (quantity.val >= 1000) return 'kg';
  if (quantity.val <= 1) return 'pinch';
  return 'g';
}

function targetUnits(quantity) {
  switch (quantity.origin.measure) {
    case 'volume': return volumeUnits(quantity);
    case 'mass': return weightUnits(quantity);
  };
}

function renderMagnitude(units, magnitude) {
  if (expandMeasures.indexOf(units) == -1) {
    return magnitude.toFixed(2) / 1;
  }
  var result = float2rat(magnitude);
  if (result.indexOf('/') == -1) {
    return result;
  }
  result = result.replace('/', '</sup>&frasl;<sub>');
  return `<sup>${result}</sub>`;
}

function renderUnits(units, magnitude) {
  var description = convert().describe(units);
  if (expandMeasures.indexOf(units) == -1) {
    return description.abbr;
  }
  if (magnitude === 1) return description.singular.toLowerCase();
  return description.plural.toLowerCase();
}

function renderQuantity(quantity) {
  quantity = convert(quantity.magnitude).from(quantity.units);
  var units = targetUnits(quantity);
  var magnitude = quantity.to(units);
  var renderedMagnitude = renderMagnitude(units, magnitude);
  var renderedUnits = renderUnits(units, magnitude);
  return `${renderedMagnitude} ${renderedUnits}`;
}
