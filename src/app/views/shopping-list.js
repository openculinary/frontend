import 'jquery';
import 'select2';

import 'select2/dist/css/select2.css';
import './shopping-list.css'

import { addProduct } from '../models/products';
import { storage } from '../storage';

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
})
