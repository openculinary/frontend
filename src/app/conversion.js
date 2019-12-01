import * as convert from 'convert-units';

import { float2rat } from './common';

export { renderQuantity };

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
    case 'weight': return weightUnits(quantity);
  };
}

function renderMagnitude(magnitude) {
  var result = float2rat(magnitude);
  if (result.indexOf('/') >= 0) {
    result = result.replace('/', '</sup>&frasl;<sub>');
    return `<sup>${result}</sub>`;
  }
  return result;
}

function renderUnits(units, magnitude) {
  var description = convert().describe(units);
  var expandMeasures = ['Tbs', 'tsp'];
  if (expandMeasures.indexOf(units) >= 0) {
    if (magnitude === 1) return description.singular.toLowerCase();
    return description.plural.toLowerCase();
  }
  return description.abbr;
}

function renderQuantity(quantity) {
  var units = targetUnits(quantity);
  var magnitude = quantity.to(units);
  var renderedMagnitude = renderMagnitude(magnitude);
  var renderedUnits = renderUnits(units, magnitude);
  return `${renderedMagnitude} ${renderedUnits}`;
}
