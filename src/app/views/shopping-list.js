import 'jquery';
import 'select2';

import 'select2/dist/css/select2.css';
import './shopping-list.css';

import { renderQuantity } from '../conversion';
import { localize } from '../i18n';
import { storage } from '../storage';
import { addProduct, aggregateUnitQuantities, removeProduct } from '../models/products';

function renderProductText(product, mealCounts) {
  var unitQuantities = aggregateUnitQuantities(product, mealCounts);
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

function categoryElement(category) {
  var fieldset = $('<fieldset />', {'class': category});
  $('<legend />', {'data-i18n': `categories:${category}`}).appendTo(fieldset);
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

  storage.products.remove({'hashCode': product.singular});
  storage.products.add({'hashCode': product.singular, 'value': product});
}

function productElement(product, mealCounts) {
  var label = $('<label />', {
    'class': 'product',
    'data-id': product.singular,
    'click': toggleProductState
  });
  $('<input />', {
    'type': 'checkbox',
    'name': 'products[]',
    'value': product.singular,
    'checked': ['available', 'purchased'].includes(product.state)
  }).appendTo(label);

  var productText = renderProductText(product, mealCounts);
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

function populateNotifications(products) {
  var empty = Object.keys(products).length == 0;
  $('header span.notification').toggle(!empty);
  if (empty) return;

  var total = 0, found = 0;
  $.each(products, function(productId) {
    var product = products[productId];
    total += 1;
    found += product.state === 'required' ? 0 : 1;
  });
  $('header span.notification').text(found + '/' + total);
}

function getProductsByCategory(products) {
  var categoriesByProduct = {};
  $.each(products, function(productId) {
    categoriesByProduct[productId] = products[productId].category;
  });
  var productsByCategory = {};
  $.each(categoriesByProduct, function(productId) {
    var category = categoriesByProduct[productId];
    if (!(category in productsByCategory)) productsByCategory[category] = [];
    productsByCategory[category].push(productId);
  });
  return productsByCategory;
}

function getMealCounts() {
  var meals = storage.meals.load();
  var mealCounts = {};
  $.each(meals, function(date) {
    meals[date].forEach(function (meal) {
      if (!(meal.id in mealCounts)) mealCounts[meal.id] = 0;
      mealCounts[meal.id]++;
    });
  });
  return mealCounts;
}

function renderShoppingList() {
  var products = storage.products.load();
  var productsHtml = $('#shopping-list .products').empty();
  var finalCategoryGroup = null;
  var mealCounts = getMealCounts();
  var productsByCategory = getProductsByCategory(products);
  $.each(productsByCategory, function(category) {
    if (category === 'null') category = null;
    var categoryGroup = categoryElement(category);
    productsByCategory[category].forEach(function(productId) {
      var product = products[productId];
      productElement(product, mealCounts).appendTo(categoryGroup);
    });
    if (category) categoryGroup.appendTo(productsHtml);
    else finalCategoryGroup = categoryGroup;
  });
  if (finalCategoryGroup) finalCategoryGroup.appendTo(productsHtml);

  localize(productsHtml);
  populateNotifications(products);
}

function bindShoppingListInput(element, placeholder) {
  $(element).select2({
    ajax: {
      url: 'api/ingredients',
      data: params => ({pre: params.term}),
      processResults: data => ({
        results: data.map(item => ({
          id: item.singular,
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
    if (product.singular in products) return;

    addProduct(product);
  });
}

$(function() {
  bindShoppingListInput('#shopping-list-entry', 'e.g. rice');

  storage.meals.on('state changed', renderShoppingList);
  storage.products.on('state changed', renderShoppingList);
})
