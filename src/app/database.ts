import Dexie from 'dexie';
import observable from 'dexie-observable';

export interface Ingredient {
    recipe_id: string,
    product_id: string,
    index: number,
    markup: string,
    magnitude: number,
    units: string,
}

export interface Product {
    id: string,
    category: string,
    singular: string,
    plural: string,
}

export interface Direction {
   recipe_id: string,
   index: number,
   markup: string,
}

export interface Recipe {
    id: string,
    title: string,
    image_url: string,
    time: number,
    servings: number,
    rating: number,
    domain: string,
    dst: string,
}

export interface Starred {
    recipe_id: string,
}

export interface Meal {
    id?: string,
    recipe_id: string,
    datetime: string,
    servings: number,
}

export interface Stock {
    product_id: string,
    magnitude: number,
    units: string,
}

export class Database extends Dexie {
    ingredients: Dexie.Table<Ingredient, [string, string, number]>;  // recipe_id, product_id, index
    products: Dexie.Table<Product, string>;
    directions: Dexie.Table<Direction, [string, number]>;  // recipe_id, index
    recipes: Dexie.Table<Recipe, string>;
    starred: Dexie.Table<Starred, string>;
    meals: Dexie.Table<Meal, string>;
    basket: Dexie.Table<Stock, string>;
    kitchen: Dexie.Table<Stock, string>;

    constructor() {
      super('Database', {addons: [observable]});

      this.version(1).stores({
        ingredients: '[recipe_id+product_id+index], markup, magnitude, units',
        products: 'id, category, singular, plural',
        directions: '[recipe_id+index], markup',
        recipes: 'id, title, image_url, time, servings, rating, domain, dst',
        starred: 'recipe_id',
        meals: '$$id, recipe_id, datetime, servings',
        basket: 'product_id, magnitude, units',
        kitchen: 'product_id, magnitude, units',
      });

      this.ingredients = this.table('ingredients');
      this.products = this.table('products');
      this.directions = this.table('directions');
      this.recipes = this.table('recipes');
      this.starred = this.table('starred');
      this.meals = this.table('meals');
      this.basket = this.table('basket');
      this.kitchen = this.table('kitchen');
    }

    minKey() { return Dexie.minKey; }
    maxKey() { return Dexie.maxKey; }
}

export var db = new Database();
