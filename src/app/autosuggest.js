import 'jquery';
import 'select2';

import 'select2/dist/css/select2.css';

function bindEquipmentInput(element, placeholder) {
  $(element).select2({
    ajax: {
      url: 'api/equipment',
      data: params => ({pre: params.term}),
      processResults: data => ({
        results: data.map(item => ({
          id: item.equipment,
          text: item.equipment,
          product: item
        }))
      })
    },
    minimumInputLength: 3,
    placeholder: placeholder,
    selectOnClose: true
  });
}

function bindIngredientInput(element, placeholder) {
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
}

$(function() {
  bindIngredientInput('#include', 'e.g. tomatoes');
  bindIngredientInput('#exclude', 'e.g. mushrooms');
  bindEquipmentInput('#equipment', 'e.g. slow cooker');

  $(document).on('keyup', '.select2-search__field', function (event) {
    if (event.keyCode == 13) {
      $('#search form button').click();
    }
  });
})
