import 'jquery';
import 'select2';

import { renderQuantity } from '../conversion';
import { db } from '../database';
import { localize } from '../i18n';
import { addStandaloneIngredient, removeStandaloneIngredient } from '../models/ingredients';

function renderProduct(product, ingredients) {
  var text = '';
  $.each(ingredients, (index, ingredient) => {
    if (!ingredient.quantity) return;
    var quantity = renderQuantity(ingredient.quantity);
    var tail = `${quantity.magnitude || ''} ${quantity.units || ''}`.trim();
    if (tail.length) text += text.length ? ` + ${tail}` : tail;
  });
  text += ' ' + product.product;
  return text;
}

function renderCategory(category) {
  var fieldset = $('<fieldset />', {'class': category});
  var legend = $('<legend />', {'data-i18n': `[html]categories:${category}`});
  fieldset.append(legend);
  return fieldset;
}

function getProductId(el) {
  var target = $(el).hasClass('product') ? $(el) : $(el).parents('.product');
  return target.data('id');
}

function toggleProductState() {
  var productId = getProductId(this);
  db.basket.get(productId, item => {
    if (item) db.basket.delete(productId);
    else db.basket.put({product_id: productId});
  });
}

function productElement(product, ingredients) {
  var checkbox = $('<input />', {
    'type': 'checkbox',
    'name': 'products[]',
    'value': product.id
  });
  db.basket.get(product.id, item => {
    checkbox.attr('checked', !!item);
  });
  var label = $('<label />', {
    'class': 'product',
    'data-id': product.id,
    'click': toggleProductState
  });
  label.append(checkbox);

  var text = renderProduct(product, ingredients);
  var textContainer = $('<span />', {'html': text});
  label.append(textContainer);

  if (!ingredients.find(ingredient => ingredient.recipe_id)) {
    var removeButton = $('<span />', {
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
  var requiredProducts = new Set();
  db.ingredients.each(ingredient => {
    requiredProducts.add(ingredient.product_id);
  }).then(() => {
    var total = requiredProducts.size;
    var empty = total === 0;
    $('header span.notification.shopping-list').toggle(!empty);
    if (empty) return;

    db.basket.count(found => {
      $('header span.notification.shopping-list').text(found + '/' + total);
    });
  });
}

async function getProductsByCategory(servingsByRecipe) {
  var ingredientsByProduct = new Map();
  var productsByCategory = new Map();
  await db.transaction('r!', db.ingredients, db.products, () => {
    db.ingredients.each(ingredient => {
      var servings = servingsByRecipe[ingredient.recipe_id];
      if (ingredient.quantity && ingredient.quantity.magnitude && servings.scheduled) {
        ingredient.quantity.magnitude *= servings.scheduled;
        ingredient.quantity.magnitude /= servings.recipe;
      }

      db.products.get(ingredient.product_id, product => {
        if (!product) return;
        ingredientsByProduct[product.id] = ingredientsByProduct[product.id] || [];
        ingredientsByProduct[product.id].push(ingredient);
        productsByCategory[product.category] = productsByCategory[product.category] || {};
        productsByCategory[product.category][product.id] = product;
      });
    });
  })
  // Move the null category to the end of the map
  if (Object.hasOwnProperty.call(productsByCategory, null)) {
    var product = productsByCategory[null];
    delete productsByCategory[null];
    productsByCategory[null] = product;
  }
  return {
    ingredientsByProduct: ingredientsByProduct,
    productsByCategory: productsByCategory,
  };
}

async function getServingsByRecipe() {
  var servingsByRecipe = new Map();
  await db.transaction('r!', db.recipes, db.meals, () => {
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
      var shoppingList = $('#shopping-list .products').empty();
      $.each(results.productsByCategory, (category, products) => {
        if (category === 'null') category = null;
        var categoryElement = renderCategory(category);
        $.each(products, (productId, product) => {
          var ingredients = results.ingredientsByProduct[productId];
          categoryElement.append(productElement(product, ingredients));
        });
        shoppingList.append(categoryElement);
      });

      localize(shoppingList);
      populateNotifications();
    });
  });
}

function bindShoppingListInput(element, placeholder) {
  $(element).select2({
    ajax: {
      url: 'api/ingredients',
      data: params => ({pre: params.term}),
      processResults: data => ({
        results: data.map(item => ({
          id: item.product_id,
          text: item.product,
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

    var product = event.params.data.product;
    db.ingredients
      .where("product_id")
      .equals(product.product_id)
      .count(count => { if (count === 0) addStandaloneIngredient(product); });
  });
}

$(function() {
  bindShoppingListInput('#shopping-list-entry', 'e.g. rice');

  db.on('changes', changes => { changes.find(c => c.table === 'meals') && renderShoppingList() });
  db.on('changes', changes => { changes.find(c => c.table === 'ingredients') && renderShoppingList() });

  renderShoppingList();
})
