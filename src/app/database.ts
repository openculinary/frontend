import Dexie from 'dexie';
import 'dexie-observable';
import { types } from 'document';
import * as semver from 'semver';

export class Database extends Dexie {
    ingredients: Dexie.Table<types.Ingredient, [string, string, number]>;  // recipe_id, product_id, index
    products: Dexie.Table<types.Product, string>;
    directions: Dexie.Table<types.Direction, [string, number]>;  // recipe_id, index
    recipes: Dexie.Table<types.Recipe, string>;
    starred: Dexie.Table<types.Starred, string>;
    meals: Dexie.Table<types.Meal, string>;
    basket: Dexie.Table<types.Stock, string>;

    constructor() {
      super('RecipeRadar');

      this.version(20200702).stores({
        ingredients: '[recipe_id+product_id+index], recipe_id, product_id',
        products: 'id',
        directions: '[recipe_id+index]',
        recipes: 'id',
        starred: 'recipe_id',
        meals: '$$id, recipe_id',
        basket: 'product_id',
      });

      this.ingredients = this.table('ingredients');
      this.products = this.table('products');
      this.directions = this.table('directions');
      this.recipes = this.table('recipes');
      this.starred = this.table('starred');
      this.meals = this.table('meals');
      this.basket = this.table('basket');
    }

    minKey() { return Dexie.minKey; }
    maxKey() { return Dexie.maxKey; }

    loadFromDocument(document: string, documentVersion: semver.SemVer) {
      this.tables.forEach(table => {
        db.transaction('rw', table, () => {
          table.clear();
        });
      });

      const starred = new types.Starred(document, documentVersion);
      db.transaction('rw', db.starred, () => {
        db.starred.add(starred);
      });
    }
}

export var db = new Database();
