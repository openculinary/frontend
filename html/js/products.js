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

    var products = loadProducts();
    var product = event.item;
    if (product.singular in products) return;

    addProduct(products, product);

    storeProducts(products);
    renderProducts(products);
  });
}
bindShoppingListInput('#shopping-list-entry');

function loadProducts() {
  return JSON.parse(window.localStorage.getItem('products')) || {};
}

function storeProducts(products) {
  window.localStorage.setItem('products', JSON.stringify(products));
}

function aggregateUnitQuantities(product) {
  var recipes = loadRecipes();
  var unitQuantities = {};
  $.each(product.recipes, function(recipeId) {
    if (!(recipeId in recipes)) return;
    var multiple = recipes[recipeId].multiple || 1;
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

function renderProductText(product) {
  var unitQuantities = aggregateUnitQuantities(product);
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

function toggleProductState(productId) {
  var products = loadProducts();
  var product = products[productId];

  var transitions = {
    undefined: 'purchased',
    'available': 'purchased',
    'required': 'purchased',
    'purchased': 'required'
  };
  product.state = transitions[product.state];

  if (productCollab) {
    productCollab.remove({'hashCode': product.singular});
    productCollab.add({'hashCode': product.singular, 'value': product});
  }

  storeProducts(products);
  renderProducts(products);
}

function productElement(product) {
  var label = $('<label />', {
    'click': function() {
      toggleProductState(product.singular);
    }
  });
  $('<input />', {
    'type': 'checkbox',
    'name': 'products[]',
    'value': product.singular,
    'checked': ['available', 'purchased'].includes(product.state)
  }).appendTo(label);

  var productText = renderProductText(product);
  $('<span />', {'text': productText}).appendTo(label);

  if (Object.keys(product.recipes || {}).length === 0) {
    $('<span />', {
      'data-role': 'remove',
      'click': function() {
        var products = loadProducts();
        removeProduct(products, product);

        storeProducts(products);
        renderProducts(products);
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

function updateReminderState(products) {
  var empty = Object.keys(products).length == 0;
  $('button[data-target="#reminder').prop('disabled', empty);
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

function renderProducts(products) {
  var productsHtml = $('#shopping-list .products').empty();
  var finalCategoryGroup = null;
  var productsByCategory = getProductsByCategory(products);
  $.each(productsByCategory, function(category) {
    if (category === 'null') category = null;
    var categoryGroup = categoryElement(category);
    productsByCategory[category].forEach(function(productId) {
      var product = products[productId];
      productElement(product).appendTo(categoryGroup);
    });
    if (category) categoryGroup.appendTo(productsHtml);
    else finalCategoryGroup = categoryGroup;
  });
  if (finalCategoryGroup) finalCategoryGroup.appendTo(productsHtml);

  populateNotifications(products);
  updateReminderState(products);
}

function addProduct(products, product, recipeId) {
  if (!(product.singular in products)) {
    products[product.singular] = {
      product: product.product,
      category: product.category,
      singular: product.singular,
      plural: product.plural,
      state: product.state || 'required',
      recipes: {}
    }
  }

  if (recipeId) {
    var productRecipes = products[product.singular].recipes;
    if (!(recipeId in productRecipes)) {
      productRecipes[recipeId] = {amounts: []};
    }
    productRecipes[recipeId].amounts.push({
      quantity: product.quantity,
      units: product.units
    });
  }

  if (productCollab) {
    productCollab.add({'hashCode': product.singular, 'value': products[product.singular]});
  }
}

function removeProduct(products, product, recipeId) {
  if (recipeId) delete product.recipes[recipeId];
  if (Object.keys(product.recipes).length) return;
  delete products[product.singular];

  if (productCollab) {
    productCollab.remove({'hashCode': product.singular});
  }
}

$(function () {
  var products = loadProducts();
  renderProducts(products);
});
