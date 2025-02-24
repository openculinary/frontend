import Dexie from 'dexie';
import 'dexie-observable';

export interface Quantity {
    magnitude: number,
    units: string,
}

export interface Ingredient {
    product: Product,

    recipe_id: string,
    product_id: string,
    index: number,
    markup: string,
    quantity: Quantity,
}

export interface Product {
    id: string,
    category: string,
    singular: string,
    plural: string,
    state: string,
}

export interface Recipe {
    id: string,

    ingredients: Ingredient[],

    author: string,
    author_url: string,
    title: string,
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

class Database extends Dexie {
    ingredients: Dexie.Table<Ingredient, [string, string, number]>;  // recipe_id, product_id, index
    products: Dexie.Table<Product, string>;
    recipes: Dexie.Table<Recipe, string>;
    starred: Dexie.Table<Starred, string>;
    meals: Dexie.Table<Meal, string>;
    basket: Dexie.Table<Stock, string>;

    constructor() {
      super('RecipeRadar');

      this.version(20250214).stores({
        ingredients: '[recipe_id+product_id+index], recipe_id, product_id',
        products: 'id',
        recipes: 'id',
        starred: 'recipe_id',
        meals: '$$id, recipe_id',
        basket: 'product_id',
      });
    }

    minKey() { return Dexie.minKey; }
    maxKey() { return Dexie.maxKey; }
}

export const db = new Database();
