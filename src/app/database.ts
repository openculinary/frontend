import Dexie from 'dexie';
import observable from 'dexie-observable';
import { types } from 'document';
import * as semver from 'semver';

class Database extends Dexie {
    ingredients: Dexie.Table<types.Ingredient, [string, string, number]>;  // recipe_id, product_id, index
    products: Dexie.Table<types.Product, string>;
    directions: Dexie.Table<types.Direction, [string, number]>;  // recipe_id, index
    recipes: Dexie.Table<types.Recipe, string>;
    starred: Dexie.Table<types.Starred, string>;
    meals: Dexie.Table<types.Meal, string>;
    basket: Dexie.Table<types.Stock, string>;

    constructor() {
      super('RecipeRadar', {addons: [observable]});

      this.version(20200702).stores({
        ingredients: '[recipe_id+product_id+index], recipe_id, product_id',
        products: 'id',
        directions: '[recipe_id+index]',
        recipes: 'id',
        starred: 'recipe_id',
        meals: '$$id, recipe_id',
        basket: 'product_id',
      });
    }

    minKey() { return Dexie.minKey; }
    maxKey() { return Dexie.maxKey; }

    async loadFromDocument(document: string, documentVersion: semver.SemVer) {
      const tableClearances = [];
      this.tables.forEach(table => {
        tableClearances.push(this.transaction('rw', table, () => table.clear()));
      });
      await Promise.all(tableClearances);

      const starred = new types.Starred(document, documentVersion);
      return this.transaction('rw', 'starred', () => {
        this.starred.add(starred);
      });
    }
}

export const db = new Database();
