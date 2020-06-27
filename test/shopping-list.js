import * as assert from 'assert';

import { aggregateUnitQuantities } from '../src/app/views/shopping-list';

var kgProduct = {
  recipes: {
    'first_recipe': {
      quantities: [
        {units: 'kg', magnitude: 2},
        {units: 'kg', magnitude: 1}
      ]
    },
    'second_recipe': {
      quantities: [
        {units: 'kg', magnitude: 3}
      ]
    }
  }
};

var mixedProduct = {
  recipes: {
    'first_recipe': {
      quantities: [
        {units: 'tablespoon', magnitude: 1},
        {units: 'teaspoon', magnitude: 1}
      ]
    },
    'second_recipe': {
      quantities: [
        {units: 'teaspoon', magnitude: 2}
      ]
    }
  }
}

describe('product aggregation', function() {

  it('should sum quantities of same unit', function() {
    assert.deepEqual(aggregateUnitQuantities(kgProduct, {}), {'kg': 6});
  });

  it('should sum quantities across mixed units', function() {
    assert.deepEqual(aggregateUnitQuantities(mixedProduct, {}), {'tablespoon': 1, 'teaspoon': 3});
  });

});
