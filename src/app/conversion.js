import * as convert from 'convert-units';

import { float2rat } from './common';

export { renderQuantity, renderIngredient };

const expandMeasures = [
    'Tbs',
    'tsp',
];

function volumeUnits(quantity) {
  if (quantity.val >= 1000) return 'l';
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
  };
}

function renderMagnitude(units, magnitude) {
  if (magnitude >= 50) {
    magnitude = magnitude / 5;
    magnitude = Math.round(magnitude) * 5;
    magnitude = Number(magnitude.toPrecision(3));
    return magnitude.toFixed();
  }
  if (expandMeasures.indexOf(units) == -1) {
    return magnitude.toFixed(2) / 1;
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

function renderProduct(product) {
  return `<span class="tag badge ${product.state}">${product.product}</span>`;
}

function renderUnits(units, magnitude) {
  var description = convert().describe(units);
  if (expandMeasures.indexOf(units) == -1) {
    return description.abbr;
  }
  if (magnitude <= 1) return description.singular.toLowerCase();
  return description.plural.toLowerCase();
}

function renderQuantity(quantity) {

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
      'magnitude': quantity.magnitude,
      'units': quantity.units
    };
  }

  var units = targetUnits(fromQuantity);
  var magnitude = fromQuantity.to(units);

  var renderedMagnitude = renderMagnitude(units, magnitude);
  var renderedUnits = renderUnits(units, magnitude);
  return {
    'magnitude': renderedMagnitude,
    'units': renderedUnits
  };
}

function renderIngredient(ingredient) {
  var renderedQuantity = renderQuantity(ingredient.quantity);
  var renderedProduct = renderProduct(ingredient.product);
  return {
    'quantity': renderedQuantity,
    'product': renderedProduct
  }
}
