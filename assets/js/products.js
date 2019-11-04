function bindShoppingListInput(element) {
  $(element).tagsinput({
    freeInput: false,
    itemText: 'product',
    itemValue: 'singular',
    typeahead: {
      minLength: 3,
      source: function(query) {
        return $.getJSON('api/ingredients', {pre: query});
      },
      afterSelect: function() {
        this.$element[0].value = '';
      }
    }
  });
  $(element).on('beforeItemAdd', function(event) {
    event.cancel = true;

    var products = storage.products.load();
    var product = event.item;
    if (product.singular in products) return;

    addProduct(product);
  });
}
bindShoppingListInput('#shopping-list-entry');

function aggregateUnitQuantities(product, mealCounts) {
  var unitQuantities = {};
  $.each(product.recipes, function(recipeId) {
    var multiple = mealCounts[recipeId] || 1;
    product.recipes[recipeId].amounts.forEach(function (amount) {
      if (!amount.units) amount.units = '';
      if (!(amount.units in unitQuantities)) unitQuantities[amount.units] = 0;
      unitQuantities[amount.units] += amount.quantity * multiple;
    });
  });
  $.each(unitQuantities, function(unit) {
    if (unitQuantities[unit] === 0) delete unitQuantities[unit];
  });
  return unitQuantities;
}

function renderProductText(product, mealCounts) {
  var unitQuantities = aggregateUnitQuantities(product, mealCounts);
  var productText = '';
  $.each(unitQuantities, function(unit) {
    if (productText) productText += ' + ';
    productText += float2rat(unitQuantities[unit]) + ' ' + unit;
  });
  productText += ' ' + product.product;
  return productText;
}

function categoryElement(category) {
  category = category || 'Other';
  var fieldset = $('<fieldset />', {'class': category.toLowerCase()});
  $('<legend />', {'text': category}).appendTo(fieldset);
  return fieldset;
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
  $('<span />', {'text': productText}).appendTo(label);

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

function renderProducts() {
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

  populateNotifications(products);
}

function addProduct(product, recipeId) {
  var products = storage.products.load();
  if (product.singular in products) {
    product.category = products[product.singular].category;
  }
  if (!product.state) {
    product.state = 'required';
  }
  if (!product.recipes) {
    product.recipes = {};
  }

  if (recipeId) {
    if (!(recipeId in product.recipes)) {
      product.recipes[recipeId] = {amounts: []};
    }
    product.recipes[recipeId].amounts.push({
      quantity: product.quantity,
      units: product.units
    });
  }

  storage.products.remove({'hashCode': product.singular});
  storage.products.add({'hashCode': product.singular, 'value': product});
}

function removeProduct(product, recipeId) {
  if (recipeId) delete product.recipes[recipeId];
  if (Object.keys(product.recipes).length) return;

  storage.products.remove({'hashCode': product.singular});
}

$(function() {
  storage.products.on('state changed', renderProducts);
});
