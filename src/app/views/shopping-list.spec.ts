import * as assert from 'assert';

import { Ingredient, db } from '../database';
import { aggregateQuantities } from './shopping-list';

const kgIngredients: Ingredient[] = [
  {quantity: {units: 'kg', magnitude: 2}, recipe_id: null, product_id: null, product: null, index: 0, markup: null},
  {quantity: {units: 'kg', magnitude: 1}, recipe_id: null, product_id: null, product: null, index: 0, markup: null},
  {quantity: {units: 'kg', magnitude: 3}, recipe_id: null, product_id: null, product: null, index: 0, markup: null},
];

const mixedIngredients: Ingredient[] = [
  {quantity: {units: 'tablespoon', magnitude: 1}, recipe_id: null, product_id: null, product: null, index: 0, markup: null},
  {quantity: {units: 'teaspoon', magnitude: 1}, recipe_id: null, product_id: null, product: null, index: 0, markup: null},
  {quantity: {units: 'teaspoon', magnitude: 2}, recipe_id: null, product_id: null, product: null, index: 0, markup: null},
]

describe('quantity aggregation', function() {

  after(function() {
    db.close();
  });

  it('should sum quantities of same unit', function() {
    assert.deepEqual(aggregateQuantities(kgIngredients), {'kg': 6});
  });

  it('should sum quantities across mixed units', function() {
    assert.deepEqual(aggregateQuantities(mixedIngredients), {'tablespoon': 1, 'teaspoon': 3});
  });

});
