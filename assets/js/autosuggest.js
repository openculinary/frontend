function bindEquipmentInput(element) {
  $(element).tagsinput({
    allowDuplicates: false,
    freeInput: false,
    itemText: 'equipment',
    itemValue: 'equipment',
    maxTags: 20,
    tagClass: 'badge badge-info',
    typeahead: {
      minLength: 3,
      source: function(query) {
        return $.getJSON('api/equipment', {pre: query});
      },
      afterSelect: function() {
        this.$element[0].value = '';
      }
    }
  });
}
bindEquipmentInput('#equipment');

function bindIngredientInput(element) {
  $(element).tagsinput({
    allowDuplicates: false,
    freeInput: false,
    itemText: 'product',
    itemValue: 'singular',
    maxTags: 20,
    tagClass: 'badge badge-info',
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
}
bindIngredientInput('#include');
bindIngredientInput('#exclude');
