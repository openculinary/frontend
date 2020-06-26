import * as assert from 'assert';

import { aggregateUnitQuantities } from '../src/app/views/shopping-list';

var kgProduct = {
  recipes: {
    'first_recipe': {
      amounts: [
        {units: 'kg', quantity: 2},
        {units: 'kg', quantity: 1}
      ]
    },
    'second_recipe': {
      amounts: [
        {units: 'kg', quantity: 3}
      ]
    }
  }
};

var mixedProduct = {
  recipes: {
    'first_recipe': {
      amounts: [
        {units: 'tablespoon', quantity: 1},
        {units: 'teaspoon', quantity: 1}
      ]
    },
    'second_recipe': {
      amounts: [
        {units: 'teaspoon', quantity: 2}
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
