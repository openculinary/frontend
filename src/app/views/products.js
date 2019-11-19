import 'jquery';
import 'bootstrap-3-typeahead';
import 'bootstrap-tagsinput';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-tagsinput/dist/bootstrap-tagsinput.css'
import './products.css'

import { addProduct } from '../pages/products';
import { storage } from '../storage';

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
