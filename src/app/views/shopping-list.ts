import CodeMirror from 'codemirror';
import 'codemirror/addon/display/autorefresh';
import 'codemirror/mode/gfm/gfm';
import { packageVersion, types } from 'document';
import * as $ from 'jquery';
import select2 from 'select2';
import showdown from 'showdown';

import { renderQuantity } from '../conversion';
import { db } from '../database';
import { localize } from '../i18n';
import { addStandaloneIngredient, removeStandaloneIngredient } from '../models/ingredients';

export { aggregateQuantities, getNoteEditor, resetNoteEditor };

function aggregateQuantities(ingredients: types.Ingredient[]) : Record<string, number> {
  const quantities = Object.create(null);
  $.each(ingredients, (_, ingredient) => {
    if (!ingredient.quantity) return;
    const units: string = ingredient.quantity.units || '';
    quantities[units] = quantities[units] || 0;
    quantities[units] += ingredient.quantity.magnitude;
  });
  $.each(quantities, units => {
    if (quantities[units] === 0) delete quantities[units];
  });
  return quantities;
}

const noteConverter = showdown && new showdown.Converter({tasklists: true});
let noteEditor = null;
function getNoteEditor() : CodeMirror {
  if (!noteEditor && CodeMirror) {
    const notes = document.querySelector('#shopping-list div[class="notes"]');
    noteEditor = CodeMirror(notes, {
      autoRefresh: true,
      mode: 'gfm'
    });
    const productsFromNotes = $('#shopping-list .products-from-notes').empty();
    noteEditor.on('changes', () => {
      const html = noteConverter.makeHtml(noteEditor.getValue());
      productsFromNotes.html(html);
    });
  }
  return noteEditor;
}

function resetNoteEditor() : void {
  const editor = getNoteEditor();
  const emptyDoc = CodeMirror.Doc(String());
  editor.swapDoc(emptyDoc);
}

function renderProduct(product, ingredients) {
  const quantities = aggregateQuantities(ingredients);
  let text = '';
  $.each(quantities, (units, magnitude) => {
    const quantity = renderQuantity({units: units, magnitude: magnitude});
    const tail = `${quantity.magnitude || ''} ${quantity.units || ''}`.trim();
    if (tail.length) text += text.length ? ` + ${tail}` : tail;
  });
  text += ' ' + product.name;
  return text;
}

function renderCategory(category) {
  const fieldset = $('<fieldset />', {'class': category});
  const legend = $('<legend />', {'data-i18n': `[html]categories:${category}`});
  fieldset.append(legend);
  return fieldset;
}

function getProductId(el) {
  const target = $(el).hasClass('product') ? $(el) : $(el).parents('.product');
  return target.data('id');
}

function toggleProductState() {
  const productId: string = getProductId(this);
  db.basket.get(productId, item => {
    if (item) db.basket.delete(productId);
    else {
      const product = new types.Stock(productId, packageVersion);
      db.basket.put(product);
    }
  });
}

function productElement(product, ingredients) {
  const checkbox = $('<input />', {
    'type': 'checkbox',
    'name': 'products[]',
    'value': product.id
  });
  db.basket.get(product.id, item => {
    checkbox.attr('checked', !!item);
  });
  const label = $('<label />', {
    'class': 'product',
    'data-id': product.id,
    'click': toggleProductState
  });
  label.append(checkbox);

  const text: string = renderProduct(product, ingredients);
  const textContainer = $('<span />', {'html': text});
  label.append(textContainer);

  if (!ingredients.find(ingredient => ingredient.recipe_id)) {
    const removeButton = $('<span />', {
      'data-role': 'remove',
      'click': function() {
        removeStandaloneIngredient(product);
      }
    });
    label.append(removeButton);
  }
  return label;
}

function populateNotifications() {
  const requiredProducts: Set<string> = new Set();
  db.ingredients.each(ingredient => {
    requiredProducts.add(ingredient.product_id);
  }).then(() => {
    const total: number = requiredProducts.size;
    const empty: boolean = total === 0;
    $('header span.notification.shopping-list').toggle(!empty);
    if (empty) return;

    // TODO: Figure out why display:block is being applied incorrectly, and
    // then remove this workaround
    $('header span.notification.shopping-list').css({'display': 'inline'});

    db.basket.count(found => {
      $('header span.notification.shopping-list').text(found + '/' + total);
    });
  });
}

async function getProductsByCategory(servingsByRecipe) {
  const ingredientsByProduct: Map<string, types.Ingredient[]> = new Map();
  const productsByCategory: Map<string, Map<string, types.Product>> = new Map();
  await db.transaction('r', db.ingredients, db.products, () => {
    db.ingredients.each(ingredient => {
      const servings = servingsByRecipe[ingredient.recipe_id];
      if (ingredient.quantity && ingredient.quantity.magnitude && servings.scheduled) {
        ingredient.quantity.magnitude *= servings.scheduled;
        ingredient.quantity.magnitude /= servings.recipe;
      }

      db.products.get(ingredient.product_id, product => {
        if (!product) return;
        if (!ingredientsByProduct.has(product.id)) ingredientsByProduct.set(product.id, []);
        if (!productsByCategory.has(product.category)) productsByCategory.set(product.category, new Map());
        ingredientsByProduct.get(product.id).push(ingredient);
        productsByCategory.get(product.category).set(product.id, product);
      });
    });
  })
  return {
    ingredientsByProduct: ingredientsByProduct,
    productsByCategory: productsByCategory,
  };
}

async function getServingsByRecipe() : Promise<Record<string, Record<string, number>>> {
  const servingsByRecipe: Record<string, Record<string, number>> = Object.create(null);
  await db.transaction('r', db.recipes, db.meals, () => {
    db.recipes.each(recipe => {
      servingsByRecipe[recipe.id] = {recipe: recipe.servings, scheduled: 0};
    });
    db.meals.each(meal => {
      servingsByRecipe[meal.recipe_id].scheduled += meal.servings;
    });
  });
  return servingsByRecipe;
}

function renderShoppingList() {
  getServingsByRecipe().then(servingsByRecipe => {
    getProductsByCategory(servingsByRecipe).then(results => {
      const shoppingList = $('#shopping-list .products').empty();
      const sortedCategories: string[] = Array.from(results.productsByCategory.keys()).sort();
      $.each(sortedCategories, (_, category: string) => {
        const products = results.productsByCategory.get(category);
        const categoryElement = renderCategory(category);
        for (const productId of products.keys()) {
          const product: types.Product = products.get(productId);
          const ingredients: types.Ingredient[] = results.ingredientsByProduct.get(productId);
          categoryElement.append(productElement(product, ingredients));
        }
        shoppingList.append(categoryElement);
      });

      localize(shoppingList);
      populateNotifications();
    });
  });
}

function bindShoppingListInput(element, placeholder) {
  select2 && new select2($(element), {
    ajax: {
      url: '/api/autosuggest/ingredients',
      data: params => ({pre: params.term}),
      processResults: data => ({
        results: data.map(item => ({
          id: item.id,
          text: item.name,
          product: item
        }))
      })
    },
    minimumInputLength: 3,
    placeholder: placeholder,
    selectOnClose: true
  });
  $(element).on('select2:select', function(event) {
    $(this).val(null).trigger('change');

    const product: types.Product = event.params.data.product;
    db.ingredients
      .where("product_id")
      .equals(product.id)
      .count(count => { if (count === 0) addStandaloneIngredient(product); });
  });
}

$(function() {
  bindShoppingListInput('#shopping-list-entry', 'e.g. rice');

  db.on('changes', changes => { changes.find(c => c.table === 'meals') && renderShoppingList() });
  db.on('changes', changes => { changes.find(c => c.table === 'ingredients') && renderShoppingList() });

  renderShoppingList();
  getNoteEditor();
})
