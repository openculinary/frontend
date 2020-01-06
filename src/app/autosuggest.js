import 'jquery';
import 'select2';

import 'select2/dist/css/select2.css';

function bindEquipmentInput(element, label, placeholder) {
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

  // TODO: Revisit once https://github.com/select2/select2/issues/3744 is handled
  $(element).siblings('.select2').find('input[type=search]').attr('aria-label', label);
}

function bindIngredientInput(element, label, placeholder) {
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

  // TODO: Revisit once https://github.com/select2/select2/issues/3744 is handled
  $(element).siblings('.select2').find('input[type=search]').attr('aria-label', label);
}

$(function() {
  bindIngredientInput('#include', 'Ingredients to include', 'e.g. tomatoes');
  bindIngredientInput('#exclude', 'Ingredients to exclude', 'e.g. mushrooms');
  bindEquipmentInput('#equipment', 'Kitchen equipment to use', 'e.g. slow cooker');

  $(document).on('keyup', '.select2-search__field', function (event) {
    if (event.keyCode == 13) {
      $('#search form button').trigger('click');
    }
  });
})
