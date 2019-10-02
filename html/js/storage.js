var storage = {
  recipes: null,
  meals: null,
  products: null,
};

function populateStorage() {
  $.each(storage, function (model) {
    var stored = window.localStorage.getItem(model);
    stored = JSON.parse(stored) || {}
    stored = new Map(Object.entries(stored));
    storage[model].apply(stored);
  });
}

$(function () {
  $.each(storage, function (model) {
    RWLWWSet = window.deltaCrdts('rwlwwset')
    var modelStorage = RWLWWSet(model);
    wrapMutators(modelStorage);

    modelStorage.load = function() {
      var items = {};
      modelStorage.value().forEach(function (item) {
        items[item.hashCode] = item.value;
      });
      return items;
    };

    modelStorage.save = function() {
      var items = Object.fromEntries(modelStorage.state());
      window.localStorage.setItem(model, JSON.stringify(items));
    };

    storage[model] = modelStorage;
    storage[model].on('state changed', storage[model].save);
  });
});
