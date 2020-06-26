import 'jquery';
import 'select2';

import { renderQuantity } from '../conversion';
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
    product.recipes[recipeId].amounts.forEach(function (amount) {
      if (!amount.units) amount.units = '';
      if (!(amount.units in unitQuantities)) unitQuantities[amount.units] = 0;
      unitQuantities[amount.units] += (amount.quantity * requestedServings) / defaultServings;
    });
  });
  $.each(unitQuantities, function(unit) {
    if (unitQuantities[unit] === 0) delete unitQuantities[unit];
  });
  return unitQuantities;
}

function renderProductText(product, recipeServings) {
  var unitQuantities = aggregateUnitQuantities(product, recipeServings);
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

function renderCategory(category) {
  var fieldset = $('<fieldset />', {'class': category});
  $('<legend />', {'data-i18n': `[html]categories:${category}`}).appendTo(fieldset);
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

  var transitions = {
    undefined: 'purchased',
    'available': 'required',
    'required': 'purchased',
    'purchased': 'required'
  };
  product.state = transitions[product.state];

  storage.products.remove({'hashCode': product.product_id});
  storage.products.add({'hashCode': product.product_id, 'value': product});
}

function productElement(product, recipeServings) {
  var label = $('<label />', {
    'class': 'product',
    'data-id': product.product_id,
    'click': toggleProductState
  });
  $('<input />', {
    'type': 'checkbox',
    'name': 'products[]',
    'value': product.product_id,
    'checked': ['available', 'purchased'].includes(product.state)
  }).appendTo(label);

  var productText = renderProductText(product, recipeServings);
  $('<span />', {'html': productText}).appendTo(label);

  if (Object.keys(product.recipes || {}).length === 0) {
    $('<span />', {
      'data-role': 'remove',
      'click': function() {
        removeProduct(product);
      }
    }).appendTo(label);
  }
  return label;
}

function populateNotifications() {
  var products = storage.products.load();
  var empty = Object.keys(products).length == 0;
  $('header span.notification.shopping-list').toggle(!empty);
  if (empty) return;

  var total = 0, found = 0;
  $.each(products, function(productId) {
    var product = products[productId];
    total += 1;
    found += product.state === 'required' ? 0 : 1;
  });
  $('header span.notification.shopping-list').text(found + '/' + total);
}

function getProductsByCategory() {
  var products = storage.products.load();
  var productsByCategory = new Map();
  $.each(products, function(productId) {
    var product = products[productId];
    productsByCategory[product.category] = productsByCategory[product.category] || [];
    productsByCategory[product.category].push(product);
  });
  return productsByCategory;
}

function getRecipeServings() {
  var meals = storage.meals.load();
  var recipeServings = {};
  $.each(meals, function(date) {
    meals[date].forEach(function (recipe) {
      if (!(recipe.id in recipeServings)) recipeServings[recipe.id] = 0;
      recipeServings[recipe.id] += recipe.servings;
    });
  });
  return recipeServings;
}

function renderShoppingList() {
  var shoppingList = $('#shopping-list .products').empty();
  var finalCategoryGroup = null;
  var recipeServings = getRecipeServings();
  var productsByCategory = getProductsByCategory();
  $.each(productsByCategory, function(category) {
    if (category === 'null') category = null;
    var categoryProducts = productsByCategory[category];
    var categoryGroup = renderCategory(category);
    categoryProducts.forEach(function(product) {
      categoryGroup.append(productElement(product, recipeServings))
    });
    if (category) shoppingList.append(categoryGroup);
    else finalCategoryGroup = categoryGroup;
  });
  if (finalCategoryGroup) shoppingList.append(finalCategoryGroup);

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

  storage.meals.on('state changed', renderShoppingList);
  storage.products.on('state changed', renderShoppingList);
})
