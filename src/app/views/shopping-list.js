import 'jquery';
import 'select2';

import { renderQuantity } from '../conversion';
import { db } from '../database';
import { localize } from '../i18n';
import { storage } from '../storage';
import { addProduct, removeProduct } from '../models/products';

export { aggregateUnitQuantities };

function aggregateUnitQuantities(product, recipeServings) {
  var unitQuantities = {};
  var recipes = storage.recipes.load();
  $.each(product.recipes, function(recipeId) {
    var defaultServings = recipes[recipeId] ? recipes[recipeId].servings : 1;
    var requestedServings = recipeServings[recipeId] || defaultServings;
    product.recipes[recipeId].quantities.forEach(function (quantity) {
      quantity.units = quantity.units || '';
      unitQuantities[quantity.units] = unitQuantities[quantity.units] || 0;
      unitQuantities[quantity.units] += (quantity.magnitude * requestedServings) / defaultServings;
    });
  });
  $.each(unitQuantities, function(unit) {
    if (unitQuantities[unit] === 0) delete unitQuantities[unit];
  });
  return unitQuantities;
}

function renderProductText(product, servingsByRecipe) {
  var unitQuantities = aggregateUnitQuantities(product, servingsByRecipe);
  var productText = '';
  $.each(unitQuantities, function(unit) {
    if (productText) productText += ' + ';
    var quantity = renderQuantity({
      magnitude: unitQuantities[unit],
      units: unit
    });
    productText += `${quantity.magnitude || ''} ${quantity.units || ''}`.trim();
  });
  productText += ' ' + product.product;
  return productText;
}

function renderCategory(category, products, servingsByRecipe) {
  var fieldset = $('<fieldset />', {'class': category});

  var legend = $('<legend />', {'data-i18n': `[html]categories:${category}`});
  fieldset.append(legend);

  products.forEach(function(product) {
    fieldset.append(productElement(product, servingsByRecipe))
  });

  return fieldset;
}

function getProductId(el) {
  var target = $(el).hasClass('product') ? $(el) : $(el).parents('.product');
  return target.data('id');
}

function toggleProductState() {
  var productId = getProductId(this);
  var products = storage.products.load();
  var product = products[productId];

  db.basket.get(productId, product => {
    var wasInBasket = !!product;
    product.state = wasInBasket ? 'required' : 'purchased';

    storage.products.remove({'hashCode': product.product_id});
    storage.products.add({'hashCode': product.product_id, 'value': product});
    if (wasInBasket) {
      db.basket.delete(product.product_id);
    } else {
      db.basket.put({product_id: product.product_id});
    }
  });
}

function productElement(product, servingsByRecipe) {
  var checkbox = $('<input />', {
    'type': 'checkbox',
    'name': 'products[]',
    'value': product.product_id,
    'checked': ['available', 'purchased'].includes(product.state)
  });
  var label = $('<label />', {
    'class': 'product',
    'data-id': product.product_id,
    'click': toggleProductState
  });
  label.append(checkbox);

  var productText = renderProductText(product, servingsByRecipe);
  var productContainer = $('<span />', {'html': productText});
  label.append(productContainer);

  if (Object.keys(product.recipes || {}).length === 0) {
    var removeButton = $('<span />', {
      'data-role': 'remove',
      'click': function() {
        removeProduct(product);
      }
    });
    label.append(removeButton);
  }
  return label;
}

function populateNotifications() {
  db.products.count(total => {
    var empty = total === 0;
    $('header span.notification.shopping-list').toggle(!empty);
    if (empty) return;

    db.basket.count(found => {
      $('header span.notification.shopping-list').text(found + '/' + total);
    });
  });
}

function getProductsByCategory() {
  var products = storage.products.load();
  var productsByCategory = new Map();
  $.each(products, function(productId) {
    var product = products[productId];
    productsByCategory[product.category] = productsByCategory[product.category] || [];
    productsByCategory[product.category].push(product);
  });
  // Move the null category to the end of the map
  if (Object.hasOwnProperty.call(productsByCategory, null)) {
    var product = productsByCategory[null];
    delete productsByCategory[null];
    productsByCategory[null] = product;
  }
  return productsByCategory;
}

function getServingsByRecipe() {
  var meals = storage.meals.load();
  var servingsByRecipe = {};
  $.each(meals, function(date) {
    meals[date].forEach(function (recipe) {
      servingsByRecipe[recipe.id] = servingsByRecipe[recipe.id] || 0;
      servingsByRecipe[recipe.id] += recipe.servings;
    });
  });
  return servingsByRecipe;
}

function renderShoppingList() {
  var shoppingList = $('#shopping-list .products').empty();
  var servingsByRecipe = getServingsByRecipe();
  var productsByCategory = getProductsByCategory();
  $.each(productsByCategory, function(category) {
    if (category === 'null') category = null;
    var products = productsByCategory[category];
    shoppingList.append(renderCategory(category, products, servingsByRecipe));
  });

  localize(shoppingList);
  populateNotifications();
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

    var products = storage.products.load();
    var product = event.params.data.product;
    if (product.product_id in products) return;

    var ingredient = {product: product};
    addProduct(ingredient);
  });
}

$(function() {
  bindShoppingListInput('#shopping-list-entry', 'e.g. rice');

  db.on('changes', changes => { changes.find(c => c.table === 'recipes') && renderShoppingList() });
  db.on('changes', changes => { changes.find(c => c.table === 'meals') && renderShoppingList() });
  db.on('changes', changes => { changes.find(c => c.table === 'ingredients') && renderShoppingList() });

  renderShoppingList();
})
