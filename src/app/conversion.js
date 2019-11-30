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

function renderQuantity(quantity) {
  var units = targetUnits(quantity);
  var unitDescription = convert().describe(units);
  var magnitude = float2rat(quantity.to(units));

  return `${magnitude} ${unitDescription.abbr}`;
}
