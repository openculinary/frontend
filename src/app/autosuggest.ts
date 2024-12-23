import * as $ from 'jquery';
import select2 from 'select2';

export {};

function bindIngredientInput(element: string, label: string, placeholder: string) : void {
  select2 && new select2($(element), {
    ajax: {
      url: '/api/autosuggest/ingredients',
      data: params => ({pre: params.term}),
      processResults: data => ({
        results: data.map(item => ({
          id: item.singular,
          text: item.name,
          product: item
        }))
      })
    },
    minimumInputLength: 3,
    placeholder: placeholder,
    selectOnClose: true
  });

  // TODO: Revisit once https://github.com/select2/select2/issues/3744 is handled
  $(element).next('.select2').find('input[type=search]').attr('aria-label', label);

  // TODO: https://github.com/openculinary/frontend/issues/239 - report upstream?
  $(element).on('select2:unselect', function(evt) {
    evt.params.data.element.remove();
  });
}

$(function() {
  bindIngredientInput('#include', 'Ingredients to include', 'e.g. tomatoes');
  bindIngredientInput('#exclude', 'Ingredients to exclude', 'e.g. mushrooms');

  $(document).on('keyup', '.select2-search__field', function (event) {
    if (event.which == 13) {
      const selectElement = $(event.target).parents('span.select2').prev('select');
      if (!selectElement.length) return;

      const searchForm = selectElement.parents('#search form');
      if (!searchForm.length) return;

      const suggestionsOpen = !selectElement.select2('isOpen');
      if (suggestionsOpen) return;

      selectElement.select2('close');
      $('#search form button[type=submit]').trigger('click');
    }
  });

  $('#search form').show();

  // TODO: Remove after upgrading to select2 v4.1.0
  $('#search select').trigger('change');
})
