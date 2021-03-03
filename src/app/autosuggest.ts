import $ from 'jquery';
import 'select2';

function bindEquipmentInput(element: string, label: string, placeholder: string) {
  $(element).select2({
    ajax: {
      url: '/api/autosuggest/equipment',
      data: (params: any) => ({pre: params.term}),
      processResults: (data: any) => ({
        results: data.map((item: any) => ({
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
  $(element).next('.select2').find('input[type=search]').attr('aria-label', label);
}

function bindIngredientInput(element: string, label: string, placeholder: string) {
  $(element).select2({
    ajax: {
      url: '/api/autosuggest/ingredients',
      data: (params: any) => ({pre: params.term}),
      processResults: (data: any) => ({
        results: data.map((item: any) => ({
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
}

$(() => {
  bindIngredientInput('#include', 'Ingredients to include', 'e.g. tomatoes');
  bindIngredientInput('#exclude', 'Ingredients to exclude', 'e.g. mushrooms');
  bindEquipmentInput('#equipment', 'Kitchen equipment to use', 'e.g. slow cooker');

  $(document).on('keyup', '.select2-search__field', function (event) {
    if (event.which == 13) {
      const selectElement = $(event.target).parents('span.select2').prev('select');
      if (!selectElement.length) return;

      const searchForm = selectElement.parents('#search form');
      if (!searchForm.length) return;

      const suggestionsOpen = !selectElement.select2('isOpen');
      if (suggestionsOpen) return;

      selectElement.select2('close');
      $('#search form button').trigger('click');
    }
  });
})
