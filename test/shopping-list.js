import * as assert from 'assert';

import { aggregateQuantities } from '../src/app/views/shopping-list';

var kgIngredients = [
  {quantity: {units: 'kg', magnitude: 2}},
  {quantity: {units: 'kg', magnitude: 1}},
  {quantity: {units: 'kg', magnitude: 3}},
];

var mixedIngredients = [
  {quantity: {units: 'tablespoon', magnitude: 1}},
  {quantity: {units: 'teaspoon', magnitude: 1}},
  {quantity: {units: 'teaspoon', magnitude: 2}},
]

describe('quantity aggregation', function() {

  it('should sum quantities of same unit', function() {
    assert.deepEqual(aggregateQuantities(kgIngredients), {'kg': 6});
  });

  it('should sum quantities across mixed units', function() {
    assert.deepEqual(aggregateQuantities(mixedIngredients), {'tablespoon': 1, 'teaspoon': 3});
  });

});
